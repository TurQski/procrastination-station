import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
for (const path of [".env.local", ".env.test.local"]) if (existsSync(path)) process.loadEnvFile(path);
for (const key of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_TEST_USER_A_EMAIL", "SUPABASE_TEST_USER_A_PASSWORD", "SUPABASE_TEST_USER_B_EMAIL", "SUPABASE_TEST_USER_B_PASSWORD"]) {
  if (!process.env[key]) throw new Error("Live browser verification requires a development project and two confirmed test accounts. See docs/SUPABASE-SETUP.md.");
}
export default defineConfig({
  testDir: "./tests/live-browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { channel: process.env.PLAYWRIGHT_CHANNEL || "chromium", baseURL: "http://127.0.0.1:3000", trace: "off", screenshot: "off", video: "off" },
  projects: [
    { name: "desktop-live", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-live", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: { command: "npm run start -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 60_000 },
});
