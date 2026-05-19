"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listJobs, getJobById, updateJobStatus, listAllJobs } from "@/services/jobs.service";

export function useJobs(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: "active" | "archived";
}) {
  return useQuery({
    queryKey: ["jobs", "list", params],
    queryFn: () => listJobs(params),
  });
}

export function useJobById(code: string) {
  return useQuery({
    queryKey: ["jobs", "detail", code],
    queryFn: () => getJobById(code),
  });
}

export function useAllJobs() {
  return useQuery({
    queryKey: ["jobs", "all"],
    queryFn: listAllJobs,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, status }: { code: string; status: "active" | "archived" }) =>
      updateJobStatus(code, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
