import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Real backend configuration
const demoConfig = {
  apiKey: "demo-api-key-12345", // Real API key from backend
  domain: "localhost:3001",
  theme: "light" as const,
  position: "bottom-right" as const,
  primaryColor: "#3B82F6",
  welcomeMessage: "Xin chào! Chúng tôi có thể giúp gì cho bạn?",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App config={demoConfig} />
  </React.StrictMode>
);
