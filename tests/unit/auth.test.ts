import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

const SECRET = "test-secret-key-32-chars-minimum!";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ROLE = "admin";

describe("signSession / verifySession", () => {
  it("produces a token that verifies immediately", async () => {
    const token = await signSession(SECRET, USER_ID, ROLE);
    const result = await verifySession(token, SECRET);
    expect(result).toEqual({ userId: USER_ID, role: ROLE });
  });

  it("fails verification with wrong secret", async () => {
    const token = await signSession(SECRET, USER_ID, ROLE);
    expect(await verifySession(token, "wrong-secret")).toBe(false);
  });

  it("fails verification for undefined token", async () => {
    expect(await verifySession(undefined, SECRET)).toBe(false);
  });

  it("fails verification for malformed token (no dot)", async () => {
    expect(await verifySession("nodothere", SECRET)).toBe(false);
  });

  it("fails verification for an expired token", async () => {
    const pastExpiry = String(Math.floor(Date.now() / 1000) - 1);
    const payload = `${USER_ID}.${ROLE}.${pastExpiry}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const bytes = new Uint8Array(sig);
    let str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    const b64 = btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const expiredToken = `${payload}.${b64}`;

    expect(await verifySession(expiredToken, SECRET)).toBe(false);
  });

  it("fails verification when HMAC is tampered", async () => {
    const token = await signSession(SECRET, USER_ID, ROLE);
    const lastDot = token.lastIndexOf(".");
    const sig = token.slice(lastDot + 1);
    const tampered = `${token.slice(0, lastDot + 1)}${sig.slice(0, -4)}XXXX`;
    expect(await verifySession(tampered, SECRET)).toBe(false);
  });
});
