import { defineConfig, devices } from "@playwright/test";

// Smoke tests for the embeddable widget. They run the real source through the
// Vite dev server (so no separate build step) and drive the chat UI rendered
// inside the Shadow DOM — Playwright pierces open shadow roots automatically.
// Demo mode means no backend is required.
const PORT = 5173;
const HOST_PAGE = `http://localhost:${PORT}/e2e/host.html`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: HOST_PAGE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
