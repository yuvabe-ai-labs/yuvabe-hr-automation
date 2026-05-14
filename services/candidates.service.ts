import { getSupabasePeopleClient } from "@/integrations/supabase-people";

export type CandidateEnrichment = {
  id: string;
  phone: string;
  skills: string[];
  links: { linkedin?: string; portfolio?: string; github?: string } | null;
};

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
