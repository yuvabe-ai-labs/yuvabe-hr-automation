import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { Application, ApplicationRow, ApplicationStatus } from "@/types/applications";

function mapRowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobId: row.job_id || "",
    jobCode: row.job_code || "",
    candidateId: row.candidate_id || "",
    candidateName: row.candidate_name || "",
    candidateEmail: row.candidate_email || "",
    candidateLocation: row.candidate_location || "",
    candidateYearsOfExperience: row.candidate_years_of_experience || 0,
    matchScore: row.match_score || 0,
    matchSummary: row.match_summary || "",
    matchBreakdown: (row.match_breakdown as any[]) || [],
    coverLetter: row.cover_letter || "",
    resumeUrl: row.resume_url || undefined,
    receivedAt: row.received_at || new Date().toISOString(),
    status: (row.status as ApplicationStatus) || "new",
  };
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return mapRowToApplication(data as ApplicationRow);
  } catch {
    return undefined;
  }
}

export async function listApplications(): Promise<Application[]> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("applications")
      .select("*")
      .order("received_at", { ascending: false });

    if (error || !data) return [];
    return (data as ApplicationRow[]).map(mapRowToApplication);
  } catch {
    return [];
  }
}

export async function listApplicationsByJobCode(jobCode: string): Promise<Application[]> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("applications")
      .select("*")
      .eq("job_code", jobCode)
      .order("match_score", { ascending: false });

    if (error || !data) return [];
    return (data as ApplicationRow[]).map(mapRowToApplication);
  } catch {
    return [];
  }
}

export async function countApplicationsByJobCode(jobCode: string): Promise<number> {
  try {
    const client = getSupabasePeopleClient();
    const { count, error } = await client
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("job_code", jobCode);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<Application | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return undefined;
    return mapRowToApplication(data as ApplicationRow);
  } catch {
    return undefined;
  }
}
