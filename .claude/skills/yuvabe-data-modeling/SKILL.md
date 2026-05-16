---
name: yuvabe-data-modeling
description: Use proactively whenever data model, schema, or feature/module planning is being discussed for the Yuvabe ATS — at the *planning* phase, not just at code-edit time. Triggers include: any conversation about adding a new entity (Interview, Stage, FeedbackNote, ReviewRound, Offer, Note, Tag, etc.); modifying or extending Job, Candidate, Application, Criterion, CriterionMatch, ExperienceEntry, EducationEntry, or any sub-document type; designing a new screen or route that introduces persistence; adding fields to existing entity types; planning database migrations or the eventual Supabase / MongoDB swap; questions like "where should X live?", "should this be embedded or its own table?", "what does the schema look like?", "how do we model Y?". Activate **before** any change to `repositories/*.repository.ts`, `schemas/*.schema.ts`, `lib/prompts/*.v1.ts` (when the change affects type shapes), or new API routes that introduce new persistence shapes. Activate during product/design discussions about new screens *before* code is written. The skill embeds the project's NoSQL-friendly access-pattern rules and the MIGRATION BOUNDARY discipline — apply both *before* proposing any schema.
---

# Yuvabe ATS — Data Modeling

A working framework for designing data shapes in the Yuvabe ATS. Companion document: [`docs/data-modeling.md`](../../../docs/data-modeling.md) — read it first for the long-form teaching version.

## The one rule

> **Data that's accessed together should be stored together.**

Every other rule in this skill is a corollary. The rule is the foundation of NoSQL design (MongoDB, Cosmos, Couchbase all teach it). For the Yuvabe ATS specifically — where the eventual storage is Supabase or MongoDB and the current local-JSON store is shaped to match either — applying this rule keeps the model migration-ready.

**The corollary**: you cannot design a schema without first listing how the data will be queried. Schema is downstream of access patterns.

## When this skill activates

This skill activates **proactively** on:

| Signal | Examples |
|---|---|
| Adding a new entity | "Let's add an Interview entity", "track recruiter notes per candidate", "FeedbackNote", "OfferLetter" |
| Modifying an existing entity | "add a tags field to Application", "store the parsed resume sections separately", "Job needs a salary range field" |
| Sub-document changes | new fields on Criterion, ExperienceEntry, EducationEntry, CriterionMatch |
| New API route or page that persists | "POST /api/notes", "/applications/[id]/feedback" |
| Migration / DB swap discussions | "moving to Supabase", "what's the MongoDB schema for this?", "how do we make this NoSQL-friendly?" |
| Schema-shaped questions | "should this be embedded?", "where should this live?", "what's the relationship between A and B?" |
| Editing any `repositories/*.repository.ts` or `schemas/*.schema.ts` | direct code-edit trigger — surface the rules before changes go in |
| Editing `lib/*-store.ts` during refactor | also triggers — old files being migrated |

If a feature has a UI screen but no clear data shape yet, **activate during the screen-planning conversation**, not just when the data layer is being written.

## What's already built — the entity map

Three top-level entities. Each has its own JSON file today (and will be its own collection / table on migration). Read [`lib/jobs-store.ts`](../../../lib/jobs-store.ts), [`lib/candidates-store.ts`](../../../lib/candidates-store.ts), [`lib/applications-store.ts`](../../../lib/applications-store.ts) for the canonical shapes.

```
Job ────────────< Application >───────── Candidate

Job
  └── criteria[]      ← embedded — 8–16 items, locked at posting
Candidate
  └── skills[]        ← embedded
  └── experience[]    ← embedded
  └── education[]     ← embedded
  └── links?          ← embedded
Application                              (one per applicant per job per submission)
  ├── jobId           → Job.id
  ├── jobCode         → Job.code         (denormalized)
  ├── candidateId     → Candidate.id
  ├── candidateName, candidateEmail, candidateLocation, candidateYearsOfExperience  (snapshots)
  └── matchBreakdown[] ← embedded — one row per parent Job's criterion
```

References: 3 (Application → Job, Application → Candidate, breakdown row → Criterion).
Embedded sub-collections: 5 (criteria, skills, experience, education, matchBreakdown).
Denormalizations on Application: 5 (`jobCode`, `candidateName`, `candidateEmail`, `candidateLocation`, `candidateYearsOfExperience`).

## Decision tree — embed or reference?

