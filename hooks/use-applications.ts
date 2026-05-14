"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getApplicationById,
  listApplications,
  listApplicationsByJobCode,
  updateApplicationStatus,
} from "@/services/applications.service";
import type { ApplicationsPageResult, ApplicationsQueryParams } from "@/services/applications.service";
import type { Application, ApplicationStatus } from "@/types/applications";

export type { ApplicationsQueryParams, ApplicationsPageResult };

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
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: (_data: Application | undefined, variables: { id: string; status: ApplicationStatus }) => {
      queryClient.invalidateQueries({
        queryKey: ["applications", "detail", variables.id],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["applications", "list"],
      });
    },
  });
}
