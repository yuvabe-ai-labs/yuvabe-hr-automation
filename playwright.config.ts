import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

// Load .env.local so AUTH_USER, AUTH_PASS, SUPABASE_URL etc. are available
// in globalSetup and test files without needing to export them manually.
config({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    storageState: path.join(__dirname, "tests/.auth/session.json"),
    actionTimeout: process.env.CI ? 20_000 : 15_000,
    navigationTimeout: process.env.CI ? 45_000 : 30_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  globalSetup: "./tests/global-setup.ts",

  webServer: {
    command: "pnpm dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
