"use client";

import { useQuery } from "@tanstack/react-query";
import { getJobById, listJobs } from "@/services/jobs.service";
import type { Job } from "@/types/jobs";

export function useJobById(code: string, initialData?: Job) {
  return useQuery({
    queryKey: ["jobs", "detail", code],
    queryFn: () => getJobById(code),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useJobs(initialData?: Job[]) {
  return useQuery({
    queryKey: ["jobs", "list"],
    queryFn: () => listJobs(false),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useJobsIncludeArchived(initialData?: Job[]) {
  return useQuery({
    queryKey: ["jobs", "list", "archived"],
    queryFn: () => listJobs(true),
    initialData,
    staleTime: 60 * 1000,
  });
}
