"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { interviewKeys, applicationKeys } from "@/constants/query-keys"

// Types defined locally — no server-side imports in client hooks
export type Interview = {
  id: string
  applicationId: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  jobId: string
  jobCode: string
  jobTitle: string
  title: string
  scheduledAt: string
  durationMinutes: number
  timezone: string
  status: string
  notes: string | undefined
  location: string | undefined
  meetingLink: string | undefined
  interviewerId: string | undefined
  interviewerName: string | undefined
  createdAt: string
}

export type ScheduleInterviewInput = {
  candidateId: string
  candidateName: string
  candidateEmail: string
  jobId: string
  jobCode: string
  jobTitle: string
  title: string
  scheduledAt: string
  durationMinutes: number
  timezone: string
  notes?: string
  location?: string
  meetingLink?: string
  interviewerId?: string
  interviewerName?: string
  hmEmail?: string
}

async function fetchInterviewsByApplication(appId: string): Promise<Interview[]> {
  const res = await fetch(`/api/applications/${appId}/interviews`)
  if (!res.ok) throw new Error("Failed to fetch interviews")
  const json = await res.json()
  return json.interviews
}

async function fetchUpcomingInterviews(): Promise<Interview[]> {
  const res = await fetch("/api/interviews")
  if (!res.ok) throw new Error("Failed to fetch upcoming interviews")
  const json = await res.json()
  return json.interviews
}

async function postScheduleInterview(
  appId: string,
  input: ScheduleInterviewInput
): Promise<Interview> {
  const res = await fetch(`/api/applications/${appId}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? "Failed to schedule interview")
  }
  const json = await res.json()
  return json.interview
}

export function useInterviewsByApplication(appId: string) {
  return useQuery({
    queryKey: interviewKeys.byApp(appId),
    queryFn: () => fetchInterviewsByApplication(appId),
    enabled: !!appId,
  })
}

export function useUpcomingInterviews() {
  return useQuery({
    queryKey: interviewKeys.upcoming(),
    queryFn: fetchUpcomingInterviews,
  })
}

export function useScheduleInterview(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ScheduleInterviewInput) => postScheduleInterview(appId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.byApp(appId) })
      queryClient.invalidateQueries({ queryKey: interviewKeys.upcoming() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(appId) })
    },
  })
}
