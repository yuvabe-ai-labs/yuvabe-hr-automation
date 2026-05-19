/**
 * POST /api/auth/login
 *
 * Body: { email: string, pass: string }
 *
 * Verifies credentials via Supabase Auth, then looks up the role from the
 * users table. On success, signs an HMAC session cookie encoding userId + role.
 */

import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { usersService } from "@/services/users.service";

export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Auth not configured. See .env.local." },
      { status: 500 }
    );
  }

  let body: { email?: string; pass?: string };
  try {
    body = (await req.json()) as { email?: string; pass?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, pass } = body;
  if (!email || !pass) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await usersService.verifyCredentials(email, pass);

  if (!user) {
    return NextResponse.json({ error: "Wrong credentials." }, { status: 401 });
  }

  const token = await signSession(secret, user.id, user.role);
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
