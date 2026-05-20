"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApplicationById,
  listApplications,
  listApplicationsByJobCode,
  listApplicationsAll,
  updateApplicationStatus,
  updateApplicationStatusWithReason,
} from "@/services/applications.service";
import type {
  ApplicationsPageResult,
  ApplicationsQueryParams,
  AllApplicationsQueryParams,
  AllApplicationsPageResult,
} from "@/services/applications.service";
import type { ApplicationStatus } from "@/types/applications";

export type { ApplicationsQueryParams, ApplicationsPageResult, AllApplicationsQueryParams, AllApplicationsPageResult };

// Fetch a single application by ID
export function useApplicationById(id: string) {
  return useQuery({
    queryKey: ["applications", "detail", id],
    queryFn: () => getApplicationById(id),
  });
}

// Fetch all applications across all jobs (flat list, no pagination)
export function useApplications() {
  return useQuery({
    queryKey: ["applications", "list"],
    queryFn: listApplications,
  });
}

// Fetch paginated + filtered applications for a specific job
export function useApplicationsByJobCode(jobCode: string, params?: ApplicationsQueryParams) {
  return useQuery({
    queryKey: ["applications", "list", jobCode, params],
    queryFn: () => listApplicationsByJobCode(jobCode, params),
  });
}

// Fetch paginated + filtered applications across all jobs
export function useApplicationsAll(params?: AllApplicationsQueryParams) {
  return useQuery({
    queryKey: ["applications", "all", params],
    queryFn: () => listApplicationsAll(params),
  });
}

// Update the status of an application (reviewing / shortlisted / rejected / offered)
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "all"] });
    },
  });
}

// Update status with an optional rejection reason (post-interview: hired / rejected)
export function useUpdateApplicationStatusWithReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: ApplicationStatus;
      rejectionReason?: string;
    }) => updateApplicationStatusWithReason(id, status, rejectionReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "all"] });
    },
  });
}
