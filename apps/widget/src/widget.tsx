import React from "react";
import { createRoot, Root } from "react-dom/client";
import ChatWidget from "./App";
import * as Sentry from "@sentry/browser";
import { WidgetConfig, DEFAULT_CONFIG, API_CONFIG } from "./config";
import "./index.css";

// Error tracking only — no PII, no message content. No-op without a DSN.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    // Don't record DOM input / chat text as breadcrumbs.
    integrations: (defaults) =>
      defaults.filter((i) => i.name !== "Breadcrumbs"),
  });
}

declare global {
  interface Window {
    ChatWidget: {
      mount: (containerId: string, config: WidgetConfig) => void;
      unmount: (containerId: string) => void;
    };
  }
}

class ChatWidgetManager {
  private roots: Map<string, Root> = new Map();
  private shadowRoots: Map<string, ShadowRoot> = new Map();

  mount(containerId: string, config: WidgetConfig): void {
    try {
      // Validate required config
      if (!config.apiKey) {
        throw new Error("API key is required");
      }
      if (!config.domain) {
        throw new Error("Domain is required");
      }

      // Find or create container
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        document.body.appendChild(container);
      }

      // Create Shadow DOM for CSS isolation
      const shadowRoot = container.attachShadow({ mode: "open" });
      this.shadowRoots.set(containerId, shadowRoot);

      // Create widget root container inside shadow DOM
      const widgetContainer = document.createElement("div");
      widgetContainer.style.cssText = `
        all: initial;
        position: fixed;
        z-index: 2147483647;
        pointer-events: none;
      `;

      // Create style element for widget CSS
      const styleElement = document.createElement("style");
      styleElement.textContent = this.getWidgetCSS();

      shadowRoot.appendChild(styleElement);
      shadowRoot.appendChild(widgetContainer);

      // Enable pointer events for the widget container
      widgetContainer.style.pointerEvents = "auto";

      // Merge config with defaults
      const finalConfig: WidgetConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      };

      // Mount React component
      const root = createRoot(widgetContainer);
      this.roots.set(containerId, root);

      root.render(React.createElement(ChatWidget, { config: finalConfig }));

      console.log("✅ Chat widget mounted successfully:", containerId);
    } catch (error) {
      console.error("❌ Failed to mount chat widget:", error);
    }
  }

  unmount(containerId: string): void {
    try {
      const root = this.roots.get(containerId);
      if (root) {
        root.unmount();
        this.roots.delete(containerId);
      }

      const shadowRoot = this.shadowRoots.get(containerId);
      if (shadowRoot) {
        this.shadowRoots.delete(containerId);
      }

      const container = document.getElementById(containerId);
      if (container) {
        container.remove();
      }

      console.log("✅ Chat widget unmounted successfully:", containerId);
    } catch (error) {
      console.error("❌ Failed to unmount chat widget:", error);
    }
  }

  private getWidgetCSS(): string {
    // Return the compiled Tailwind CSS
    // In production, this would be the actual compiled CSS
    return `
      /* Tailwind CSS Reset and Base Styles */
      *, ::before, ::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb;
      }
      
      /* Widget-specific styles */
      .fixed { position: fixed; }
      .bottom-4 { bottom: 1rem; }
      .right-4 { right: 1rem; }
      .left-4 { left: 1rem; }
      .z-50 { z-index: 50; }
      .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
      
      /* Button styles */
      .w-14 { width: 3.5rem; }
      .h-14 { height: 3.5rem; }
      .w-6 { width: 1.5rem; }
      .h-6 { height: 1.5rem; }
      .w-5 { width: 1.25rem; }
      .h-5 { height: 1.25rem; }
      .w-4 { width: 1rem; }
      .h-4 { height: 1rem; }
      .w-3 { width: 0.75rem; }
      .h-3 { height: 0.75rem; }
      .w-2 { width: 0.5rem; }
      .h-2 { height: 0.5rem; }
      .w-12 { width: 3rem; }
      .h-12 { height: 3rem; }
      .rounded-full { border-radius: 9999px; }
      .rounded-lg { border-radius: 0.5rem; }
      .text-white { color: rgb(255 255 255); }
      .text-gray-800 { color: rgb(31 41 55); }
      .text-gray-600 { color: rgb(75 85 99); }
      .text-gray-500 { color: rgb(107 114 128); }
      .text-gray-400 { color: rgb(156 163 175); }
      .text-red-700 { color: rgb(185 28 28); }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-between { justify-content: space-between; }
      .justify-end { justify-end: flex-end; }
      .justify-start { justify-start: flex-start; }
      .relative { position: relative; }
      .absolute { position: absolute; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
      .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
      .hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
      .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      
      /* Chat window styles */
      .w-80 { width: 20rem; }
      .h-96 { height: 24rem; }
      .bg-white { background-color: rgb(255 255 255); }
      .bg-gray-50 { background-color: rgb(249 250 251); }
      .bg-gray-100 { background-color: rgb(243 244 246); }
      .bg-gray-200 { background-color: rgb(229 231 235); }
      .bg-red-50 { background-color: rgb(254 242 242); }
      .bg-red-500 { background-color: rgb(239 68 68); }
      .bg-green-400 { background-color: rgb(74 222 128); }
      .bg-gray-400 { background-color: rgb(156 163 175); }
      .border { border-width: 1px; }
      .border-gray-200 { border-color: rgb(229 231 235); }
      .border-gray-300 { border-color: rgb(209 213 219); }
      .border-red-200 { border-color: rgb(254 202 202); }
      .border-t { border-top-width: 1px; }
      .border-2 { border-width: 2px; }
      .border-t-transparent { border-top-color: transparent; }
      .flex-col { flex-direction: column; }
      .flex-1 { flex: 1 1 0%; }
      .overflow-hidden { overflow: hidden; }
      .overflow-y-auto { overflow-y: auto; }
      .p-4 { padding: 1rem; }
      .p-3 { padding: 0.75rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
      .mb-3 { margin-bottom: 0.75rem; }
      .ml-2 { margin-left: 0.5rem; }
      .mr-2 { margin-right: 0.5rem; }
      .mt-1 { margin-top: 0.25rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .-top-1 { top: -0.25rem; }
      .-right-1 { right: -0.25rem; }
      .space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.5rem; }
      .max-w-xs { max-width: 20rem; }
      .font-semibold { font-weight: 600; }
      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .opacity-90 { opacity: 0.9; }
      .opacity-50 { opacity: 0.5; }
      .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
      .focus\\:ring-2:focus { box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); }
      .focus\\:ring-opacity-50:focus { --tw-ring-opacity: 0.5; }
      .disabled\\:opacity-50:disabled { opacity: 0.5; }
      .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
      .hover\\:text-gray-200:hover { color: rgb(229 231 235); }
      .hover\\:no-underline:hover { text-decoration-line: none; }
      .underline { text-decoration-line: underline; }
      .text-center { text-align: center; }
      .animate-spin { animation: spin 1s linear infinite; }
      .cursor-pointer { cursor: pointer; }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Custom focus ring colors will be set via inline styles */
      
      button {
        cursor: pointer;
        border: none;
        background: none;
        font-family: inherit;
      }
      
      input {
        font-family: inherit;
      }
      
      svg {
        display: block;
        vertical-align: middle;
      }
    `;
  }
}

