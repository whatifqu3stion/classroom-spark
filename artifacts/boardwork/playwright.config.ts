import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/pages",
  testMatch: "*.e2e.spec.ts",
  fullyParallel: false,
  reporter: process.env.CI ? "line" : "list",
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "firefox",
      testMatch: "reading-capacity.e2e.spec.ts",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      testMatch: "reading-capacity.e2e.spec.ts",
      use: { browserName: "webkit" },
    },
  ],
  webServer: {
    command: "PORT=19516 BASE_PATH=/ pnpm exec vite --config vite.config.ts --host 127.0.0.1",
    url: "http://127.0.0.1:19516",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:19516",
    headless: true,
    trace: "retain-on-failure",
  },
});