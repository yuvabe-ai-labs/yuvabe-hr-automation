/**
 * Auth helpers — session cookies only. Credential verification is handled by Supabase Auth.
 *
 * Session cookie value: `<userId>.<role>.<expiry>.<hmac(userId.role.expiry, secret)>`
 * All parts are dot-separated. userId is a UUID (only hyphens, no dots), role is
 * one of admin|manager|viewer (no dots), expiry is a Unix timestamp (no dots),
 * and the HMAC is base64url (no dots). Safe to split on `.` at index 3.
 *
 * Uses only WebCrypto — runs in Edge middleware AND Node.js route handlers.
 */

export const SESSION_COOKIE = "yuvabe-session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ─── Base64url helpers ─────────────────────────────────────────────────────

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Constant-time comparison ──────────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── HMAC (for session signing) ────────────────────────────────────────────

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(sig);
}

// ─── Session cookie ────────────────────────────────────────────────────────

/** Build a signed session token encoding userId and role. */
export async function signSession(
  secret: string,
  userId: string,
  role: string
): Promise<string> {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  const payload = `${userId}.${role}.${expiry}`;
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export type SessionPayload = { userId: string; role: string };

/**
 * Returns the session payload if the token is valid, false otherwise.
 * Token format: userId.role.expiry.sig (4 dot-separated parts).
 */
export async function verifySession(
  token: string | undefined,
  secret: string
): Promise<SessionPayload | false> {
  if (!token) return false;
  // Split only on first 3 dots — sig itself is base64url (no dots)
  const firstDot = token.indexOf(".");
  const secondDot = token.indexOf(".", firstDot + 1);
  const thirdDot = token.indexOf(".", secondDot + 1);
  if (firstDot < 0 || secondDot < 0 || thirdDot < 0) return false;

  const userId = token.slice(0, firstDot);
  const role = token.slice(firstDot + 1, secondDot);
  const expiry = token.slice(secondDot + 1, thirdDot);
  const sig = token.slice(thirdDot + 1);

  if (!userId || !role || !expiry || !sig) return false;

  const payload = `${userId}.${role}.${expiry}`;
  const expected = await hmac(payload, secret);
  if (!constantTimeEqual(sig, expected)) return false;

  const exp = Number(expiry);
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) >= exp) return false;

  return { userId, role };
}

// ─── Request context helpers ───────────────────────────────────────────────

/** Read the authenticated user from headers forwarded by middleware. */
export function getSessionFromHeaders(headers: Headers): SessionPayload | null {
  const userId = headers.get("x-user-id");
  const role = headers.get("x-user-role");
  if (!userId || !role) return null;
  return { userId, role };
}