// Create global instance
const widgetManager = new ChatWidgetManager();

// Expose global API
window.ChatWidget = {
  mount: (containerId: string, config: WidgetConfig) => {
    widgetManager.mount(containerId, config);
  },
  unmount: (containerId: string) => {
    widgetManager.unmount(containerId);
  },
};

// Read only the data-* attributes the customer actually set, so they can
// override the admin-configured baseline without re-introducing defaults.
function readDataAttrs(script: Element): Partial<WidgetConfig> {
  const attrs: Partial<WidgetConfig> = {};
  const theme = script.getAttribute("data-chat-widget-theme");
  if (theme === "light" || theme === "dark") attrs.theme = theme;
  const position = script.getAttribute("data-chat-widget-position");
  if (position === "bottom-right" || position === "bottom-left")
    attrs.position = position;
  const color = script.getAttribute("data-chat-widget-color");
  if (color) attrs.primaryColor = color;
  const welcome = script.getAttribute("data-chat-widget-welcome");
  if (welcome) attrs.welcomeMessage = welcome;
  const agent = script.getAttribute("data-chat-widget-agent");
  if (agent) attrs.agentName = agent;
  return attrs;
}

async function fetchServerConfig(
  apiKey: string
): Promise<Partial<WidgetConfig>> {
  try {
    const res = await fetch(
      `${API_CONFIG.BASE_URL}/api/widget/config?apiKey=${encodeURIComponent(apiKey)}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    return (data?.config as Partial<WidgetConfig>) || {};
  } catch {
    // Offline / unreachable backend — fall back to defaults + data attrs.
    return {};
  }
}

// Auto-mount if script has data attributes
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const scripts = document.querySelectorAll(
      "script[data-chat-widget-api-key]"
    );
    scripts.forEach(async (script, index) => {
      const apiKey = script.getAttribute("data-chat-widget-api-key");
      if (!apiKey) return;

      const domain =
        script.getAttribute("data-chat-widget-domain") ||
        window.location.hostname;
      const demoMode = script.getAttribute("data-chat-widget-demo") === "true";

      const dataAttrs = readDataAttrs(script);
      // Merge order: DEFAULT_CONFIG (in mount) < server baseline < data attrs.
      const serverConfig = await fetchServerConfig(apiKey);

      const containerId = `chat-widget-${index}`;
      widgetManager.mount(containerId, {
        apiKey,
        domain,
        demoMode,
        ...serverConfig,
        ...dataAttrs,
      });
    });
  });
}

export default ChatWidget;
