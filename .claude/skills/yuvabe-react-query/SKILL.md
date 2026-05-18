---
name: yuvabe-react-query
description: Use before writing any TanStack Query hook, mutation, or cache-management code in Yuvabe ATS. Covers query key factory, staleTime strategy, cache invalidation, optimistic updates, and the correct v5 API. Activate proactively before writing useQuery, useMutation, or any file importing from @tanstack/react-query.
---

# Yuvabe — TanStack React Query v5 Patterns

## Query key factory (single source of truth)

All query keys live in `constants/query-keys.ts`. **Never define inline key arrays in hooks or components.**

```ts
// constants/query-keys.ts
import type { JobFilters, ApplicationFilters } from '@/types'

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters?: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (code: string) => [...jobKeys.details(), code] as const,
}

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (jobCode: string, filters?: ApplicationFilters) => [...applicationKeys.lists(), jobCode, filters] as const,
  allCross: () => [...applicationKeys.all, 'all-jobs'] as const,
  allCrossList: (filters?: ApplicationFilters) => [...applicationKeys.allCross(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
}

export const candidateKeys = {
  all: ['candidates'] as const,
  detail: (id: string) => [...candidateKeys.all, 'detail', id] as const,
}
```

---

## QueryClient defaults

Set in `app/providers.tsx` — not per-query:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // data fresh for 1 min, no refetch
      gcTime: 300_000,            // cache retained for 5 min after unmount
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Standard query hook pattern

```ts
// features/jobs/hooks/use-jobs.ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { jobKeys } from '@/constants/query-keys'
import { listJobs } from '@/services/jobs.service'
import type { JobFilters } from '@/types/jobs'

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => listJobs(filters),
    // Don't override staleTime here unless there's a specific reason to deviate
  })
}

export function useJob(code: string) {
  return useQuery({
    queryKey: jobKeys.detail(code),
    queryFn: () => getJob(code),
    enabled: Boolean(code),        // guard: don't fetch if code is empty
  })
}
```

**Destructuring pattern (v5):**
```ts
const { data: jobs, isPending, isError, error } = useJobs()
// isPending = no data yet (first load; replaces v4's isLoading)
// isFetching = background refetch
// isError = latest fetch failed
```

---

## Mutation hook pattern

```ts
// features/applications/hooks/use-update-status.ts
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationKeys } from '@/constants/query-keys'
import { updateApplicationStatus } from '@/services/applications.service'
import { toast } from 'sonner'
import type { ApplicationStatus } from '@/types/applications'

export function useUpdateApplicationStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: ApplicationStatus) => updateApplicationStatus(id, status),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.detail(id) })
      const previous = queryClient.getQueryData(applicationKeys.detail(id))
      queryClient.setQueryData(applicationKeys.detail(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        return { ...old, status: newStatus }
      })
      return { previous }
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previous) {
        queryClient.setQueryData(applicationKeys.detail(id), context.previous)
      }
      toast.error('Failed to update status — please try again.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}
```

---

## Cache invalidation strategy

| Action | Invalidate |
|---|---|
| Create job | `jobKeys.all` |
| Update job | `jobKeys.detail(code)` + `jobKeys.all` |
| Archive job | `jobKeys.all` |
| Update application status | `applicationKeys.all` |
| Submit application | `applicationKeys.all` + `jobKeys.detail(jobCode)` (count changes) |

Use `invalidateQueries` (not `removeQueries`) — marks stale and refetches when next observed.

---

## v5 API changes from v4

```ts
// ❌ v4 (wrong — old API)
const { isLoading } = useQuery(['jobs'], fetchJobs)
useQuery(['jobs'], fetchJobs, { onSuccess: (data) => ... })

// ✅ v5 (correct)
const { isPending } = useQuery({ queryKey: jobKeys.lists(), queryFn: fetchJobs })
// onSuccess removed from useQuery — use the returned data or a separate useEffect
```

Key v5 changes:
- `isLoading` → `isPending`
- Object-form required for `useQuery` and `useMutation` (no positional args)
- `onSuccess`/`onError`/`onSettled` removed from `useQuery` options
- `cacheTime` → `gcTime`
- `status === 'loading'` → `status === 'pending'`

---

## Anti-patterns

```ts
// ❌ Inline query key
useQuery({ queryKey: ['jobs', 'list'], queryFn: ... })

// ❌ Supabase directly in queryFn
useQuery({ queryKey: jobKeys.lists(), queryFn: async () => {
  const { data } = await supabase.from('jobs')...  // go through service
}})

// ❌ Zustand for server state
const jobs = useJobsStore(s => s.jobs)  // use useJobs() instead

// ❌ No invalidation after mutation
onSuccess: () => {}  // cache will be stale forever

// ❌ v4 API
const { isLoading } = useQuery(['key'], fn)
```
