---
name: yuvabe-repository-pattern
description: Use before writing any repository, service, or data-access file in Yuvabe ATS. Enforces the strict layered architecture — repositories own DB access, services own business logic, hooks wire React Query. The most critical architectural skill. Activate before writing *.repository.ts, *.service.ts, or any file that imports from @supabase/supabase-js, @/lib/supabase, or @/integrations/supabase-people.
---

# Yuvabe — Repository + Service Pattern

## The architecture contract

```
UI components
  └── Feature hooks (TanStack Query)  [features/<domain>/hooks/]
        └── Services (business logic) [services/]
              └── Repositories (DB access only) [repositories/]
                    └── Supabase client [lib/supabase.ts or integrations/supabase-people.ts]
```

**Violations that must never appear:**
- A component file importing from `@/repositories/`, `@/lib/supabase`, or `@/integrations/supabase-people`
- A service file calling `supabase.from(...)` directly (any Supabase client import in services/)
- A hook file calling a repository directly (must go through a service)
- A repository file containing business logic (`if` branching on domain data, nanoid generation, scoring)

---

## The two Supabase clients

| Client | File | Key type | Use in |
|---|---|---|---|
| Server-only | `lib/supabase.ts` | Service-role secret key | Repositories called from API routes or Server Components |
| Client-safe | `integrations/supabase-people.ts` | Anon/publishable key | Repositories called from client-side hooks |

**Only repositories may import either client.** Services and components never import them.

---

## Repository anatomy

```ts
// repositories/jobs.repository.ts
// PURPOSE: Raw DB access for the jobs table. The only file that knows Supabase
// column names and the query builder for this domain.

import { getSupabasePeopleClient } from '@/integrations/supabase-people'
import type { Job } from '@/types/jobs'

// JobRow: raw Supabase shape. Stays in this file only — never exported.
type JobRow = {
  id: string
  code: string
  title: string
  description: string
  criteria: unknown[]
  status: string
  created_at: string
  published_at: string | null
}

// Row mapper lives in the repository — the only place that knows column names.
function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    criteria: row.criteria as Job['criteria'],
    status: row.status as Job['status'],
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined,
  }
}

export const jobsRepository = {
  async findAll(opts?: { status?: string }): Promise<Job[]> {
    const supabase = getSupabasePeopleClient()
    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false })
    if (opts?.status) query = query.eq('status', opts.status)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch jobs: ${error.message}`)
    return data.map(rowToJob)
  },

  async findByCode(code: string): Promise<Job | null> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('code', code)
      .single()
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch job: ${error.message}`)
    return data ? rowToJob(data) : null
  },

  async create(input: { code: string; title: string; description: string; criteria: unknown[]; status: string }): Promise<Job> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase.from('jobs').insert(input).select().single()
    if (error) throw new Error(`Failed to create job: ${error.message}`)
    return rowToJob(data)
  },
}
```

**Repository checklist:**
- [ ] Exports a plain object — not a class, not individual functions as default export
- [ ] `type JobRow` declared inside the file, never exported
- [ ] `rowToJob()` mapper is here (not in the service)
- [ ] Throws `new Error(...)` on Supabase error — never returns `undefined` silently
- [ ] Function names: `findAll`, `findById`, `findByCode`, `create`, `update`, `upsert`, `remove`
- [ ] No business logic: no `nanoid`, no scoring, no domain validation, no retry loops
- [ ] Handles `PGRST116` (not found) as `null` return, not thrown error

---

## Service anatomy

Services own business logic + orchestration. They call repositories; never Supabase directly.

```ts
// services/jobs.service.ts
import { jobsRepository } from '@/repositories/jobs.repository'
import { nanoid } from 'nanoid'
import type { Job } from '@/types/jobs'

export async function listJobs(opts?: { status?: string }): Promise<Job[]> {
  return jobsRepository.findAll(opts)
}

export async function getJob(code: string): Promise<Job> {
  const job = await jobsRepository.findByCode(code)
  if (!job) throw new Error(`Job ${code} not found`)
  return job
}

export async function createJob(input: { title: string; description: string; criteria: unknown[] }): Promise<Job> {
  // Business logic (code generation + uniqueness retry) lives here, not in repository
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(6).toUpperCase()
    try {
      return await jobsRepository.create({ ...input, code, status: 'draft' })
    } catch (e) {
      // retry only on unique constraint violation
      if (attempt === 4) throw e
    }
  }
  throw new Error('Could not generate unique job code')
}
```

**Service checklist:**
- [ ] Calls `jobsRepository.*` — never `supabase.from(...)` directly
- [ ] No import of `@supabase/supabase-js`, `@/lib/supabase`, or `@/integrations/supabase-people`
- [ ] Business logic lives here: code generation, retries, domain orchestration
- [ ] Throws meaningful errors with context
- [ ] Can call multiple repositories for orchestration

---

## Row mapping rules

- Mapper function `rowToJob()` lives **in the repository file** — never in the service, never in a hook
- Maps snake_case DB columns → camelCase domain fields
- Converts `null` → `undefined` for optional fields (`row.published_at ?? undefined`)
- JSONB columns that return as `any` from Supabase get cast with a type assertion in the mapper — document why with a comment
- Never use `as any` — use the actual expected type

---

## Anti-patterns

```ts
// ❌ Service importing Supabase directly (current violation in services/)
import { getSupabasePeopleClient } from '@/integrations/supabase-people'
export async function listJobs() {
  const supabase = getSupabasePeopleClient()  // ← belongs in repository
  const { data } = await supabase.from('jobs').select('*')
  return data
}

// ❌ Component calling repository directly
import { jobsRepository } from '@/repositories/jobs.repository'
function JobsPage() { const jobs = await jobsRepository.findAll() }

// ❌ Repository with business logic
export const jobsRepository = {
  async findActive() {
    const jobs = await this.findAll()
    return jobs.filter(j => j.applicationCount > 10) // ← service territory
  }
}

// ❌ Hook calling repository directly (bypassing service)
import { jobsRepository } from '@/repositories/jobs.repository'
export function useJobs() {
  return useQuery({ queryKey: jobKeys.lists(), queryFn: jobsRepository.findAll })
}

// ❌ mapRowToJob() in the service file
// services/jobs.service.ts
function mapRowToJob(row) { ... } // ← move to repository
```

---

## Migration note

The existing `lib/*-store.ts` files are the old pattern — they call Supabase directly and mix DB access with business logic. When migrating one:

1. Extract the raw Supabase queries → `repositories/<domain>.repository.ts`
2. Move the row mapper (`mapRowToX`) from the service into the repository
3. Move business logic (nanoid, retries, data orchestration) into the service
4. Update the service to call the repository, remove the Supabase client import
5. Grep for remaining callers of the old store and update them

Use the `yuvabe-refactor` skill for the full step-by-step recipe.
