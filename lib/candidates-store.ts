/**
 * Candidates store, backed by Supabase Postgres.
 *
 * Public function signatures and entity shapes are unchanged from the prior
 * JSON-backed implementation — every caller (pages, API routes) keeps working
 * without edits. The only thing that changed is what's behind these functions.
 *
 * Schema: see supabase/migrations/0001_init.sql. Mapping is snake_case in the
 * DB, camelCase in TypeScript. The local `rowToCandidate()` adapter is the
 * only place that conversion happens.
 */

import { supabase } from "@/lib/supabase";

export type ExperienceEntry = {
  company: string;
  title: string;
  startDate: string;     // YYYY-MM
  endDate: string;       // YYYY-MM or "present"
  description: string;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  year: number;
};

export type CandidateLinks = {
  linkedin?: string;
  portfolio?: string;
  github?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;             // 1-2 sentence bio
  yearsOfExperience: number;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links?: CandidateLinks;
  resumeText: string;          // full parsed resume text
};

/** Row shape as returned by Supabase (snake_case columns, JSONB sub-collections). */
type CandidateRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  years_of_experience: number;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links: CandidateLinks | null;
  resume_text: string;
};

function rowToCandidate(row: CandidateRow): Candidate {
  const candidate: Candidate = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    summary: row.summary,
    yearsOfExperience: row.years_of_experience,
    skills: row.skills ?? [],
    experience: row.experience ?? [],
    education: row.education ?? [],
    resumeText: row.resume_text,
  };
  // Postgres null becomes undefined in the canonical TS shape (links is optional).
  if (row.links) candidate.links = row.links;
  return candidate;
}

export async function listCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase.from("candidates").select("*");
  if (error) throw new Error(`listCandidates failed: ${error.message}`);
  return (data as CandidateRow[]).map(rowToCandidate);
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCandidateById failed: ${error.message}`);
  return data ? rowToCandidate(data as CandidateRow) : null;
}

export type CreateCandidateInput = Omit<Candidate, "id">;

export async function createCandidate(
  input: CreateCandidateInput
): Promise<Candidate> {
  const newRow = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    location: input.location,
    summary: input.summary,
    years_of_experience: input.yearsOfExperience,
    skills: input.skills,
    experience: input.experience,
    education: input.education,
    links: input.links ?? null,
    resume_text: input.resumeText,
  };

  const { data, error } = await supabase
    .from("candidates")
    .insert(newRow)
    .select()
    .single();
  if (error) throw new Error(`createCandidate failed: ${error.message}`);
  return rowToCandidate(data as CandidateRow);
}
