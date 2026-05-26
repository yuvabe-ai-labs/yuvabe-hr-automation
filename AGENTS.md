<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Architecture check — before writing any code

Before writing ANY code that involves data access, React state, or UI, identify which layer it belongs to:

- **DB access** → `repositories/<domain>.repository.ts`
- **Business logic** → `services/<domain>.service.ts`
- **Server state** → `features/<domain>/hooks/` (TanStack Query)
- **UI state** → `store/` (Zustand, not TanStack)
- **UI rendering** → `components/` or `app/`

Also check `CLAUDE.md §Migration status` — if the area you're touching still uses old anti-patterns, apply the `yuvabe-refactor` skill before writing new code in that area.

**Absolute violations — halt and surface before proceeding:**
- A component file importing from `@supabase/supabase-js`, `@/lib/supabase`, or `@/integrations/supabase-people`
- A service file importing from `@supabase/supabase-js` or any Supabase client directly
- A hook file containing business logic (sorting, filtering, domain transforms beyond mapping)
- A repository file containing business logic (any logic beyond the Supabase query + row mapping)
- Query key strings written inline (e.g. `queryKey: ['jobs', 'list']`) instead of using `constants/query-keys.ts`

If you are about to write code that violates one of these, STOP. Surface the violation and ask for direction. Do not silently work around it.

---

## Design enforcement — before writing .tsx

Before writing or substantially editing any `.tsx` file:
1. Load `yuvabe-design-system` skill
2. If the file renders a list, table, or card collection — also load `yuvabe-interaction-design`

After completing a screen or non-trivial UI edit:
3. Run `yuvabe-vd-checker` before declaring done

Never skip either step, even for "small" changes. A single wrong shadow or inline hex breaks the visual system.

---

## Refactoring guidance

When the user says "refactor jobs", "migrate applications to clean arch", "clean up the store", or similar:
1. Invoke the `yuvabe-refactor` skill
2. Follow the 8-step recipe in that skill exactly
3. Do NOT refactor more than one domain per PR
4. After migration, update the `## Migration status` section in `CLAUDE.md`

---

## Business queries

Maintain `docs/queries.md` — open questions for the business / hiring stakeholders, reviewed before demos.

- When the user says "add to my queries", "add this to the list", "log this for the team", or similar, append under `## Open` in this exact format:
  `- **YYYY-MM-DD** — <question> *(<one-line context>)*`
- During implementation, if you notice an ambiguity that requires **business judgment** (policy, naming, workflow, audience, scope) rather than a technical one, proactively say: *"Sounds like a question for the business — want me to add it to the queries list?"* Wait for confirmation before writing.
- When asked "how many queries do I have" or similar, read the file and report the count of items under `## Open`.
- Don't restructure existing entries. New entries go to the bottom of `## Open`.
