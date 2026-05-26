---
name: yuvabe-feature-scaffold
description: Use before adding a new feature domain to Yuvabe ATS. Provides the step-by-step recipe for creating a feature with proper layered structure — schema → repository → service → query keys → hooks → components → page. Activate when user says "add feature", "new feature", "build X feature", or when scaffolding a new domain area. For migrating existing lib/*-store.ts files, use yuvabe-refactor instead.
---

# Yuvabe — Feature Scaffold Recipe

This skill is for **new features**. If you are migrating existing `lib/*-store.ts` files, use `yuvabe-refactor` instead.

## Feature module structure

```
features/jobs/
  hooks/               — TanStack Query hooks for this feature
    use-jobs.ts
    use-job.ts
    use-create-job.ts

repositories/
  jobs.repository.ts   — DB access only

services/
  jobs.service.ts      — business logic

schemas/
  jobs.schema.ts       — Zod schema (source of truth)

types/
  jobs.ts              — z.infer<> types only

constants/
  query-keys.ts        — add the domain's key factory here
```

---

## Step-by-step recipe

### Step 1: Define the Zod schema

Create `schemas/<entity>.schema.ts`:

```ts
import { z } from 'zod'

export const JobStatusSchema = z.enum(['draft', 'active', 'paused', 'closed'])
export type JobStatus = z.infer<typeof JobStatusSchema>

export const CriterionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(200),
  importance: z.enum(['must', 'preferred', 'nice']),
})

export const JobSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(20),
  criteria: z.array(CriterionSchema),
  status: JobStatusSchema,
  createdAt: z.string(),
  publishedAt: z.string().optional(),
})

export const CreateJobSchema = JobSchema.omit({ id: true, code: true, createdAt: true })
```

> **Zod v4 note:** This project uses Zod v4. Error messages use `{ error: 'text' }` not `{ message: 'text' }`. `.strict()` is a method on the object schema, not a separate import.

### Step 2: Infer types

Create `types/<entity>.ts`:

```ts
import type { z } from 'zod'
import type { JobSchema, CreateJobSchema, CriterionSchema } from '@/schemas/jobs.schema'

export type Job = z.infer<typeof JobSchema>
export type CreateJobInput = z.infer<typeof CreateJobSchema>
export type Criterion = z.infer<typeof CriterionSchema>
```

No hand-written interfaces. Always `z.infer<>`.

### Step 3: Add query keys

Add to `constants/query-keys.ts` (create the file if it doesn't exist):

```ts
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters?: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (code: string) => [...jobKeys.details(), code] as const,
}
```

### Step 4: Write the repository

Create `repositories/<entity>.repository.ts`. See `yuvabe-repository-pattern` for the full template.

Rules:
- Export a plain object (`export const jobsRepository = { ... }`)
- Raw DB row type (`type JobRow`) stays in the file — not exported
- Row mapper (`rowToJob`) lives here
- Throws on Supabase error
- No business logic

### Step 5: Write the service

Create `services/<entity>.service.ts`:

```ts
import { jobsRepository } from '@/repositories/jobs.repository'
import { nanoid } from 'nanoid'
import type { Job, CreateJobInput } from '@/types/jobs'

export async function listJobs(opts?: { status?: string }): Promise<Job[]> {
  return jobsRepository.findAll(opts)
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  // Business logic lives in the service — not the repository
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(6).toUpperCase()
    try {
      return await jobsRepository.create({ ...input, code, status: 'draft' })
    } catch { if (attempt === 4) throw new Error('Could not generate unique job code') }
  }
  throw new Error('unreachable')
}
```

### Step 6: Write feature hooks

Create in `features/<domain>/hooks/`:

```ts
// features/jobs/hooks/use-jobs.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobKeys } from '@/constants/query-keys'
import { listJobs, createJob } from '@/services/jobs.service'

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => listJobs(filters),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  })
}
```

### Step 7: Write feature components

Create in `features/<domain>/components/` or in `app/<route>/_components/` for route-private components.

Before writing any `.tsx`:
1. Load `yuvabe-design-system`
2. If rendering a list/table: load `yuvabe-interaction-design`

Components use hooks — they never call services or repositories directly.

### Step 8: Wire into pages

Pages in `app/(route)/` use Server Components by default. For pages with interactive client components, pre-fetch on the server:

```ts
// app/jobs/page.tsx (Server Component)
import { listJobs } from '@/services/jobs.service'

export default async function JobsPage() {
  const jobs = await listJobs({ status: 'active' })
  return <JobsList initialJobs={jobs} />
}
```

---

## What NOT to do

```ts
// ❌ Component importing service directly
import { listJobs } from '@/services/jobs.service'

// ❌ Hook importing repository directly
import { jobsRepository } from '@/repositories/jobs.repository'

// ❌ Schema defined inside a component
function MyForm() {
  const schema = z.object({ title: z.string() }) // move to schemas/
}

// ❌ Duplicate types across features and types/
// Define once in types/, import everywhere

// ❌ Inline query key
useQuery({ queryKey: ['jobs', 'list'], queryFn: ... })
```
