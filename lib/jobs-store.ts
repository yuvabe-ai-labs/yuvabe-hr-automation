/**
 * Jobs store, backed by Supabase Postgres.
 *
 * Public function signatures and entity shapes are unchanged from the prior
 * JSON-backed implementation — every caller (pages, API routes) keeps working
 * without edits. The only thing that changed is what's behind these functions.
 *
 * Schema: see supabase/migrations/0001_init.sql. Mapping is snake_case in the
 * DB, camelCase in TypeScript. The local `rowToJob()` adapter is the only
 * place that conversion happens.
 */

import { customAlphabet } from "nanoid";
import { supabase } from "@/lib/supabase";
import {
  generateCriterionId,
  type Criterion,
} from "@/lib/prompts/extractCriteria.v1";

/** Unambiguous alphabet — no 0/O, 1/I/L confusion. ~10^9 unique 6-char codes. */
const codeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(codeAlphabet, 6);

export type Job = {
  id: string;
  code: string;          // 6-char nanoid, the [JOB-<code>] token
  title: string;
  description: string;   // raw JD text we passed to the LLM
  criteria: Criterion[]; // editable criteria as confirmed by the recruiter on save
  department?: string;
  location?: string;
  compensation?: string;
  type?: string;
  level?: string;
  summary?: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  portfolioRequirement?: string;
  benefitsRemote: string[];
  benefitsInPerson: string[];
  workCulture: string[];
  createdAt: string;     // ISO 8601
  /**
   * Soft-delete marker. When set, the job is hidden from `listJobs()` by
   * default but still resolves via `getJobByCode()` so that existing
   * applications referencing it keep rendering. Reversible.
   */
  archivedAt?: string;
};

/** Row shape as returned by Supabase (snake_case columns). */
type JobRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  criteria: Criterion[];
  department: string | null;
  location: string | null;
  compensation: string | null;
  type: string | null;
  level: string | null;
  summary: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  nicetohave: string[] | null;
  portfoliorequirement: string | null;
  benefits_remote: string[] | null;
  benefits_inperson: string[] | null;
  workculture: string[] | null;
  created_at: string;
  archived_at: string | null;
};

function rowToJob(row: JobRow): Job {
  const job: Job = {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    criteria: row.criteria ?? [],
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    niceToHave: row.nicetohave ?? [],
    benefitsRemote: row.benefits_remote ?? [],
    benefitsInPerson: row.benefits_inperson ?? [],
    workCulture: row.workculture ?? [],
    createdAt: row.created_at,
  };
  if (row.department) job.department = row.department;
  if (row.location) job.location = row.location;
  if (row.compensation) job.compensation = row.compensation;
  if (row.type) job.type = row.type;
  if (row.level) job.level = row.level;
  if (row.summary) job.summary = row.summary;
  if (row.portfoliorequirement) job.portfolioRequirement = row.portfoliorequirement;
  if (row.archived_at) job.archivedAt = row.archived_at;
  return job;
}

/** List all jobs, newest first. Archived jobs are hidden by default. */
export async function listJobs(opts?: { includeArchived?: boolean }): Promise<Job[]> {
  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!opts?.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listJobs failed: ${error.message}`);
  return (data as JobRow[]).map(rowToJob);
}

/**
 * Get one job by its public code. Always resolves regardless of archived
 * state — old applications keep rendering, archived jobs stay viewable.
 */
export async function getJobByCode(code: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`getJobByCode failed: ${error.message}`);
  return data ? rowToJob(data as JobRow) : null;
}

/** Archive a job (soft delete). Idempotent — re-archiving updates the timestamp. */
export async function archiveJob(code: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .update({ archived_at: new Date().toISOString() })
    .eq("code", code)
    .select()
    .maybeSingle();
  if (error) throw new Error(`archiveJob failed: ${error.message}`);
  return data ? rowToJob(data as JobRow) : null;
}

/** Restore an archived job. No-op if it wasn't archived. */
export async function unarchiveJob(code: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .update({ archived_at: null })
    .eq("code", code)
    .select()
    .maybeSingle();
  if (error) throw new Error(`unarchiveJob failed: ${error.message}`);
  return data ? rowToJob(data as JobRow) : null;
}

/**
 * Criteria arrive here from two paths: the recruiter editor (where each row
 * already has an `id` assigned by extract-criteria/route.ts) and ad-hoc API
 * callers (no id). Either is accepted; the safety net inside createJob fills
 * any gaps.
 */
export type CreateJobInput = {
  title: string;
  description: string;
  criteria: Array<Omit<Criterion, "id"> & { id?: string }>;
  department?: string;
  location?: string;
  compensation?: string;
  type?: string;
  level?: string;
  summary?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  portfolioRequirement?: string;
  benefitsRemote?: string[];
  benefitsInPerson?: string[];
  workCulture?: string[];
};

/**
 * Append a new job, generating a unique 6-char code with up to 5 retries on
 * collision. Collision detection is delegated to the Postgres unique
 * constraint on `jobs.code` (error code 23505); we retry on that specific
 * code and bubble anything else.
 */
export async function createJob(input: CreateJobInput): Promise<Job> {
  // Safety net: any criterion arriving without an id (e.g., manually added by
  // the recruiter in the editor after extraction) gets one fresh nanoid here.
  // Existing ids are preserved.
  const criteriaWithIds: Criterion[] = input.criteria.map((c) => ({
    ...c,
    id: c.id ?? generateCriterionId(),
  }));

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const newRow = {
      id: crypto.randomUUID(),
      code,
      title: input.title.trim(),
      description: input.description,
      criteria: criteriaWithIds,
      department: input.department ?? null,
      location: input.location ?? null,
      compensation: input.compensation ?? null,
      type: input.type ?? null,
      level: input.level ?? null,
      summary: input.summary ?? null,
      responsibilities: input.responsibilities ?? [],
      requirements: input.requirements ?? [],
      nicetohave: input.niceToHave ?? [],
      portfoliorequirement: input.portfolioRequirement ?? null,
      benefits_remote: input.benefitsRemote ?? [],
      benefits_inperson: input.benefitsInPerson ?? [],
      workculture: input.workCulture ?? [],
      // created_at defaults to now() in Postgres; archived_at defaults to null
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(newRow)
      .select()
      .single();

    if (!error) return rowToJob(data as JobRow);

    // 23505 = unique_violation. Only retry on the code collision; bubble
    // everything else (network, RLS, schema mismatch).
    if (error.code !== "23505") {
      throw new Error(`createJob failed: ${error.message}`);
    }
  }

  throw new Error("Could not generate a unique job code after 5 attempts");
}
