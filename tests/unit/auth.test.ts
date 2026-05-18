import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

const SECRET = "test-secret-key-32-chars-minimum!";

describe("signSession / verifySession", () => {
  it("produces a token that verifies immediately", async () => {
    const token = await signSession(SECRET);
    expect(await verifySession(token, SECRET)).toBe(true);
  });

  it("fails verification with wrong secret", async () => {
    const token = await signSession(SECRET);
    expect(await verifySession(token, "wrong-secret")).toBe(false);
  });

  it("fails verification for undefined token", async () => {
    expect(await verifySession(undefined, SECRET)).toBe(false);
  });

  it("fails verification for malformed token (no dot)", async () => {
    expect(await verifySession("nodothere", SECRET)).toBe(false);
  });

  it("fails verification for an expired token", async () => {
    // Forge an expiry in the past
    const pastExpiry = String(Math.floor(Date.now() / 1000) - 1);
    // Build a valid HMAC for that past expiry
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(pastExpiry));
    const bytes = new Uint8Array(sig);
    let str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    const b64 = btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const expiredToken = `${pastExpiry}.${b64}`;

    expect(await verifySession(expiredToken, SECRET)).toBe(false);
  });

  it("fails verification when HMAC is tampered", async () => {
    const token = await signSession(SECRET);
    const [expiry, sig] = token.split(".");
    const tampered = `${expiry}.${sig.slice(0, -4)}XXXX`;
    expect(await verifySession(tampered, SECRET)).toBe(false);
  });
});
