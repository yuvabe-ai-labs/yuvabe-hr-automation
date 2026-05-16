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

      // Find the app + its current status from any cached list
      let oldStatus: ApplicationStatus | undefined;
      let mutatedApp: Application | undefined;
      for (const [, data] of prevList) {
        const found = data?.applications.find((a) => a.id === id);
        if (found) { mutatedApp = found; oldStatus = found.status; break; }
      }
      if (!oldStatus) {
        for (const [, data] of prevAll) {
          const found = data?.applications.find((a) => a.id === id);
          if (found) { mutatedApp = found; oldStatus = found.status; break; }
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
      // params.status is the filter for that cache entry.

      // 1. Source tab: remove app + decrement total
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

      // 2. Target tab (existing caches): add app + increment total
      queryClient.setQueriesData<ApplicationsPageResult>(
        {
          queryKey: ["applications", "list"],
          predicate: (q) => (q.queryKey[3] as ApplicationsQueryParams | undefined)?.status === newStatus,
        },
        (old) => {
          if (!old || !mutatedApp) return old;
          return {
            ...old,
            applications: [{ ...mutatedApp, status: newStatus }, ...old.applications],
            total: old.total + 1,
            statusCounts: patchCounts(old.statusCounts),
          };
        }
      );

      // 3. "All" tab and unrelated filter tabs: update app in-place + patch counts
      queryClient.setQueriesData<ApplicationsPageResult>(
        {
          queryKey: ["applications", "list"],
          predicate: (q) => {
            const s = (q.queryKey[3] as ApplicationsQueryParams | undefined)?.status;
            return s !== oldStatus && s !== newStatus;
          },
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

      // 4. Seed the target-tab cache from the "all" tab if it doesn't exist yet.
      //    Without this, navigating to the target tab triggers a fresh fetch that
      //    races against the in-flight PATCH and may arrive before it commits.
      if (mutatedApp) {
        const updatedApp = { ...mutatedApp, status: newStatus };
        for (const [qk, oldData] of prevList) {
          if (!oldData) continue;
          const params = (qk as unknown[])[3] as ApplicationsQueryParams | undefined;
          // Only seed from "all" tab entries that actually contain this app
          if (params?.status !== undefined) continue;
          if (!oldData.applications.some((a) => a.id === id)) continue;

          // Build the target-tab key: same key but with status = newStatus
          const targetKey = [
            (qk as unknown[])[0],
            (qk as unknown[])[1],
            (qk as unknown[])[2],
            { ...params, status: newStatus },
          ];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!queryClient.getQueryData(targetKey as any)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            queryClient.setQueryData(targetKey as any, {
              applications: [updatedApp],
              total: 1,
              statusCounts: patchCounts(oldData.statusCounts),
            });
          }
        }
      }

      // "all" cross-job list — same four-part pattern.
      // Query key shape: ["applications", "all", params] — params is at index 2.

      // 1. Source tab: remove + decrement total
      queryClient.setQueriesData<AllApplicationsPageResult>(
        {
          queryKey: ["applications", "all"],
          predicate: (q) => (q.queryKey[2] as AllApplicationsQueryParams | undefined)?.status === oldStatus,
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

      // 2. Target tab (existing caches): add app + increment total
      queryClient.setQueriesData<AllApplicationsPageResult>(
        {
          queryKey: ["applications", "all"],
          predicate: (q) => (q.queryKey[2] as AllApplicationsQueryParams | undefined)?.status === newStatus,
        },
        (old) => {
          if (!old || !mutatedApp) return old;
          return {
            ...old,
            applications: [{ ...mutatedApp, status: newStatus }, ...old.applications],
            total: old.total + 1,
            statusCounts: patchCounts(old.statusCounts),
          };
        }
      );

      // 3. "All" tab and unrelated filter tabs: update in-place + patch counts
      queryClient.setQueriesData<AllApplicationsPageResult>(
        {
          queryKey: ["applications", "all"],
          predicate: (q) => {
            const s = (q.queryKey[2] as AllApplicationsQueryParams | undefined)?.status;
            return s !== oldStatus && s !== newStatus;
          },
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

      // 4. Seed the target-tab cache from the "all" tab if it doesn't exist yet
      if (mutatedApp) {
        const updatedApp = { ...mutatedApp, status: newStatus };
        for (const [qk, oldData] of prevAll) {
          if (!oldData) continue;
          const params = (qk as unknown[])[2] as AllApplicationsQueryParams | undefined;
          if (params?.status !== undefined) continue;
          if (!oldData.applications.some((a) => a.id === id)) continue;

          const targetKey = [
            (qk as unknown[])[0],
            (qk as unknown[])[1],
            { ...params, status: newStatus },
          ];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!queryClient.getQueryData(targetKey as any)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            queryClient.setQueryData(targetKey as any, {
              applications: [updatedApp],
              total: 1,
              statusCounts: patchCounts(oldData.statusCounts),
            });
          }
        }
      }

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
