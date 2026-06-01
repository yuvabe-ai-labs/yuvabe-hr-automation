/**
 * Runs once before the entire test suite.
 * Logs in via POST /api/auth/login and saves the session cookie to
 * tests/.auth/session.json so every test can reuse it without logging in again.
 *
 * Tests that specifically test the login flow opt out by calling:
 * test.use({ storageState: { cookies: [], origins: [] } })
 */

import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

const SESSION_FILE = path.join(__dirname, ".auth", "session.json");

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3001";

  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASS;
  if (!email || !pass) {
    await browser.close();
    throw new Error("AUTH_USER and AUTH_PASS must be set in .env.local or environment");
  }

  const res = await page.request.post(`${baseURL}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ email, pass }),
  });

  if (!res.ok()) {
    const body = await res.text();
    await browser.close();
    throw new Error(`Login failed (${res.status()}): ${body}`);
  }

  await context.storageState({ path: SESSION_FILE });
  await browser.close();
}
