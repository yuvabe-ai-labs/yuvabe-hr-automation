import { interviewsRepository, type Interview, type CreateInterviewInput } from "@/repositories/interviews.repository"
import { updateApplicationStatus } from "@/services/applications.service"
import { sendInterviewInvite, sendInterviewCancellation, sendInterviewReschedule } from "@/lib/emails/interview-invite"

export type { Interview }

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

export async function scheduleInterview(
  applicationId: string,
  input: ScheduleInterviewInput
): Promise<Interview> {
  const active = await interviewsRepository.findLatestActiveByApplicationId(applicationId)
  if (active) {
    throw new Error("An active interview already exists. Cancel or complete it before scheduling a new one.")
  }

  const repoInput: CreateInterviewInput = {
    applicationId,
    candidateId:      input.candidateId,
    candidateName:    input.candidateName,
    candidateEmail:   input.candidateEmail,
    jobId:            input.jobId,
    jobCode:          input.jobCode,
    jobTitle:         input.jobTitle,
    title:            input.title,
    scheduledAt:      input.scheduledAt,
    durationMinutes:  input.durationMinutes,
    timezone:         input.timezone,
    notes:            input.notes,
    location:         input.location,
    meetingLink:      input.meetingLink,
    interviewerId:    input.interviewerId,
    interviewerName:  input.interviewerName,
  }

  const interview = await interviewsRepository.create(repoInput)

  // Advance application status to interview_scheduled
  await updateApplicationStatus(applicationId, "interview_scheduled")

  // Send confirmation email (non-blocking — don't fail the request if email fails)
  sendInterviewInvite({
    candidateName:    input.candidateName,
    candidateEmail:   input.candidateEmail,
    jobTitle:         input.jobTitle,
    title:            input.title,
    scheduledAt:      input.scheduledAt,
    durationMinutes:  input.durationMinutes,
    timezone:         input.timezone,
    interviewerName:  input.interviewerName,
    hmEmail:          input.hmEmail,
    location:         input.location,
    meetingLink:      input.meetingLink,
    notes:            input.notes,
  }).catch((err) => {
    console.error("Interview invite email failed:", err)
  })

  return interview
}

export async function cancelInterview(interviewId: string): Promise<void> {
  const interview = await interviewsRepository.findById(interviewId)
  if (!interview) throw new Error("Interview not found")

  await interviewsRepository.updateStatus(interviewId, "cancelled")

  sendInterviewCancellation({
    candidateName:  interview.candidateName,
    candidateEmail: interview.candidateEmail,
    jobTitle:       interview.jobTitle,
    title:          interview.title,
  }).catch((err) => {
    console.error("Interview cancellation email failed:", err)
  })
}

export type RescheduleInterviewInput = {
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

export async function rescheduleInterview(
  interviewId: string,
  input: RescheduleInterviewInput,
): Promise<Interview> {
  const interview = await interviewsRepository.update(interviewId, {
    title:           input.title,
    scheduledAt:     input.scheduledAt,
    durationMinutes: input.durationMinutes,
    timezone:        input.timezone,
    notes:           input.notes ?? null,
    location:        input.location ?? null,
    meetingLink:     input.meetingLink ?? null,
    interviewerId:   input.interviewerId ?? null,
    interviewerName: input.interviewerName ?? null,
  })

  await interviewsRepository.updateStatus(interviewId, "rescheduled")

  sendInterviewReschedule({
    candidateName:   interview.candidateName,
    candidateEmail:  interview.candidateEmail,
    jobTitle:        interview.jobTitle,
    title:           input.title,
    scheduledAt:     input.scheduledAt,
    durationMinutes: input.durationMinutes,
    timezone:        input.timezone,
    interviewerName: input.interviewerName,
    hmEmail:         input.hmEmail,
    location:        input.location,
    meetingLink:     input.meetingLink,
    notes:           input.notes,
  }).catch((err) => {
    console.error("Interview reschedule email failed:", err)
  })

  return interview
}

export async function getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
  return interviewsRepository.findByApplicationId(applicationId)
}

export async function getUpcomingInterviews(): Promise<Interview[]> {
  return interviewsRepository.findUpcoming()
}
