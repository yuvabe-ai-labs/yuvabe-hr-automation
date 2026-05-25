import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { Application, ApplicationRow, ApplicationStatus } from "@/types/applications";
import { interviewsRepository } from "@/repositories/interviews.repository";

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
    rejectionReason: row.rejection_reason ?? undefined,
    assignedInterviewerId: row.assigned_interviewer_id ?? undefined,
  };
}

export type FilterStatus = "reviewing" | "shortlisted" | "rejected";

export type ApplicationsPageResult = {
  applications: Application[];
  total: number;
  statusCounts: Record<FilterStatus | "new", number>;
};

const STATUS_GROUP: Record<FilterStatus, ApplicationStatus[]> = {
  reviewing:   ["reviewing"],
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
  dateFrom?: string;
  dateTo?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
  dateSort?: "newest" | "oldest";
};

export type AllApplicationsQueryParams = {
  status?: FilterStatus | "new";
  search?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
  sort?: "newest" | "oldest";
  managerId?: string;
};

export type AllApplicationsPageResult = {
  applications: Application[];
  total: number;
  allTotal: number; // unfiltered count — used for the "ALL" tab chip
  statusCounts: Record<FilterStatus | "new", number>;
};

// Fetch a single application by ID
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

// Fetch all applications across all jobs, newest first (no pagination)
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

// Fetch paginated + filtered applications for a specific job with per-status counts
export async function listApplicationsByJobCode(
  jobCode: string,
  options?: ApplicationsQueryParams
): Promise<ApplicationsPageResult> {
  try {
    const { status, search, sort = "desc", minScore = 0, page = 1, pageSize = 15, dateFrom, dateTo, minYearsExp, maxYearsExp, dateSort } = options ?? {};
    const client = getSupabasePeopleClient();

    // Status breakdown — lightweight count query for chip totals
    const { data: statusRows } = await client
      .from("applications")
      .select("status")
      .eq("job_code", jobCode);

    const rawCounts: Record<ApplicationStatus, number> = {
      new: 0, reviewing: 0, shortlisted: 0, interview_scheduled: 0,
      interviewed: 0, offered: 0, hired: 0, rejected: 0, withdrawn: 0,
    };
    for (const row of statusRows ?? []) {
      const s = row.status as ApplicationStatus;
      if (s in rawCounts) rawCounts[s]++;
    }
    const statusCounts: Record<FilterStatus | "new", number> = {
      new:         rawCounts.new,
      reviewing:   rawCounts.reviewing,
      shortlisted: rawCounts.shortlisted + rawCounts.offered,
      rejected:    rawCounts.rejected,
    };

    // Paginated main query — date sort replaces score sort when selected
    let query = client
      .from("applications")
      .select("*", { count: "exact" })
      .eq("job_code", jobCode);

    if (dateSort) {
      query = query.order("received_at", { ascending: dateSort === "oldest" });
    } else {
      query = query.order("match_score", { ascending: sort === "asc" });
    }

    if (status) {
      const group = STATUS_GROUP[status as FilterStatus] ?? [status];
      query = query.in("status", group);
    }
    if (search)      query = query.ilike("candidate_name", `%${search}%`);
    if (minScore > 0) query = query.gte("match_score", minScore);
    if (dateFrom)    query = query.gte("received_at", dateFrom);
    if (dateTo)      query = query.lte("received_at", dateTo);
    if (minYearsExp) query = query.gte("candidate_years_of_experience", minYearsExp);
    if (maxYearsExp) query = query.lte("candidate_years_of_experience", maxYearsExp);

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

// Fetch paginated + filtered applications across all jobs with per-status counts
export async function listApplicationsAll(
  options?: AllApplicationsQueryParams
): Promise<AllApplicationsPageResult> {
  const { status, search, minScore = 0, page = 1, pageSize = 10, dateFrom, dateTo, minYearsExp, maxYearsExp, sort = "newest", managerId } = options ?? {};
  const client = getSupabasePeopleClient();

  // When scoped to a manager, resolve their assigned job IDs first.
  let assignedJobIds: string[] | undefined;
  if (managerId) {
    const { data: jobRows } = await client
      .from("jobs")
      .select("id")
      .eq("hiring_manager_id", managerId);
    assignedJobIds = (jobRows ?? []).map((r: { id: string }) => r.id);
    // Manager has no assigned jobs — return empty result immediately.
    if (assignedJobIds.length === 0) {
      return {
        applications: [],
        total: 0,
        allTotal: 0,
        statusCounts: { new: 0, reviewing: 0, shortlisted: 0, rejected: 0 },
      };
    }
  }

  // Status breakdown — lightweight count query for chip totals
  let statusQuery = client.from("applications").select("status");
  if (assignedJobIds) statusQuery = statusQuery.in("job_id", assignedJobIds);
  const { data: statusRows } = await statusQuery;

  const rawCounts: Record<ApplicationStatus, number> = {
    new: 0, reviewing: 0, shortlisted: 0, interview_scheduled: 0,
    interviewed: 0, offered: 0, hired: 0, rejected: 0, withdrawn: 0,
  };
  for (const row of statusRows ?? []) {
    const s = row.status as ApplicationStatus;
    if (s in rawCounts) rawCounts[s]++;
  }
  const statusCounts: Record<FilterStatus | "new", number> = {
    new:         rawCounts.new,
    reviewing:   rawCounts.reviewing,
    shortlisted: rawCounts.shortlisted + rawCounts.offered,
    rejected:    rawCounts.rejected,
  };

  let query = client
    .from("applications")
    .select("*", { count: "exact" })
    .order("received_at", { ascending: sort === "oldest" });

  if (assignedJobIds) query = query.in("job_id", assignedJobIds);
  if (status) {
    if (status === "new") {
      query = query.eq("status", "new");
    } else {
      const group = STATUS_GROUP[status] ?? [status];
      query = query.in("status", group);
    }
  }
  if (search)      query = query.ilike("candidate_name", `%${search}%`);
  if (minScore > 0) query = query.gte("match_score", minScore);
  if (dateFrom)    query = query.gte("received_at", dateFrom);
  if (dateTo)      query = query.lte("received_at", dateTo);
  if (minYearsExp) query = query.gte("candidate_years_of_experience", minYearsExp);
  if (maxYearsExp) query = query.lte("candidate_years_of_experience", maxYearsExp);

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error || !data) throw new Error(error?.message ?? "Failed to fetch applications");

  return {
    applications: (data as ApplicationRow[]).map(mapRowToApplication),
    total: count ?? 0,
    allTotal: statusRows?.length ?? 0,
    statusCounts,
  };
}

// Count total applications for a given job code
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

// Update the status field of an application
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

    if (status === "interviewed") {
      const latest = await interviewsRepository.findLatestActiveByApplicationId(id)
      if (latest) {
        await interviewsRepository.updateStatus(latest.id, "completed")
      }
    }

    return mapRowToApplication(data as ApplicationRow);
  } catch {
    return undefined;
  }
}

// Update status with an optional rejection reason (used for post-interview rejection)
export async function updateApplicationStatusWithReason(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string
): Promise<Application | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("applications")
      .update({ status, rejection_reason: rejectionReason ?? null })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return undefined;
    return mapRowToApplication(data as ApplicationRow);
  } catch {
    return undefined;
  }
}
