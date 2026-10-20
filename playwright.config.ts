import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-390",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop-1280",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
