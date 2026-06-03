import React from "react";
import { createRoot, Root } from "react-dom/client";
import ChatWidget from "./App";
import * as Sentry from "@sentry/browser";
import { WidgetConfig, DEFAULT_CONFIG, API_CONFIG } from "./config";
// Compiled Tailwind (?inline) as a string, injected into the Shadow root so the
// widget gets the SAME styles as the source — no hand-maintained CSS subset.
import widgetCss from "./index.css?inline";

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
      styleElement.textContent = widgetCss;

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
