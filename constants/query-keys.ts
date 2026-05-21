import type { ApplicationsQueryParams, AllApplicationsQueryParams } from "@/services/applications.service"

export const applicationKeys = {
  all:     ['applications'] as const,
  lists:   () => [...applicationKeys.all, 'list'] as const,
  list:    (jobCode?: string, params?: ApplicationsQueryParams) =>
             [...applicationKeys.lists(), jobCode, params] as const,
  allList: (params?: AllApplicationsQueryParams) =>
             [...applicationKeys.all, 'all', params] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail:  (id: string) => [...applicationKeys.details(), id] as const,
}

export const interviewKeys = {
  all:      ['interviews'] as const,
  byApp:    (appId: string) => [...interviewKeys.all, 'app', appId] as const,
  upcoming: () => [...interviewKeys.all, 'upcoming'] as const,
}
export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (filters?: object) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (code: string) => [...jobKeys.details(), code] as const,
};

