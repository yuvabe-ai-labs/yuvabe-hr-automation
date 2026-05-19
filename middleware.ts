/**
 * Auth + RBAC gate.
 *
 * Public routes (no auth):
 *   /login, /apply, /api/auth/*, /api/applications (applicant POST)
 *
 * Role rules (after auth passes):
 *   admin   — full access everywhere
 *   manager — cannot access /jobs/new, /settings/*
 *             viewer of all public mutation API routes is allowed;
 *             resource-level scoping (own jobs only) is enforced in services
 *   viewer  — read-only: all POST/PATCH/PUT/DELETE API calls → 403
 *             except auth routes (already public)
 *
 * Forwards x-user-id and x-user-role headers so API route handlers can read
 * the current user without re-verifying the cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const PUBLIC_EXACT = new Set<string>([
  "/login",
  "/apply",
  "/api/applications",
]);

const PUBLIC_PREFIXES = ["/api/auth/"];

/** Admin-only page prefixes — non-admins are redirected to /jobs. */
const ADMIN_ONLY_PREFIXES = ["/jobs/new", "/settings/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return new NextResponse("Auth not configured (AUTH_SECRET missing).", {
      status: 500,
    });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, secret);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  const { userId, role } = session;

  // Admin-only pages
  if (
    role !== "admin" &&
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/jobs", req.url));
  }

  // Viewer cannot mutate — block all non-GET API calls
  if (
    role === "viewer" &&
    pathname.startsWith("/api/") &&
    MUTATION_METHODS.has(req.method)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Forward user context to route handlers via request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-role", role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
