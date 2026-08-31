import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/pages",
  testMatch: "home.e2e.spec.ts",
  fullyParallel: false,
  reporter: process.env.CI ? "line" : "list",
  webServer: {
    command: "PORT=19516 BASE_PATH=/ pnpm run dev",
    url: "http://127.0.0.1:19516",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:19516",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
});