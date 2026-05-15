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

export type FilterStatus = "reviewing" | "shortlisted" | "rejected";

export type ApplicationsPageResult = {
  applications: Application[];
  total: number;
  statusCounts: Record<FilterStatus, number>;
};

const STATUS_GROUP: Record<FilterStatus, ApplicationStatus[]> = {
  reviewing:   ["reviewing", "new"],
  shortlisted: ["shortlisted", "offered"],
  rejected:    ["rejected"],
};

export type ApplicationsQueryParams = {
  status?: ApplicationStatus | null;
  search?: string;
  sort?: "asc" | "desc";
  minScore?: number;
  page?: number;
  pageSize?: number;
};

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

export async function listApplicationsByJobCode(
  jobCode: string,
  options?: ApplicationsQueryParams
): Promise<ApplicationsPageResult> {
  try {
    const { status, search, sort = "desc", minScore = 0, page = 1, pageSize = 15 } = options ?? {};
    const client = getSupabasePeopleClient();

    // Status breakdown — lightweight, no pagination, used for chip counts
    const { data: statusRows } = await client
      .from("applications")
      .select("status")
      .eq("job_code", jobCode);

    const rawCounts: Record<ApplicationStatus, number> = {
      new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0,
    };
    for (const row of statusRows ?? []) {
      const s = row.status as ApplicationStatus;
      if (s in rawCounts) rawCounts[s]++;
    }
    const statusCounts: Record<FilterStatus, number> = {
      reviewing:   rawCounts.reviewing + rawCounts.new,
      shortlisted: rawCounts.shortlisted + rawCounts.offered,
      rejected:    rawCounts.rejected,
    };

    // Paginated main query
    let query = client
      .from("applications")
      .select("*", { count: "exact" })
      .eq("job_code", jobCode)
      .order("match_score", { ascending: sort === "asc" });

    if (status) {
      const group = STATUS_GROUP[status as FilterStatus] ?? [status];
      query = query.in("status", group);
    }
    if (search) query = query.ilike("candidate_name", `%${search}%`);
    if (minScore > 0) query = query.gte("match_score", minScore);

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error || !data) throw new Error(error?.message ?? "Failed to fetch applications");

    return {
      applications: (data as ApplicationRow[]).map(mapRowToApplication),
      total: count ?? 0,
      statusCounts,
    };
  } catch (error) {
    throw error;
  }
}

export type AllApplicationsQueryParams = {
  status?: FilterStatus;
  search?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
};

export type AllApplicationsPageResult = {
  applications: Application[];
  total: number;
  statusCounts: Record<FilterStatus, number>;
};

export async function listApplicationsAll(
  options?: AllApplicationsQueryParams
): Promise<AllApplicationsPageResult> {
  const { status, search, minScore = 0, page = 1, pageSize = 15 } = options ?? {};
  const client = getSupabasePeopleClient();

  // Status counts across ALL apps — for chip display
  const { data: statusRows } = await client
    .from("applications")
    .select("status");

  const rawCounts: Record<ApplicationStatus, number> = {
    new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0,
  };
  for (const row of statusRows ?? []) {
    const s = row.status as ApplicationStatus;
    if (s in rawCounts) rawCounts[s]++;
  }
  const statusCounts: Record<FilterStatus, number> = {
    reviewing:   rawCounts.reviewing + rawCounts.new,
    shortlisted: rawCounts.shortlisted + rawCounts.offered,
    rejected:    rawCounts.rejected,
  };

  let query = client
    .from("applications")
    .select("*", { count: "exact" })
    .order("received_at", { ascending: false });

  if (status) {
    const group = STATUS_GROUP[status] ?? [status];
    query = query.in("status", group);
  }
  if (search) query = query.ilike("candidate_name", `%${search}%`);
  if (minScore > 0) query = query.gte("match_score", minScore);

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error || !data) throw new Error(error?.message ?? "Failed to fetch applications");

  return {
    applications: (data as ApplicationRow[]).map(mapRowToApplication),
    total: count ?? 0,
    statusCounts,
  };
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
