import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { Job, JobRow } from "@/types/jobs";

function mapRowToJob(row: JobRow): Job {
  return {
    id: row.id || "",
    code: row.code || "",
    title: row.title || "",
    description: row.description || "",
    criteria: (row.criteria as any[]) || [],
    department: row.department || undefined,
    location: row.location || undefined,
    compensation: row.compensation || undefined,
    type: row.type || undefined,
    level: row.level || undefined,
    summary: row.summary || undefined,
    responsibilities: (row.responsibilities as string[]) || [],
    requirements: (row.requirements as string[]) || [],
    niceToHave: (row.nicetohave as string[]) || [],
    portfolioRequirement: row.portfoliorequirement || undefined,
    benefitsRemote: (row.benefits_remote as string[]) || [],
    benefitsInPerson: (row.benefits_inperson as string[]) || [],
    workCulture: (row.workculture as string[]) || [],
    createdAt: row.created_at || new Date().toISOString(),
    archivedAt: row.archived_at || undefined,
    status: (row.status as "draft" | "active" | "archived") || "active",
    publishedAt: row.published_at || undefined,
    closedAt: row.closed_at || undefined,
    isPaidListing: row.is_paid_listing ?? false,
    hiringManagerId: row.hiring_manager_id || undefined,
  };
}

export type JobsListResult = { jobs: Job[]; total: number };

// Fetch a single job by its public code
export async function getJobById(code: string): Promise<Job | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) return undefined;
    return mapRowToJob(data as JobRow);
  } catch {
    return undefined;
  }
}

// Fetch paginated list of jobs filtered by status and optional search
export async function listJobs(options?: {
  status?: "active" | "archived";
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<JobsListResult> {
  try {
    const { status = "active", search, page = 1, pageSize = 10 } = options ?? {};
    const client = getSupabasePeopleClient();
    let query = client
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);
    if (!data) throw new Error("No data returned from jobs query");
    return { jobs: (data as JobRow[]).map(mapRowToJob), total: count ?? 0 };
  } catch (err) {
    throw err instanceof Error ? err : new Error("listJobs failed");
  }
}

// Fetch all jobs without status filter or pagination — used for cross-page lookups
export async function listAllJobs(): Promise<Job[]> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as JobRow[]).map(mapRowToJob);
  } catch (err) {
    throw err instanceof Error ? err : new Error("listAllJobs failed");
  }
}

// Count applications for a given job code
export async function countJobsByCode(code: string): Promise<number> {
  try {
    const client = getSupabasePeopleClient();
    const { count, error } = await client
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("job_code", code);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Archive or unarchive a job by its code
export async function updateJobStatus(
  code: string,
  status: "active" | "archived"
): Promise<Job | undefined> {
  try {
    const client = getSupabasePeopleClient();
    const { data, error } = await client
      .from("jobs")
      .update({
        status,
        archived_at: status === "archived" ? new Date().toISOString() : null,
      })
      .eq("code", code)
      .select()
      .single();

    if (error || !data) return undefined;
    return mapRowToJob(data as JobRow);
  } catch {
    return undefined;
  }
}
