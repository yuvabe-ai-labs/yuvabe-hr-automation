# Yuvabe ATS

A small, opinionated applicant-tracking system for Yuvabe. Inbound applications arrive via a public form; the system routes each to the right Job, scores the fit against recruiter-confirmed criteria, and surfaces a ranked list of applicants with explainable per-criterion reasoning.

The thesis the product embodies: *"a score without reasoning is not a score."* Every match score the recruiter sees comes with the evidence that produced it.

---

## Stack at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router, TypeScript strict |
| Styling | Tailwind CSS v4 (CSS-first, `globals.css @theme`), shadcn/ui primitives |
| Server state | TanStack React Query v5 |
| Database | Supabase Postgres (JSONB sub-collections) |
| Auth | HMAC-signed session cookie via `lib/auth.ts` (Edge-safe, 7-day TTL) |
| LLM | OpenAI `gpt-4o`, `temperature: 0`, `seed: 42` |
| Validation | Zod v4 (source of truth for all domain types) |
| File parsing | `unpdf` (PDF), `mammoth` (DOCX), native UTF-8 (TXT) |
| Fonts | Newsreader (display/italic), Geist (UI/body), Geist Mono (numerics/captions) |

---

## Architecture — strict layers

```
UI (pages/components)
  └── Feature hooks (TanStack Query)  [features/<domain>/hooks/]
        └── Services (business logic) [services/]
              └── Repositories (DB access only) [repositories/]
                    └── Supabase client [lib/supabase.ts or integrations/supabase-people.ts]
```

**Absolute rules — no exceptions:**
- Components NEVER import from `repositories/` or Supabase clients
- Components NEVER contain business logic or heavy transforms
- Services call repositories; NEVER Supabase directly
- Repositories are the ONLY place Supabase calls live
- Hooks call services, NEVER repositories directly
- Query key strings NEVER appear inline — always from `constants/query-keys.ts`

If you are about to violate one of these, stop and surface it before writing code.

---

## Folder structure — target (in-progress refactor)

```
app/                    — Next.js App Router pages (server components by default)
repositories/           — DB access only. The ONLY place Supabase is called.
services/               — Business logic. Calls repositories. Never Supabase.
features/
  jobs/hooks/           — TanStack Query hooks for jobs
  applications/hooks/   — TanStack Query hooks for applications
  candidates/hooks/     — TanStack Query hooks for candidates
schemas/                — Zod schemas. Source of truth for all domain types.
types/                  — z.infer<> inferred types only. No hand-written interfaces.
constants/
  query-keys.ts         — Query key factory. Single source of query key strings.
hooks/                  — Shared cross-feature hooks
components/ui/          — shadcn primitives only (no modification)
components/shared/      — Cross-feature shared components
lib/
  supabase.ts           — Server-only Supabase client (secret key, import "server-only")
  llm.ts                — OpenAI wrapper
  parseUpload.ts        — File parsing (PDF/DOCX/TXT)
  auth.ts               — Session cookie helpers (Edge-compatible)
  utils.ts              — cn(), formatDate(), pure utilities
  prompts/              — LLM prompt templates
providers/              — QueryClient provider
store/                  — Zustand for UI-only state (not server state)
integrations/
  supabase-people.ts    — Client-safe Supabase client (anon key)
middleware.ts           — Auth gate (Edge runtime, reads session cookie)
```

---

## Migration status

This codebase is mid-refactor from the original flat anti-pattern to the clean layered architecture. Read this before writing any code.

### Not yet migrated (old anti-pattern — do NOT copy as a pattern)

- `lib/jobs-store.ts` — Supabase calls here; will move to `repositories/jobs.repository.ts`
- `lib/candidates-store.ts` — same
- `lib/applications-store.ts` — same
- `lib/notes-store.ts` — same
- `services/jobs.service.ts` — currently calls `getSupabasePeopleClient()` directly; needs repository extraction
- `services/applications.service.ts` — same violation
- `services/candidates.service.ts` — same violation
- `hooks/use-jobs.ts`, `hooks/use-applications.ts` — inline query key strings; needs key factory

