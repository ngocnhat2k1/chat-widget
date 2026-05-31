// API Configuration
const RUNTIME_API_URL = (window as any).__CHAT_WIDGET_API_URL__ as
  | string
  | undefined;
const BUILD_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const RESOLVED_API_URL =
  RUNTIME_API_URL || BUILD_API_URL || "http://localhost:3001";

export const API_CONFIG = {
  BASE_URL: RESOLVED_API_URL,
  SOCKET_URL: RESOLVED_API_URL,
};

// Widget Configuration
export interface WidgetConfig {
  apiKey: string;
  domain: string;
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  welcomeMessage?: string;
  agentName?: string;
  // Simulate conversations locally without hitting the backend.
  // Useful for previewing the UI before provisioning an API key.
  demoMode?: boolean;
}

// Default configuration
export const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  theme: "light",
  position: "bottom-right",
  primaryColor: "#2563eb",
  welcomeMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
  demoMode: false,
};
