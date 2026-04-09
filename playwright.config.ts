import { defineConfig, devices } from "@playwright/test";

const webPort = process.env.MDCHAT_WEB_PORT ?? "3030";
const apiBase = process.env.MDCHAT_API_URL ?? "http://127.0.0.1:8000";
const baseURL = process.env.MDCHAT_BASE_URL ?? `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  webServer: process.env.MDCHAT_NO_WEB_SERVER
    ? undefined
    : {
        command: `cd apps/web && NEXT_PUBLIC_API_BASE_URL=${apiBase} npx next dev -p ${webPort}`,
        url: baseURL,
        reuseExistingServer: !!process.env.MDCHAT_REUSE_WEB,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