### Does not exist yet (create when needed)

- `repositories/` directory — create when refactoring a store
- `features/` directory — create when adding new hooks
- `schemas/` directory — create when adding Zod schemas
- `constants/query-keys.ts` — create immediately when touching any hook
- `store/` directory — create when Zustand UI state is needed

### Rules during migration

- **New code always uses target architecture.** Never copy from `lib/*-store.ts` as a pattern.
- **When touching a service**, extract its repository layer in the same PR.
- **When writing or modifying a hook**, always use the key factory — no inline strings.
- **Use the `yuvabe-refactor` skill** when migrating a store file step by step.
- **After migrating a domain**, update this section to reflect the new state.

---

## Repository pattern

Repositories own exactly one thing: **database I/O**. Nothing else.

```ts
// repositories/jobs.repository.ts
import { getSupabasePeopleClient } from '@/integrations/supabase-people'

type JobRow = { id: string; code: string; title: string; ... } // stays in this file only

function rowToJob(row: JobRow): Job { ... } // mapper lives in the repository

export const jobsRepository = {
  async findAll(opts?: { status?: string }): Promise<Job[]> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase.from('jobs').select('*')
    if (error) throw new Error(`Failed to fetch jobs: ${error.message}`)
    return data.map(rowToJob)
  },
  // findByCode, create, updateStatus, archive
}
```

**Repository rules:**
- Export a plain object (not a class)
- `type JobRow` (raw DB shape) stays in the repository file — never exported
- `rowToJob()` mapper is in the repository, maps snake_case → camelCase, converts `null` → `undefined`
- Throws on Supabase error — never silently returns undefined for DB failures
- Function names: `findAll`, `findById`, `findByCode`, `create`, `update`, `upsert`, `remove`
- No business logic: no `nanoid`, no scoring, no domain validation

**Service rules:**
- Calls repositories; never Supabase directly — no `@supabase/supabase-js` imports
- Contains business logic: code generation, retry loops, data orchestration
- Maps results to domain types (or delegates to repository mapper)
- Throws typed errors with business context

---

## React Query rules

All query keys in `constants/query-keys.ts`. Never define inline keys in hooks or components.

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

QueryClient defaults in `app/providers.tsx`: `staleTime: 60_000`, `gcTime: 300_000`, `retry: 1`, `refetchOnWindowFocus: false`.

Mutations MUST invalidate: `queryClient.invalidateQueries({ queryKey: jobKeys.all })`.

---

## TypeScript rules

- `strict: true` — no exceptions
- No `any` — use `unknown` and narrow
- Domain types inferred from Zod: `type Job = z.infer<typeof JobSchema>`
- No hand-written interfaces for domain entities — they belong in `schemas/`
- No `as SomeType` cast without a comment explaining why it is safe

---

## Error handling

- Repositories throw on Supabase error (`throw new Error(...)`)
- Services catch and rethrow with business context, or let propagate
- API routes return `{ error: string }` with appropriate HTTP status
- Hooks surface errors through TanStack's `error` state
- Components show error state — never swallow silently
- Mutations use toast for user-facing feedback on `onError`

---

## Server vs Client components

Default: Server Component. Use `"use client"` only for:
- Forms + interactivity
- `useState` / `useReducer`
- Browser APIs
- Event handlers
- TanStack Query hooks

URL-driven filters (`?status=...`, `?sort=...`) stay server-side via `searchParams` — never useState for filter values.

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `jobs.repository.ts` |
| Components | PascalCase | `JobRow.tsx` |
| Hooks | camelCase, `use` prefix | `useJobs.ts` |
| Services | camelCase, `.service.ts` | `jobs.service.ts` |
| Repositories | camelCase, `.repository.ts` | `jobs.repository.ts` |
| Schemas | PascalCase, `Schema` suffix | `JobSchema` |
| Types | PascalCase | `Job`, `ApplicationStatus` |
| Query keys | camelCase factory | `jobKeys.list()` |

