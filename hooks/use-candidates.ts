"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getCandidateById, getCandidatesByIds } from "@/services/candidates.service";
import type { Candidate, CandidateEnrichment } from "@/services/candidates.service";

export type { Candidate, CandidateEnrichment };

// Fetch a single candidate's full profile by ID
export function useCandidateById(id: string) {
  return useQuery({
    queryKey: ["candidates", "detail", id],
    queryFn: () => getCandidateById(id),
    enabled: !!id,
  });
}

// Fetch candidate enrichment data (phone, skills, links) for a list of candidate IDs
export function useGetCandidatesByIds() {
  return useMutation({
    mutationFn: (ids: string[]) => getCandidatesByIds(ids),
  });
}
