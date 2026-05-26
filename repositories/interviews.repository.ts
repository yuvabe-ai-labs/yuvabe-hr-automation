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

export type UpdateInterviewInput = {
  title?: string
  scheduledAt?: string
  durationMinutes?: number
  timezone?: string
  notes?: string | null
  location?: string | null
  meetingLink?: string | null
  interviewerId?: string | null
  interviewerName?: string | null
}

export const interviewsRepository = {
  async findById(id: string): Promise<Interview | null> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch interview: ${error.message}`)
    return data ? rowToInterview(data) : null
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const supabase = getSupabasePeopleClient()
    const { error } = await supabase
      .from("interviews")
      .update({ status })
      .eq("id", id)
    if (error) throw new Error(`Failed to update interview status: ${error.message}`)
  },

  async update(id: string, input: UpdateInterviewInput): Promise<Interview> {
    const supabase = getSupabasePeopleClient()
    const patch: Partial<InterviewRow> = {}
    if (input.title !== undefined)            patch.title             = input.title
    if (input.scheduledAt !== undefined)      patch.scheduled_at      = input.scheduledAt
    if (input.durationMinutes !== undefined)  patch.duration_minutes  = input.durationMinutes
    if (input.timezone !== undefined)         patch.timezone          = input.timezone
    if ("notes" in input)                     patch.notes             = input.notes ?? null
    if ("location" in input)                  patch.location          = input.location ?? null
    if ("meetingLink" in input)               patch.meeting_link      = input.meetingLink ?? null
    if ("interviewerId" in input)             patch.interviewer_id    = input.interviewerId ?? null
    if ("interviewerName" in input)           patch.interviewer_name  = input.interviewerName ?? null

    const { data, error } = await supabase
      .from("interviews")
      .update(patch)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`Failed to update interview: ${error.message}`)
    return rowToInterview(data)
  },

  async findLatestActiveByApplicationId(applicationId: string): Promise<Interview | null> {
    const supabase = getSupabasePeopleClient()
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("application_id", applicationId)
      .in("status", ["scheduled", "rescheduled"])
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch latest interview: ${error.message}`)
    return data ? rowToInterview(data) : null
  },

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

  async findAll(opts?: { jobIds?: string[] }): Promise<Interview[]> {
    const supabase = getSupabasePeopleClient()
    let query = supabase
      .from("interviews")
      .select("*")
      .order("scheduled_at", { ascending: false })
    if (opts?.jobIds && opts.jobIds.length > 0) {
      query = query.in("job_id", opts.jobIds)
    }
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch interviews: ${error.message}`)
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
