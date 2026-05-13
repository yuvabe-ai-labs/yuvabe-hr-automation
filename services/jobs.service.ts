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
  };
}

export type JobsListResult = { jobs: Job[]; total: number };

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

export async function listJobs(options?: {
  includeArchived?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<JobsListResult> {
  try {
    const { includeArchived, search, page = 1, pageSize = 10 } = options ?? {};
    const client = getSupabasePeopleClient();
    let query = client
      .from("jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (!includeArchived) {
      query = query.is("archived_at", null);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error || !data) {
  return { jobs: [], total: 0 };
}
    return { jobs: (data as JobRow[]).map(mapRowToJob), total: count ?? 0 };
  } catch (err) {
  console.error("listJobs exception:", err);
  return { jobs: [], total: 0 };
}
}

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
