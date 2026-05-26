import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { usersService } from "@/services/users.service"

export const runtime = "nodejs"

export async function GET() {
  const hdrs = await headers()
  const userId = hdrs.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await usersService.findById(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ name: user.name, role: user.role })
}
