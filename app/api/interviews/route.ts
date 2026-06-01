import { NextRequest, NextResponse } from "next/server"
import { getAllInterviews } from "@/services/interviews.service"
import { getSessionFromHeaders } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromHeaders(req.headers)
    const managerId = session?.role === "manager" ? session.userId : undefined
    const interviews = await getAllInterviews({ managerId })
    return NextResponse.json({ interviews })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch interviews"
    console.error("[api/interviews GET]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
