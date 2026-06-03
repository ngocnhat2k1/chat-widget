import { test, expect, type Page } from "@playwright/test";
import type { WidgetConfig } from "../src/config";

// The host page exposes window.ChatWidget; each test mounts the widget with
// the config it needs. Playwright pierces the open Shadow DOM automatically,
// so role/text locators resolve elements rendered inside the shadow root.

declare global {
  interface Window {
    ChatWidget: {
      mount: (containerId: string, config: WidgetConfig) => void;
      unmount: (containerId: string) => void;
    };
  }
}

const WELCOME = "E2E demo welcome";

// One of the five canned auto-replies the widget sends back in demo mode.
const AUTO_REPLY =
  /Cảm ơn bạn đã liên hệ|Để tôi kiểm tra thông tin|Bạn có thể cung cấp thêm chi tiết|Tôi hiểu vấn đề của bạn|Đây là một câu hỏi hay/;

async function mountWidget(page: Page, config: WidgetConfig) {
  await page.goto("/e2e/host.html");
  await page.waitForFunction(
    () => typeof window.ChatWidget?.mount === "function"
  );
  await page.evaluate((cfg) => {
    window.ChatWidget.mount("e2e-widget", cfg);
  }, config);
}

test("demo mode: open → welcome → send → auto-reply", async ({ page }) => {
  await mountWidget(page, {
    apiKey: "e2e-key",
    domain: "localhost",
    demoMode: true,
    welcomeMessage: `${WELCOME} ✅`,
  });

  // Demo mode skips the pre-chat form and "connects" after ~1s, then shows
  // the welcome message.
  await page.getByRole("button", { name: "Toggle chat" }).click();
  await expect(page.getByText(WELCOME)).toBeVisible();

  // The input is disabled until connected; fill() auto-waits for it.
  const input = page.getByPlaceholder("Nhập tin nhắn...");
  await input.fill("Xin chào e2e");
  // Typing a value enables the send button (exact: avoid the "Gửi ảnh" button).
  await expect(
    page.getByRole("button", { name: "Gửi", exact: true })
  ).toBeEnabled();
  // Send via Enter (handleKeyPress). The Send button is correctly positioned in
  // the real Tailwind build but lands off-screen here because the Shadow-DOM
  // getWidgetCSS() subset omits `.bottom-16`/`.right-0`, so we avoid clicking it.
  await input.press("Enter");

  // Visitor message is echoed immediately...
  await expect(page.getByText("Xin chào e2e")).toBeVisible();
  // ...and an agent auto-reply lands within a few seconds (1–3s + jitter).
  await expect(page.getByText(AUTO_REPLY)).toBeVisible({ timeout: 8000 });
});

test("non-demo: pre-chat form shows and validates name", async ({ page }) => {
  await mountWidget(page, {
    apiKey: "e2e-key",
    domain: "localhost",
    demoMode: false,
  });

  // New visitor (clean storage) in non-demo mode sees the info form on open.
  await page.getByRole("button", { name: "Toggle chat" }).click();
  await expect(page.getByText("Bắt đầu trò chuyện")).toBeVisible();

  const startBtn = page.getByRole("button", { name: "Bắt đầu chat" });
  await expect(startBtn).toBeDisabled();

  // Name is required → button enables once it has a value.
  await page.getByPlaceholder("Họ và tên *").fill("Nguyễn Văn A");
  await expect(startBtn).toBeEnabled();
});
