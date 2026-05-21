import { NextResponse } from "next/server"
import { getUpcomingInterviews } from "@/services/interviews.service"

export const runtime = "nodejs"

export async function GET() {
  try {
    const interviews = await getUpcomingInterviews()
    return NextResponse.json({ interviews })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch interviews"
    console.error("[api/interviews GET]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
