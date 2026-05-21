"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listJobs, getJobById, updateJobStatus, listAllJobs } from "@/services/jobs.service";
import { jobKeys } from "@/constants/query-keys";

export function useJobs(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: "active" | "archived" | "draft";
  type?: "full-time" | "part-time" | "contract" | "internship";
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest";
}) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => listJobs(params),
  });
}

export function useJobById(code: string) {
  return useQuery({
    queryKey: jobKeys.detail(code),
    queryFn: () => getJobById(code),
  });
}

export function useAllJobs() {
  return useQuery({
    queryKey: jobKeys.all,
    queryFn: listAllJobs,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, status }: { code: string; status: "active" | "archived" }) =>
      updateJobStatus(code, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
