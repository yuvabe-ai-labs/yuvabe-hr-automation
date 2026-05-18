---
name: yuvabe-pr-review
description: PR and code review checklist for Yuvabe ATS — architecture layer violations, TypeScript compliance, naming conventions, query key factory usage, mutation invalidation, error handling, visual design. Produces structured findings in FAIL / WARN / FYI categories. Activate on "review this PR", "review these files", "code review", "check this before merge", or "review <path>".
---

# Yuvabe — PR Review

## How to use

1. Read all files in the PR (or files the user points to)
2. Work through each checklist section below
3. Output a structured report (template at the bottom)
4. Verdict: BLOCKED (any FAIL) / CONDITIONAL (WARN only) / APPROVED (FYI only or clean)

---

## Checklist

### A. Layer boundaries (architecture)

```
- [ ] No Supabase client imported in a component (.tsx file)
- [ ] No Supabase client imported in a service file (services/)
- [ ] No repository function called directly from a hook (must go through service)
- [ ] No service function called directly from a component (must go through hook)
- [ ] No business logic in a repository (only DB calls + row mapping)
- [ ] Mapper function (rowToX) lives in the repository, not in the service
- [ ] No inline query key strings — all keys from constants/query-keys.ts
```

**Quick grep to run before reviewing:**
- `grep -r "from.*integrations/supabase-people\|from.*lib/supabase" services/` — should be empty
- `grep -r "from.*repositories/" app/ components/ hooks/ features/` — should be empty
- `grep -r "queryKey: \['" features/ hooks/` — should be empty (all keys via factory)

---

### B. TypeScript compliance

```
- [ ] No `any` — should use `unknown` + narrowing, or an explicit type
- [ ] Domain types inferred from Zod (z.infer<typeof Schema>), not hand-written
- [ ] No `as SomeType` cast without an explanatory comment
- [ ] Raw row types (JobRow, ApplicationRow) declared in the repository file — not exported to types/
- [ ] New schema files use Zod v4 syntax: { error: '...' } not { message: '...' }
```

---

### C. Naming conventions

```
- [ ] Repository: repositories/<domain>.repository.ts — exported as plain object const
- [ ] Service: services/<domain>.service.ts — named async function exports (not a class)
- [ ] Hook: features/<domain>/hooks/use-<domain>.ts — functions named use<Domain>
- [ ] Schema: schemas/<domain>.schema.ts — exports named <Domain>Schema
- [ ] Types: types/<domain>.ts — types named <Domain>, inferred from schema
- [ ] Query keys: constants/query-keys.ts — exported as <domain>Keys
- [ ] Components: PascalCase filename — JobRow.tsx, ApplicationDetail.tsx
```

---

### D. TanStack Query

```
- [ ] All query keys use the factory from constants/query-keys.ts
- [ ] Mutations invalidate lists() on create
- [ ] Mutations invalidate detail(id) + lists() on update
- [ ] Mutations invalidate lists() on delete/archive
- [ ] Optimistic updates have rollback in onError
- [ ] enabled guard present when query param may be undefined/null
- [ ] v5 API used (isPending not isLoading, object form, no onSuccess in useQuery)
- [ ] staleTime not set per-query without a clear reason
```

---

### E. Error handling

```
- [ ] Repository throws on Supabase error (never returns undefined for DB failures)
- [ ] PGRST116 (not found) handled as null return, not thrown
- [ ] Mutation onError shows user feedback (toast or inline error message)
- [ ] No silent catch-and-return-undefined in service or hook
- [ ] Component handles query isError state — not just isPending + data
```

---

### F. Separation of concerns — utilities and types

```
- [ ] No utility/helper functions defined inside component files
      Exception: a one-liner used only in JSX (e.g. format inline) is OK
      Everything else: extract to lib/utils.ts, features/<domain>/utils/, or a new utils file
- [ ] No type definitions inside component files except component prop types
      OK:   type Props = { jobCode: string; onClose: () => void }
      FAIL: type JobStatus = 'active' | 'closed'  (belongs in types/jobs.ts or schemas/jobs.schema.ts)
      FAIL: type ApiResponse<T> = { data: T; error: string }  (belongs in types/common.ts)
- [ ] Shared/reusable types placed in the most appropriate existing file before creating a new one
      Domain types → types/<domain>.ts (inferred from Zod)
      Cross-domain shared types → types/common.ts
      Feature-local types → features/<domain>/types/ (only if truly local to one feature)
- [ ] No duplicate type definitions across files — search before creating
```

**Quick check:** scan `.tsx` files for `type ` or `interface ` that aren't `Props`, `Ref`, or `State` suffixed.

---

### G. Visual design (only if .tsx files are in the review)

```
- [ ] No hardcoded hex colors (#FAF8F4, #B8553A, etc.) — use CSS token classes
- [ ] No shadow-* Tailwind utilities — borders only (except modal + hover-lift)
- [ ] shadcn primitives used — no custom UI primitive components
- [ ] No Tailwind 3 config overrides — tokens in globals.css only
- [ ] WCAG AA text contrast — text-foreground/X to dim, not text-muted-foreground/X below 80%
- [ ] No inline px sizes outside the spacing scale
```

If .tsx files are present, also run `yuvabe-vd-checker` for a full visual audit.

---

### Severity tag reference

| Tag | Section |
|---|---|
| `[LAYER]` | Layer boundary / architecture violation |
| `[TYPES]` | TypeScript compliance |
| `[NAMING]` | Naming conventions |
| `[CACHE]` | TanStack Query |
| `[ERROR]` | Error handling |
| `[SOC]` | Separation of concerns (inline utils or types) |
| `[VD]` | Visual design |

---

## Output format

```
## PR Review: <description or file list>
Date: <YYYY-MM-DD>

━━━ FAIL (must fix before merge) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ [LAYER] services/jobs.service.ts:34
   imports getSupabasePeopleClient() directly — Supabase calls belong in repositories/
   Fix: extract the query to repositories/jobs.repository.ts, call repository here

━━━ WARN (fix soon — technical debt) ━━━━━━━━━━━━━━━━━━━━━━━

⚠️ [CACHE] hooks/use-jobs.ts:12
   inline query key ['jobs', 'list'] — must use jobKeys.list() from constants/query-keys.ts
   Fix: import jobKeys and replace the array literal

━━━ FYI (low priority) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ [TYPES] types/jobs.ts:5
   hand-written Job interface — should be derived from z.infer<typeof JobSchema>
   Fix: when schemas/jobs.schema.ts lands, replace this with z.infer

━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FAILs: X  |  WARNs: Y  |  FYIs: Z
Verdict: BLOCKED / CONDITIONAL / APPROVED
VD check: needed / not needed / already passed
```

---

## Severity definitions

| Severity | Meaning | Merge gate |
|---|---|---|
| **FAIL** | Architecture violation, type safety hole, broken error handling | Must fix before merge |
| **WARN** | Technical debt that will compound — inline keys, missing invalidation, v4 API usage | Fix in follow-up, not a merge blocker |
| **FYI** | Style, naming drift, hand-written types that will be replaced by schema migration | Record only, no action required |
