"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getJobById, listJobs } from "@/services/jobs.service";
import type { JobsListResult } from "@/services/jobs.service";
import type { Job } from "@/types/jobs";

export function useJobById(code: string, initialData?: Job) {
  return useQuery({
    queryKey: ["jobs", "detail", code],
    queryFn: () => getJobById(code),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useJobs(
  params?: { search?: string; page?: number; pageSize?: number },
  initialData?: JobsListResult
) {
  return useQuery({
    queryKey: [
  "jobs",
  "list",
  params?.search ?? "",
  params?.page ?? 1,
  params?.pageSize ?? 10,
],
    queryFn: () => listJobs(params),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useJobsIncludeArchived(initialData?: JobsListResult) {
  return useQuery({
    queryKey: ["jobs", "list", "archived"],
    queryFn: () => listJobs({ includeArchived: true }),
    initialData,
    staleTime: 60 * 1000,
  });
}
