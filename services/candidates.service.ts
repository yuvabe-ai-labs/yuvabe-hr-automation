import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { Candidate, CandidateRow, CandidateLinks, ExperienceEntry, EducationEntry } from "@/types/candidates";

type RawExpEntry = {
  company?: string; title?: string; description?: string;
  startDate?: string; start_date?: string;
  endDate?: string; end_date?: string;
};

export type { Candidate, CandidateLinks, ExperienceEntry, EducationEntry };

export type CandidateEnrichment = {
  id: string;
  phone: string;
  skills: string[];
  links: { linkedin?: string; portfolio?: string; github?: string } | null;
};

function mapRowToCandidate(row: CandidateRow): Candidate {
  const links = typeof row.links === "string"
    ? (JSON.parse(row.links) as CandidateLinks)
    : (row.links as CandidateLinks | null);
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    summary: row.summary ?? "",
    yearsOfExperience: row.years_of_experience ?? 0,
    skills: (row.skills as string[]) ?? [],
    experience: ((row.experience as unknown as RawExpEntry[]) ?? []).map((e) => ({
      company: e.company ?? "",
      title: e.title ?? "",
      startDate: e.startDate ?? e.start_date ?? "",
      endDate: e.endDate ?? e.end_date ?? "",
      description: e.description ?? "",
    })),
    education: (row.education as EducationEntry[]) ?? [],
    links: links ?? undefined,
    resumeText: row.resume_text ?? "",
  };
}

// Fetch a single candidate's full profile by ID
export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("candidates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return mapRowToCandidate(data as CandidateRow);
  } catch {
    return undefined;
  }
}

export async function getCandidatesByIds(
  ids: string[]
): Promise<Map<string, CandidateEnrichment>> {
  const result = new Map<string, CandidateEnrichment>();
  if (ids.length === 0) return result;

  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("candidates")
      .select("id, phone, skills, links")
      .in("id", ids);

    if (error || !data) return result;

    for (const row of data) {
      result.set(row.id, {
        id: row.id,
        phone: row.phone ?? "",
        skills: (row.skills as string[]) ?? [],
        links: (row.links as CandidateEnrichment["links"]) ?? null,
      });
    }
  } catch {
    // return empty map on error
  }

  return result;
}
