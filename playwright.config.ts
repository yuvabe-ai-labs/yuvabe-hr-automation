import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

// Load env vars — try .env.local first, fall back to .env
config({ path: path.join(__dirname, ".env.local") });
config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["./reporters/linear-reporter.ts"],
    ["./reporters/excel-reporter.ts"],
  ],

  use: {
    baseURL: "http://localhost:3001",
    trace: process.env.TRACE ? "on" : "on-first-retry",
    video: process.env.TRACE ? "on" : "on-first-retry",
    screenshot: "only-on-failure",
    storageState: path.join(__dirname, "tests/.auth/session.json"),
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0,
        },
      },
    },
  ],

  globalSetup: "./tests/global-setup.ts",

  webServer: {
    command: "pnpm dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
