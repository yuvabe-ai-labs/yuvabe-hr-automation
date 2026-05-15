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
    onSuccess: (data: Application | undefined, variables: { id: string; status: ApplicationStatus }) => {
      // Immediately patch the status in every cached list query so the UI
      // updates without waiting for a background refetch.
      queryClient.setQueriesData<ApplicationsPageResult>(
        { queryKey: ["applications", "list"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((app) =>
              app.id === variables.id ? { ...app, status: variables.status } : app
            ),
          };
        }
      );
      queryClient.setQueriesData<AllApplicationsPageResult>(
        { queryKey: ["applications", "all"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((app) =>
              app.id === variables.id ? { ...app, status: variables.status } : app
            ),
          };
        }
      );
      // Invalidate so statusCounts chips and detail page get a fresh server fetch.
      queryClient.invalidateQueries({ queryKey: ["applications", "detail", variables.id], exact: true });
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "all"] });
    },
  });
}