| Relationship | Default | Project examples |
|---|---|---|
| One-to-one | Embed | (none in current model) |
| One-to-few (capped, predictable) | Embed | Job.criteria[], Candidate.experience[], Candidate.education[], Candidate.skills[], Application.matchBreakdown[] |
| One-to-many that grows unbounded | Reference | (would apply to: Candidate's many Applications) |
| Many-to-many | Reference (with snapshots if needed for read paths) | (none in current model) |

**Practical heuristic**: if the child rows are *always* read with their parent and never queried independently, embed. The moment you find yourself querying "give me all Xs across all Ys" — reference.

## Denormalization rules

Denormalize a field when **all** are true:

1. It's read often (appears in list views, detail headers, common queries).
2. It's updated rarely (write-once-then-stable, or near-immutable).
3. The cost of stale propagation is low (UI tolerates briefly outdated values, OR updates are batched).

Project examples that follow these rules:
- `jobCode` on Application — Job codes are immutable.
- `criterionLabel` + `importance` on each `matchBreakdown` row — written at scoring time, then static.
- `candidateName` / `candidateEmail` / `candidateLocation` / `candidateYearsOfExperience` on Application — written at submit, near-immutable.

Project examples that would **violate** the rules:
- `Application.matchScore` snapshotted on Candidate — no, it changes per-job per-application.
- `Job.applicationCount` snapshotted on Job — no, it grows with every submission, write-frequent.

## Identity discipline (the embedded-row trap)

When you embed a sub-collection that gets cross-referenced, **give every row a stable `id`**.

The Yuvabe model originally lacked criterion IDs — `matchBreakdown` rows referenced their criterion by string label. Renaming the label silently orphaned breakdown rows. The fix: add `id: string` to `Criterion`, generate at extraction time, carry into `matchBreakdown[*].criterionId` (see `app/api/extract-criteria/route.ts` and `lib/jobs-store.ts` for the pattern).

**Rule**: every embedded row that ever gets referenced from outside its parent gets an `id`. Even if you don't think it'll be referenced today.

## MIGRATION BOUNDARY discipline

Every store file has a `MIGRATION BOUNDARY` header that says: this file is the only place where `fs.*` (or future `supabase.*` / `mongodb.*`) lives. Callers go through async store functions only. The function signatures, return types, and entity shapes stay identical across the migration.

When adding a new store:
1. Create `lib/<entity>-store.ts` with the boundary header.
2. Export an entity type (`Foo`), and async functions: `listFoos()`, `getFooById()`, `createFoo(input)` etc.
3. Internal `readStore()` / `writeStore()` helpers handle the JSON I/O (or future DB calls).
4. **No caller imports `fs`.** Callers `await` the store functions and never see the storage shape.

## Checklist for adding a new entity type

Work through this list **before** writing any schema. If you can't answer all eight, you're not ready to design.

1. **Access patterns** — what queries will the app run that touch this entity? Write them as a list. Be specific: which page, which filter, which sort.
2. **Top-level vs embedded** — top-level if it has independent queries or its own lifecycle; embedded if always read with its parent.
3. **Sub-collections** — what does it embed? Apply the one-to-few rule.
4. **References** — what other entities does it point to? What's the cardinality (one-to-one, one-to-few, one-to-many)?
5. **Snapshots** — for each list view, identify which fields from referenced entities are needed. If write-rare, snapshot them onto this entity. If write-frequent, fetch via reference.
6. **Identity** — does this entity have an `id`? Do its embedded rows have IDs (apply identity discipline)?
7. **Sync risks** — what happens when an upstream entity is edited (label rename, name change)? Pick consciously: snapshot is point-in-time, OR snapshot updates propagate, OR canonical lookup is on each render.
8. **MIGRATION BOUNDARY** — new store file with header. Callers go through async functions only.

## Anti-patterns to avoid

- **Embedded rows without IDs** — blocks principled cross-document references later.
- **Denormalizing write-frequent fields** — every update has to fan out, causing write amplification.
- **Three-way fan-out joins on listing pages** — use snapshots instead. The current `/applications/[id]` detail page legitimately fetches the full Candidate doc (it shows the rich profile), but list pages should never need it.
- **Storing computed values that should be derived at read time** — `Application.matchScore` is the *only* exception in this codebase, justified by the cost of recomputing (re-running the LLM scoring pipeline). Don't add more.
- **Letting the LLM generate identifiers** — LLMs are unreliable at random/unique strings. Generate IDs in code (see `generateCriterionId()` in `lib/prompts/extractCriteria.v1.ts`).
- **Bypassing the store** — never `import data from "data/*.json"` in a page or API route. Always go through the store. The MIGRATION BOUNDARY only works if callers can't see past it.
- **Removing fields without considering data-shape compatibility** — additive only. New fields default-safe so old data still parses; removed fields stay (or are tombstoned) until the data is migrated.

## Field naming conventions

- camelCase always (matches the Supabase / MongoDB convention we'll mirror).
- Snapshot fields prefixed by source entity: `candidateName`, `candidateEmail` etc. (not `name`, `email` — those would conflict).
- Optional fields used for backwards compatibility on additive changes: `field?: T`. Backfill at read time when missing; convert to required once all data is migrated.
- Booleans named with positive polarity: `isPublished` not `isUnpublished`.

## Further reading

- [`docs/data-modeling.md`](../../../docs/data-modeling.md) — long-form teaching write-up; share with new team members.
- [MongoDB: Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)
- [MongoDB: 6 Rules of Thumb](https://www.mongodb.com/company/blog/mongodb/6-rules-of-thumb-for-mongodb-schema-design)
- [Azure Cosmos DB: Data Modeling](https://learn.microsoft.com/en-us/azure/cosmos-db/modeling-data)
- The MIGRATION BOUNDARY headers at the top of each `lib/*-store.ts` file — read those before touching the store layer.