---

## Separation of concerns — utilities and types

**Utility functions:**
- Never define helper/utility functions inside component files — extract to `lib/utils.ts`, `features/<domain>/utils/`, or a new dedicated file
- Exception: a one-liner used only in that component's JSX (e.g. inline format expression) is OK

**Type definitions:**
- Component prop types (`type Props = { ... }`) can live inside the component file — nothing else
- Domain types → `types/<domain>.ts`, always inferred from Zod: `type Job = z.infer<typeof JobSchema>`
- Cross-domain shared utility types → `types/common.ts`
- Feature-local types → `features/<domain>/types/` (only if genuinely not shared)
- Before creating a new types file, check if an existing one is the right home
- No duplicate type definitions across files

```ts
// ✅ OK inside a component
type Props = { jobCode: string; onClose: () => void }

// ❌ FAIL inside a component — extract to types/jobs.ts
type JobStatus = 'active' | 'paused' | 'closed'

// ❌ FAIL inside a component — extract to lib/utils.ts
function formatScore(score: number) { return `${score}/10` }
```

---

## Locked design constraints

- **shadcn primitives only** — no custom UI primitives. Visual identity in `className` + `globals.css`.
- **Borders, not shadows** — two shadows only: heavy (modals + bulk bar), hairline `--shadow-hover` (hover-lift). Never `shadow-sm`/`shadow-md`.
- **Warm palette locked** — `#FAF8F4` bg, `#1A1815` ink, `#8A857B` muted, `#B8553A` terracotta. No new tokens without explicit request.
- **WCAG AA** — use `text-foreground/X` to dim, never `text-muted-foreground/X` below 80% on informational text.
- **Tailwind 4, not Tailwind 3** — no `tailwind.config.js`. All tokens in `app/globals.css` via `@theme inline`.
- **Responsive by default** — usable at 360px, stack on `<md`.

---

## Skills loaded automatically

| Skill | When it activates |
|---|---|
| `yuvabe-design-system` | Before writing/editing any `.tsx`, before changing `globals.css` tokens |
| `yuvabe-interaction-design` | Before writing any list, table, card-grid, or collection surface |
| `yuvabe-vd-checker` | After completing a screen; when user says "VD check" or "audit" |
| `yuvabe-repository-pattern` | Before writing any repository, service, or data-access file |
| `yuvabe-react-query` | Before writing any TanStack Query hook or mutation |
| `yuvabe-feature-scaffold` | Before adding a new feature domain |
| `yuvabe-form-pattern` | Before writing any form component |
| `yuvabe-auth-pattern` | Before touching `middleware.ts`, `lib/auth.ts`, or session logic |
| `yuvabe-data-modeling` | Before schema changes or new DB entities |
| `yuvabe-pr-review` | On "review this", "PR check", "code review" requests |
| `yuvabe-refactor` | On "refactor X", "migrate X to clean arch", "clean up the store" |

---

## Domain

A **Job** has many **Applications**. Each Application has one **Candidate** and one **Match Score** (LLM: per-criterion `matched: yes|partial|no`, 0–10 score, evidence sentence). Importance tiers: `must | preferred | nice`. Pipeline stages: `new | reviewing | shortlisted | interview_scheduled | interviewed | offered | hired | rejected | withdrawn`.

---

## Fresh session orientation

1. Confirm `.env.local` has `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL`, `NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_KEY`, `AUTH_SECRET`, `OPENAI_API_KEY`
2. `pnpm db:seed` — loads `data/*.example.json` into Supabase (3 jobs, 15 candidates, 21 applications)
3. `pnpm dev` — visit `http://localhost:3000` → redirects to `/login`
4. Log in with the credentials in `.env.local` (or the default recruiter account)

@AGENTS.md
