// API Configuration
export const API_CONFIG = {
  BASE_URL: (window as any).__CHAT_WIDGET_API_URL__ || "http://localhost:3001",
  SOCKET_URL:
    (window as any).__CHAT_WIDGET_API_URL__ || "http://localhost:3001",
};

// Widget Configuration
export interface WidgetConfig {
  apiKey: string;
  domain: string;
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  welcomeMessage?: string;
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
