import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cancelInterview, rescheduleInterview } from "@/services/interviews.service"

const cancelSchema = z.object({ action: z.literal("cancel") })

const rescheduleSchema = z.object({
  action:          z.literal("reschedule"),
  title:           z.string().min(1),
  scheduledAt:     z.string(),
  durationMinutes: z.number().int().positive(),
  timezone:        z.string(),
  notes:           z.string().optional(),
  location:        z.string().optional(),
  meetingLink:     z.string().optional(),
  interviewerId:   z.string().optional(),
  interviewerName: z.string().optional(),
  hmEmail:         z.string().optional(),
})

const bodySchema = z.discriminatedUnion("action", [cancelSchema, rescheduleSchema])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> },
) {
  try {
    const { interviewId } = await params
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    if (parsed.data.action === "cancel") {
      await cancelInterview(interviewId)
      return NextResponse.json({ ok: true })
    }

    const { action: _action, ...rescheduleInput } = parsed.data
    const interview = await rescheduleInterview(interviewId, rescheduleInput)
    return NextResponse.json({ interview })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update interview"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
