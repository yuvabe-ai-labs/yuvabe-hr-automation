import { getSupabasePeopleClient } from "@/integrations/supabase-people"
import type { Tables } from "@/integrations/database.types"

type InterviewRow = Tables<"interviews">

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

export type CreateInterviewInput = {
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
  notes?: string
  location?: string
  meetingLink?: string
  interviewerId?: string
  interviewerName?: string
}

function rowToInterview(row: InterviewRow): Interview {
  return {
    id: row.id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    jobId: row.job_id,
    jobCode: row.job_code,
    jobTitle: row.job_title,
    title: row.title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    timezone: row.timezone,
    status: row.status,
    notes: row.notes ?? undefined,
    location: row.location ?? undefined,
    meetingLink: row.meeting_link ?? undefined,
    interviewerId: row.interviewer_id ?? undefined,
    interviewerName: row.interviewer_name ?? undefined,
    createdAt: row.created_at,
  }
}

export const interviewsRepository = {
  async findByApplicationId(applicationId: string): Promise<Interview[]> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("application_id", applicationId)
      .order("scheduled_at", { ascending: true })
    if (error) throw new Error(`Failed to fetch interviews: ${error.message}`)
    return (data ?? []).map(rowToInterview)
  },

  async findUpcoming(): Promise<Interview[]> {
    const supabase = getSupabasePeopleClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
    if (error) throw new Error(`Failed to fetch upcoming interviews: ${error.message}`)
    return (data ?? []).map(rowToInterview)
  },

  async create(input: CreateInterviewInput): Promise<Interview> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase
      .from("interviews")
      .insert({
        application_id:   input.applicationId,
        candidate_id:     input.candidateId,
        candidate_name:   input.candidateName,
        candidate_email:  input.candidateEmail,
        job_id:           input.jobId,
        job_code:         input.jobCode,
        job_title:        input.jobTitle,
        title:            input.title,
        scheduled_at:     input.scheduledAt,
        duration_minutes: input.durationMinutes,
        timezone:         input.timezone,
        status:           "scheduled",
        notes:            input.notes ?? null,
        location:         input.location ?? null,
        meeting_link:     input.meetingLink ?? null,
        interviewer_id:   input.interviewerId ?? null,
        interviewer_name: input.interviewerName ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`Failed to create interview: ${error.message}`)
    return rowToInterview(data)
  },
}
