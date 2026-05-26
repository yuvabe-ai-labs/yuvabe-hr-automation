import { NextResponse } from "next/server"
import { usersService } from "@/services/users.service"

export const runtime = "nodejs"

export async function GET() {
  try {
    const managers = await usersService.findManagers()
    return NextResponse.json({ managers })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch managers"
    console.error("[api/users/managers GET]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
