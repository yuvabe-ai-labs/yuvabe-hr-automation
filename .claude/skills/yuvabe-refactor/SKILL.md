---
name: yuvabe-refactor
description: Step-by-step migration guide for moving Yuvabe ATS from the old lib/*-store.ts anti-pattern to the clean layered architecture. Activate when user says "refactor [domain]", "migrate [X] to clean arch", "clean up the store", "extract the repository", or similar. Covers one domain at a time: jobs, applications, candidates, or notes.
---

# Yuvabe — Refactor Recipe

## When to use this skill

Trigger phrases: "refactor jobs", "migrate applications to clean arch", "clean up the store", "extract the repository", "move jobs to new pattern"

**Scope rule: one domain per PR.** Do not refactor multiple stores at once.

---

## The anti-patterns being eliminated

These files are the old pattern. Never copy them as a reference for new code.

| File | Problem |
|---|---|
| `lib/jobs-store.ts` | Supabase calls mixed with business logic (nanoid retry). No repository abstraction. |
| `lib/candidates-store.ts` | Same — Supabase calls directly in store functions |
| `lib/applications-store.ts` | Same — plus mapRowToApplication() that should be in a repository mapper |
| `lib/notes-store.ts` | Same — only store, no service or hook |
| `services/jobs.service.ts` | Imports `getSupabasePeopleClient()` directly — service layer violation |
| `services/applications.service.ts` | Same violation + `mapRowToApplication()` in wrong file |
| `services/candidates.service.ts` | Same violation |
| `hooks/use-jobs.ts` | Inline query key strings instead of key factory |
| `hooks/use-applications.ts` | Same |

---

## Progress checklist

Copy this for the domain being refactored:

```
Domain: ___________
- [ ] Step 1: Read and map existing code
- [ ] Step 2: Create repositories/<domain>.repository.ts
- [ ] Step 3: Update services/<domain>.service.ts
- [ ] Step 4: Create schemas/<domain>.schema.ts (Zod)
- [ ] Step 5: Update types/<domain>.ts (z.infer)
- [ ] Step 6: Add <domain>Keys to constants/query-keys.ts
- [ ] Step 7: Update hooks to use key factory
- [ ] Step 8: Verify, deprecate, update CLAUDE.md
```

---

## Step 1 — Read and map existing code

Before touching anything, answer:

1. What functions exist in `lib/<domain>-store.ts`? List each.
2. Which functions are pure DB access (SELECT/INSERT/UPDATE/DELETE only)?
3. Which functions contain business logic (nanoid, retry loops, data enrichment, scoring)?
4. Are there callers in `app/api/` that import the old store directly?
5. What does `services/<domain>.service.ts` do that the store doesn't (or vice versa)?
6. Where is the row mapper (`mapRowToX`) currently? (It needs to move to the repository.)

Document this map before writing any code.

---

## Step 2 — Create `repositories/<domain>.repository.ts`

Pull ALL raw DB access into the repository. Apply `yuvabe-repository-pattern` for the exact template.

```ts
// repositories/jobs.repository.ts
import { getSupabasePeopleClient } from '@/integrations/supabase-people'
import type { Job } from '@/types/jobs'

// JobRow stays in this file — never exported
type JobRow = { id: string; code: string; title: string; ... }

// Row mapper lives here — move it from the service file
function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    // null → undefined for optional fields
    publishedAt: row.published_at ?? undefined,
  }
}

export const jobsRepository = {
  async findAll(opts?: { status?: string }): Promise<Job[]> { ... },
  async findByCode(code: string): Promise<Job | null> { ... },
  async create(input: { ... }): Promise<Job> { ... },
  async updateStatus(code: string, status: string): Promise<Job | null> { ... },
}
```

**If business logic exists in the old store** (e.g. nanoid retry loop in `lib/jobs-store.ts`), leave a comment in the repository:
```ts
// Business logic (code generation, retry on collision) is in services/jobs.service.ts
```

---

## Step 3 — Update `services/<domain>.service.ts`

Replace all `getSupabasePeopleClient()` calls with calls to the repository. Move any business logic that was in the old store into the service.

```ts
// services/jobs.service.ts — AFTER
import { jobsRepository } from '@/repositories/jobs.repository'
import { nanoid } from 'nanoid'

// No Supabase import — the service never touches the DB directly
export async function listJobs(opts?: { status?: string }) {
  return jobsRepository.findAll(opts)
}

export async function createJob(input: CreateJobInput) {
  // Business logic (nanoid retry) lives here
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(6).toUpperCase()
    try {
      return await jobsRepository.create({ ...input, code, status: 'draft' })
    } catch { if (attempt === 4) throw new Error('Could not generate unique job code') }
  }
}
```

Remove the `mapRowToJob()` function from the service — it now lives in the repository.

---

## Step 4 — Create `schemas/<domain>.schema.ts`

Map the existing TypeScript interface to a Zod schema. This becomes the source of truth.

```ts
// schemas/jobs.schema.ts
import { z } from 'zod'

// Zod v4: { error: '...' } not { message: '...' }
export const JobStatusSchema = z.enum(['draft', 'active', 'paused', 'closed'])

export const JobSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string().min(1, { error: 'Title is required' }),
  description: z.string(),
  criteria: z.array(z.unknown()),
  status: JobStatusSchema,
  createdAt: z.string(),
  publishedAt: z.string().optional(),
})

export const CreateJobSchema = JobSchema.omit({ id: true, code: true, createdAt: true })
```

---

## Step 5 — Update `types/<domain>.ts`

Replace hand-written interfaces with `z.infer<>`:

```ts
// types/jobs.ts — BEFORE
export type Job = {
  id: string
  code: string
  title: string
  // ...
}

// types/jobs.ts — AFTER
import type { z } from 'zod'
import type { JobSchema, CreateJobSchema } from '@/schemas/jobs.schema'

export type Job = z.infer<typeof JobSchema>
export type CreateJobInput = z.infer<typeof CreateJobSchema>
// Remove JobRow — it lives in the repository now
```

---

## Step 6 — Add to `constants/query-keys.ts`

Create the file if it doesn't exist. Add the domain's key factory:

```ts
// constants/query-keys.ts
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters?: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (code: string) => [...jobKeys.details(), code] as const,
}
```

Consult `yuvabe-react-query` for the full key factory shape for each domain.

---

## Step 7 — Update hooks to use the key factory

Replace inline query key arrays with factory calls:

```ts
// hooks/use-jobs.ts — BEFORE
queryKey: ['jobs', 'detail', code]

// hooks/use-jobs.ts — AFTER
import { jobKeys } from '@/constants/query-keys'
queryKey: jobKeys.detail(code)
```

If the hook is in `hooks/use-jobs.ts` (old location), consider moving it to `features/jobs/hooks/use-jobs.ts` (new location). If the PR is already large, note it as a follow-up.

---

## Step 8 — Verify, deprecate, update CLAUDE.md

**Grep for remaining callers of the old store:**
```
grep -r "from.*lib/jobs-store" app/ hooks/ services/ features/ components/
```

For each remaining caller:
- API routes: update to call the service instead
- Other files: trace the call chain and update

**When a store function has zero callers**, add `// @deprecated — migrated to jobsRepository` to it. Schedule deletion for the next PR — do not delete in the same PR as the refactor.

**Update `CLAUDE.md`:** Move the domain from "Not yet migrated" to a new "Migrated" section in `§ Migration status`.

---

## Domain-specific notes

### Jobs
- `services/jobs.service.ts` has `mapRowToJob()` — move it to the repository
- `lib/jobs-store.ts` has a nanoid retry loop in `createJob()` — move it to the service
- Inline key `['jobs', 'list']` in `hooks/use-jobs.ts` — replace with `jobKeys.list()`

### Applications
- `services/applications.service.ts` has `mapRowToApplication()` with criterionLabel cleanup — move to repository
- The dual-query pattern (status counts + list) is business logic — stays in the service
- The `getApplicationsByJobCode` function has sorting + enrichment — sorting belongs in the repository, enrichment in the service

### Candidates
- Clean and lean — `lib/candidates-store.ts` and `services/candidates.service.ts` both exist; consolidate into one clean pair
- The upsert logic is business logic (merge on email) — stays in the service

### Notes
- Only `lib/notes-store.ts` exists — no service, no hook, no types
- When adding notes to the UI: start at Step 2 (repository), work forward
- This is the cleanest migration — no dual-implementation confusion
