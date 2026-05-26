import { NextResponse } from "next/server"
import { z } from "zod"
import { scheduleInterview, getInterviewsForApplication } from "@/services/interviews.service"

export const runtime = "nodejs"

const ScheduleSchema = z.object({
  candidateId:     z.string().min(1),
  candidateName:   z.string().min(1),
  candidateEmail:  z.string().email(),
  jobId:           z.string().min(1),
  jobCode:         z.string().min(1),
  jobTitle:        z.string().min(1),
  title:           z.string().min(1).max(200),
  scheduledAt:     z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  timezone:        z.string().min(1),
  notes:           z.string().max(2000).optional(),
  location:        z.string().max(500).optional(),
  meetingLink:     z.string().url().optional().or(z.literal("")),
  interviewerId:   z.string().optional(),
  interviewerName: z.string().optional(),
  hmEmail:         z.string().email().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const interviews = await getInterviewsForApplication(id)
    return NextResponse.json({ interviews })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch interviews"
    console.error("[api/applications/[id]/interviews GET]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  try {
    const interview = await scheduleInterview(id, parsed.data)
    return NextResponse.json({ interview }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to schedule interview"
    console.error("[api/applications/[id]/interviews POST]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
