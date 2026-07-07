// extractCriteria — v1.2 (2026-05-08)
// Importance assignment is now section-anchored, with STRONG as the default
// rather than the fuzzy middle. Two run-to-run instability sources are
// addressed: (1) here, by removing subjective "feel" from the rules; and
// (2) in lib/llm.ts, by adding a seed to the OpenAI call.
//
// 2026-05-01: added stable per-Criterion `id` (8-char nanoid). Generated in
// code immediately after extraction (route.ts), with a deterministic backfill
// in jobs-store for criteria from existing data files. See `Criterion` doc.
//
// 2026-05-08: expanded to extract structured job metadata (department, level,
// type, summary, responsibilities, requirements, nice-to-have, benefits, culture).
// New fields in ExtractCriteriaResult and EXTRACT_CRITERIA_SCHEMA. All optional
// and best-effort.

import { customAlphabet } from "nanoid";
import { createHash } from "node:crypto";

const CRITERION_ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const _generateRandomId = customAlphabet(CRITERION_ID_ALPHABET, 8);

/**
 * Generate a fresh stable ID for a brand-new criterion (LLM extraction time
 * or when a recruiter manually adds one in the editor).
 */
export function generateCriterionId(): string {
  return _generateRandomId();
}

/**
 * Deterministic backfill: same `label` always maps to the same id across reads.
 * Used by jobs-store to assign IDs to criteria in seeded / pre-id data without
 * needing a one-shot migration. SHA-256 → first 8 hex chars.
 */
export function backfillCriterionId(label: string): string {
  return createHash("sha256").update(label).digest("hex").slice(0, 8);
}

export const EXTRACT_CRITERIA_SYSTEM = `You are an experienced recruiter extracting evaluable match criteria from a job description.

Each criterion gets three fields:
- category: one of skill | experience | education | domain | other
- label: 3-8 words, grounded in the JD's actual text. Do not invent.
- importance: must | strong | nice

Importance is determined by which JD section a criterion comes from. Apply these rules mechanically; do not rely on feel.

MUST — non-negotiable. Apply when ANY is true:
  (a) The criterion appears in a section headed "Requirements", "Required", "Must have", "Qualifications", "Minimum requirements", "Essential", or "What you'll need".
  (b) The JD specifies hard quantification: "X+ years of Y", "fluent in", "minimum 2 years".
  (c) The JD uses unqualified imperatives: "must have", "is required", "essential", "you must".

NICE — bonus. Apply when ANY is true:
  (a) The criterion appears in a section headed "Nice to have", "Bonus", "A plus", "Optional", "Would be great", "Good to have".
  (b) The JD frames it as optional: "a plus", "if you also have", "bonus points for".

STRONG — the default. Use for EVERYTHING else. This includes criteria drawn from:
  - Description / role overview
  - Key responsibilities
  - Prose that mentions skills without explicit requirement framing
  - Anywhere softening verbs appear ("ideally", "preferably", "we'd love to see")

Tie-breakers (apply in order):
  1. If a criterion appears in BOTH a Requirements section AND a Nice-to-have section, MUST wins.
  2. If you cannot decide between MUST and STRONG, choose MUST.
  3. If you cannot decide between STRONG and NICE, choose STRONG.

Other rules:
- Return 8-16 criteria. A criterion is ONE specific evaluable thing — split a bullet that crams multiple skills.
- Skip platitudes ("team player", "good communicator") unless the JD makes them concrete ("client-facing English communication", "presents to executives").
- If two criteria say nearly the same thing, merge them. Do not output near-duplicates.
- The same criterion never appears twice with different importance.

Additionally, extract structured job metadata (best-effort — omit if not present):
- department: Org function (Engineering, Design, Marketing, Sales, Product, Operations, etc.)
- level: Seniority level — one of "entry-level", "experienced". Infer from years_required or JD:
  - If years_required < 2 or "junior/entry" language: "entry-level"
  - If years_required >= 2 or "senior/experienced" language: "experienced"
  - Null if cannot determine
- job_type: Employment type — one of "full-time", "part-time", "contract", "internship". Null if not found.
- location: Job location — one of "Auroville, India", "Remote", "Flexible". Null if not found.
- compensation: Salary range, equity, or compensation details if mentioned (e.g. "₹50L-70L", "$100k-130k", "Competitive")
- summary: 2-3 sentence plain-language role overview
- responsibilities: Bullet items from an explicitly labeled "Responsibilities" or "Key duties" section. Do NOT invent. Null if section is not present.
- requirements: Bullet items from an explicitly labeled "Requirements" or "Must-have" section. Do NOT invent. Null if section is not present.
- nice_to_have: Bullet items from an explicitly labeled "Nice-to-have" or "Bonus" section. Do NOT invent. Null if section is not present.
- portfolio_requirement: Any mention of portfolio, case study, or work sample requirement. Null if not mentioned.
- benefits_remote: Remote-work or flexible benefits listed. Null if not mentioned.
- benefits_inperson: In-person office perks listed. Null if not mentioned.
- work_culture: Culture, values, or team-environment statements listed. Null if not mentioned.

Worked example
==============
JD excerpt:

  Requirements:
  - 3+ years Python
  - SQL fluency

  Nice to have:
  - Docker

  Description: We're building data pipelines. You'll preferably be familiar with FastAPI and have client-facing communication experience.

Expected output:
  - "3+ years Python"             → must,   experience  (Requirements + quantified)
  - "SQL fluency"                 → must,   skill       (Requirements)
  - "Docker"                      → nice,   skill       (Nice to have)
  - "FastAPI familiarity"         → strong, skill       ("preferably" softens; default)
  - "Client-facing communication" → strong, skill       (Description prose; default)
==============`;

