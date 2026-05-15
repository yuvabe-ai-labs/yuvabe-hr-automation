"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
  params?: { search?: string; page?: number; pageSize?: number; status?: "active" | "archived" },
  initialData?: JobsListResult
) {
  return useQuery({
    queryKey: [
      "jobs",
      "list",
      params?.search ?? "",
      params?.page ?? 1,
      params?.pageSize ?? 10,
      params?.status ?? "active",
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
    queryFn: () => listJobs({ status: "archived" }),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, status }: { code: string; status: "active" | "archived" }) =>
      fetch(`/api/jobs/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", status }),
      }).then((r) => r.json()),
    onMutate: async ({ code }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs", "list"] });
      const previousData = queryClient.getQueriesData<JobsListResult>({
        queryKey: ["jobs", "list"],
      });
      queryClient.setQueriesData<JobsListResult>(
        { queryKey: ["jobs", "list"] },
        (old) => {
          if (!old) return old;
          const jobs = old.jobs.filter((j) => j.code !== code);
          return { ...old, jobs, total: Math.max(0, old.total - 1) };
        }
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      for (const [key, data] of context?.previousData ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
