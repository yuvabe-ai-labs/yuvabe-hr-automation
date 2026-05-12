/**
 * Applications store, backed by Supabase Postgres.
 *
 * Public function signatures and entity shapes are unchanged from the prior
 * JSON-backed implementation — every caller (pages, API routes) keeps working
 * without edits. The only thing that changed is what's behind these functions.
 *
 * Schema: see supabase/migrations/0001_init.sql. Mapping is snake_case in the
 * DB, camelCase in TypeScript. The local `rowToApplication()` adapter is the
 * only place that conversion happens.
 *
 * The lazy candidate-snapshot backfill that the JSON store did on every read
 * is gone: the seed script populates snapshots at insert time, and the
 * `/api/applications` POST handler does the same for new submissions. Stage 4
 * will tighten the snapshot fields from optional to required at both the
 * TS and Postgres layers.
 */

import { supabase } from "@/lib/supabase";
import type { Importance } from "@/lib/prompts/extractCriteria.v1";

/** Per-criterion analysis produced by the matching pipeline. */
export type CriterionMatch = {
  /**
   * Reference back to the parent Job's `Criterion.id`. Optional because
   * matchBreakdown rows on data created before 2026-05-01 don't have this.
   * When present, lets the UI resolve the canonical criterion even if the
   * recruiter has since renamed the label. The denormalized `criterionLabel`
   * stays as a read-convenience and migration safety net.
   */
  criterionId?: string;
  criterionLabel: string;
  importance: Importance;       // copied from the job's criteria for display convenience
  matched: "yes" | "partial" | "no";
  evidence: string;             // sentence quoted/summarized from the resume / cover letter
  /** 0–10 contribution to overall score before importance weighting. */
  score: number;
};

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "offered";

export type Application = {
  id: string;
  jobId: string;                // FK → Job.id
  jobCode: string;              // denormalized for direct route lookups
  candidateId: string;          // FK → Candidate.id
  /**
   * Snapshots of the parent Candidate's identifying fields, written at
   * createApplication time. Listing pages (`/applications`, `/jobs/[code]`)
   * read these directly so they don't have to fan out a candidates query
   * just to render rows. The full Candidate doc is still fetched on
   * /applications/[id] where the rich profile is shown.
   *
   * Required as of migration 0002 — every application carries snapshots from
   * insert. The Postgres columns are NOT NULL; this TS type matches.
   */
  candidateName: string;
  candidateEmail: string;
  candidateLocation: string;
  candidateYearsOfExperience: number;
  matchScore: number;           // 0–100, rounded
  matchSummary: string;         // one-paragraph editorial overview (LLM "Match summary")
  matchBreakdown: CriterionMatch[];
  coverLetter: string;
  receivedAt: string;           // ISO 8601
  status: ApplicationStatus;
};

/** Row shape as returned by Supabase (snake_case columns, JSONB sub-collections). */
type ApplicationRow = {
  id: string;
  job_id: string;
  job_code: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_location: string;
  candidate_years_of_experience: number;
  match_score: number;
  match_summary: string;
  match_breakdown: CriterionMatch[];
  cover_letter: string;
  received_at: string;
  status: ApplicationStatus;
};

function rowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    jobCode: row.job_code,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    candidateLocation: row.candidate_location,
    candidateYearsOfExperience: row.candidate_years_of_experience,
    matchScore: row.match_score,
    matchSummary: row.match_summary,
    matchBreakdown: row.match_breakdown ?? [],
    coverLetter: row.cover_letter,
    receivedAt: row.received_at,
    status: row.status,
  };
}

/** All applications, newest first by `receivedAt`. */
export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("received_at", { ascending: false });
  if (error) throw new Error(`listApplications failed: ${error.message}`);
  return (data as ApplicationRow[]).map(rowToApplication);
}

/** All applications for a given job, sorted by match score desc. */
export async function listApplicationsByJobCode(
  jobCode: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("job_code", jobCode)
    .order("match_score", { ascending: false });
  if (error)
    throw new Error(`listApplicationsByJobCode failed: ${error.message}`);
  return (data as ApplicationRow[]).map(rowToApplication);
}

export async function getApplicationById(
  id: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getApplicationById failed: ${error.message}`);
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function countApplicationsByJobCode(
  jobCode: string
): Promise<number> {
  // `head: true` skips returning rows — Postgres only computes the count.
  const { count, error } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_code", jobCode);
  if (error)
    throw new Error(`countApplicationsByJobCode failed: ${error.message}`);
  return count ?? 0;
}

export type CreateApplicationInput = Omit<Application, "id" | "receivedAt">;

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const newRow = {
    id: crypto.randomUUID(),
    job_id: input.jobId,
    job_code: input.jobCode,
    candidate_id: input.candidateId,
    candidate_name: input.candidateName,
    candidate_email: input.candidateEmail,
    candidate_location: input.candidateLocation,
    candidate_years_of_experience: input.candidateYearsOfExperience,
    match_score: input.matchScore,
    match_summary: input.matchSummary,
    match_breakdown: input.matchBreakdown,
    cover_letter: input.coverLetter,
    status: input.status,
    // received_at defaults to now() in Postgres
  };

  const { data, error } = await supabase
    .from("applications")
    .insert(newRow)
    .select()
    .single();
  if (error) throw new Error(`createApplication failed: ${error.message}`);
  return rowToApplication(data as ApplicationRow);
}

/**
 * Update an Application's status (Reject, Shortlist, etc). Returns the
 * updated record, or null if not found. The status itself is the only
 * mutation; everything else (matchScore, breakdown, snapshots) stays.
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error)
    throw new Error(`updateApplicationStatus failed: ${error.message}`);
  return data ? rowToApplication(data as ApplicationRow) : null;
}