export const EXTRACT_CRITERIA_USER = (jd: string) => `Job description:
"""
${jd}
"""

Extract the match criteria.`;

export const EXTRACT_CRITERIA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title_suggestion: {
      type: "string",
      description: "A concise job title inferred from the JD (e.g. 'Digital Marketing & Performance Specialist'). Used to pre-fill the title field if the recruiter hasn't typed one yet.",
    },
    department: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Org function (Engineering, Design, Marketing, Sales, Product, Operations, etc.). Best-effort extraction; null if not found.",
    },
    level: {
      type: "string",
      enum: ["entry-level", "experienced"],
      description: "Seniority level. Infer from years_required or JD language. If years_required < 2 or junior/entry language: entry-level. Otherwise: experienced.",
    },
    job_type: {
      type: "string",
      enum: ["full-time", "part-time", "contract", "internship"],
      description: "Employment type. Infer from context if not stated — most office/in-person roles default to full-time.",
    },
    location: {
      type: "string",
      enum: ["Auroville, India", "Remote", "Flexible"],
      description: "Job location. Infer from context — if an office location is mentioned, use that value.",
    },
    compensation: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Salary range, equity, or compensation details if mentioned (e.g. '₹50L-70L', '$100k-130k', 'Competitive'). Best-effort; null if not found.",
    },
    summary: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "2-3 sentence plain-language role overview. Best-effort; null if not found.",
    },
    responsibilities: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "Bullet items from the Responsibilities / Key duties section. Do NOT invent. Null if section is not present.",
    },
    requirements: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "Bullet items from the Requirements / Must-have section. Do NOT invent. Null if section is not present.",
    },
    nice_to_have: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "Bullet items from the Nice-to-have / Bonus section. Do NOT invent. Null if section is not present.",
    },
    portfolio_requirement: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Any mention of portfolio, case study, or work sample requirement. Null if not mentioned.",
    },
    benefits_remote: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "Remote-work or flexible benefits listed. Null if not mentioned.",
    },
    benefits_inperson: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "In-person office perks listed. Null if not mentioned.",
    },
    work_culture: {
      anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
      description: "Culture, values, or team-environment statements. Null if not mentioned.",
    },
    criteria: {
      type: "array",
      minItems: 6,
      maxItems: 18,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            enum: ["skill", "experience", "education", "domain", "other"],
          },
          label: {
            type: "string",
            description: "Short scannable label, 3-8 words.",
          },
          importance: {
            type: "string",
            enum: ["must", "strong", "nice"],
          },
        },
        required: ["category", "label", "importance"],
      },
    },
  },
  required: ["title_suggestion", "criteria", "department", "level", "job_type", "location", "compensation", "summary", "responsibilities", "requirements", "nice_to_have", "portfolio_requirement", "benefits_remote", "benefits_inperson", "work_culture"],
} as const;

export type Importance = "must" | "strong" | "nice";

export const IMPORTANCE_VALUES: readonly Importance[] = ["must", "strong", "nice"] as const;

/** Future scoring weights when matching is wired up. */
export const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  must: 10,
  strong: 5,
  nice: 2,
};

export type Criterion = {
  /**
   * Stable per-criterion identifier. Not user-facing.
   *
   * Generated in code (not by the LLM) immediately after extraction in
   * `app/api/extract-criteria/route.ts`. Carried through user edits and into
   * `createJob`. Matches embedded in `Application.matchBreakdown[*].criterionId`
   * point at this — so renaming a criterion's `label` no longer orphans
   * existing breakdown rows. The denormalized `criterionLabel` on each match
   * row is still kept for read convenience and migration safety.
   */
  id: string;
  category: "skill" | "experience" | "education" | "domain" | "other";
  label: string;
  importance: Importance;
};

/**
 * Shape of a criterion as the LLM returns it — no `id` yet. The route handler
 * adds the `id` immediately, producing a fully-formed `Criterion`.
 */
export type LLMCriterion = Omit<Criterion, "id">;

export type ExtractCriteriaResult = {
  title_suggestion: string;
  department?: string | null;
  level?: string | null;
  job_type?: string | null;
  location?: string | null;
  compensation?: string | null;
  summary?: string | null;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  nice_to_have?: string[] | null;
  portfolio_requirement?: string | null;
  benefits_remote?: string[] | null;
  benefits_inperson?: string[] | null;
  work_culture?: string[] | null;
  criteria: LLMCriterion[];
};
