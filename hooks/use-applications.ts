"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getApplicationById,
  listApplications,
  listApplicationsByJobCode,
  listApplicationsAll,
} from "@/services/applications.service";
import type {
  ApplicationsPageResult,
  ApplicationsQueryParams,
  AllApplicationsQueryParams,
  AllApplicationsPageResult,
} from "@/services/applications.service";
import type { Application, ApplicationStatus } from "@/types/applications";

export type { ApplicationsQueryParams, ApplicationsPageResult, AllApplicationsQueryParams, AllApplicationsPageResult };

export function useApplicationById(id: string, initialData?: Application) {
  return useQuery({
    queryKey: ["applications", "detail", id],
    queryFn: () => getApplicationById(id),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useApplications(initialData?: Application[]) {
  return useQuery({
    queryKey: ["applications", "list"],
    queryFn: listApplications,
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useApplicationsByJobCode(
  jobCode: string,
  params?: ApplicationsQueryParams,
  initialData?: ApplicationsPageResult
) {
  return useQuery({
    queryKey: ["applications", "list", jobCode, params],
    queryFn: () => listApplicationsByJobCode(jobCode, params),
    initialData,
    // No initialDataUpdatedAt — omitting it means React Query only uses
    // initialData to seed an EMPTY cache (first visit). It will never
    // override an existing (possibly invalidated) cache entry, so
    // invalidateQueries always wins and the background refetch fires.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useApplicationsAll(
  params?: AllApplicationsQueryParams,
  initialData?: AllApplicationsPageResult
) {
  return useQuery({
    queryKey: ["applications", "all", params],
    queryFn: () => listApplicationsAll(params),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Maps an ApplicationStatus to the statusCounts key it contributes to.
// "offered" rolls into "shortlisted" the same way the server does.
function toCountKey(status: ApplicationStatus): keyof ApplicationsPageResult["statusCounts"] | null {
  if (status === "new") return "new";
  if (status === "reviewing") return "reviewing";
  if (status === "shortlisted" || status === "offered") return "shortlisted";
  if (status === "rejected") return "rejected";
  return null;
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to update status");
      }
      const { application } = await res.json();
      return application as Application;
    },
    onMutate: async ({ id, status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["applications", "list"] });
      await queryClient.cancelQueries({ queryKey: ["applications", "all"] });

      const prevList = queryClient.getQueriesData<ApplicationsPageResult>({ queryKey: ["applications", "list"] });
      const prevAll  = queryClient.getQueriesData<AllApplicationsPageResult>({ queryKey: ["applications", "all"] });

      // Find the application's current status from any cached list
      let oldStatus: ApplicationStatus | undefined;
      for (const [, data] of prevList) {
        const found = data?.applications.find((a) => a.id === id);
        if (found) { oldStatus = found.status; break; }
      }
      if (!oldStatus) {
        for (const [, data] of prevAll) {
          const found = data?.applications.find((a) => a.id === id);
          if (found) { oldStatus = found.status; break; }
        }
      }

      const oldKey = oldStatus ? toCountKey(oldStatus) : null;
      const newKey = toCountKey(newStatus);

      function patchCounts(statusCounts: ApplicationsPageResult["statusCounts"]) {
        const next = { ...statusCounts };
        if (oldKey && oldKey !== newKey) next[oldKey] = Math.max(0, (next[oldKey] ?? 0) - 1);
        if (newKey && newKey !== oldKey) next[newKey] = (next[newKey] ?? 0) + 1;
        return next;
      }

      // Query key shape: ["applications", "list", jobCode, params]
      // params.status is the active filter for that cache entry.

      // Caches filtered to the old status: remove the row + decrement total
      queryClient.setQueriesData<ApplicationsPageResult>(
        {
          queryKey: ["applications", "list"],
          predicate: (q) => (q.queryKey[3] as ApplicationsQueryParams | undefined)?.status === oldStatus,
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.filter((a) => a.id !== id),
            total: Math.max(0, old.total - 1),
            statusCounts: patchCounts(old.statusCounts),
          };
        }
      );

      // All other caches (unfiltered "all" tab, or filtered to a different status):
      // update the row's status in-place and patch counts
      queryClient.setQueriesData<ApplicationsPageResult>(
        {
          queryKey: ["applications", "list"],
          predicate: (q) => (q.queryKey[3] as ApplicationsQueryParams | undefined)?.status !== oldStatus,
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((a) => a.id === id ? { ...a, status: newStatus } : a),
            statusCounts: patchCounts(old.statusCounts),
          };
        }
      );

      // "all" cross-job list: update in-place, patch counts
      queryClient.setQueriesData<AllApplicationsPageResult>(
        { queryKey: ["applications", "all"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((a) => a.id === id ? { ...a, status: newStatus } : a),
            statusCounts: patchCounts(old.statusCounts),
          };
        }
      );

      return { prevList, prevAll };
    },
    onError: (_err, _vars, context) => {
      for (const [key, data] of context?.prevList ?? []) queryClient.setQueryData(key, data);
      for (const [key, data] of context?.prevAll  ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications", "detail", variables.id], exact: true });
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "all"] });
    },
  });
}
