import { MessageCircle, Send, X } from "lucide-react";
import type { WidgetConfig } from "../lib/api-client";

/**
 * A faithful visual mock of the embedded widget (open state) that re-renders
 * instantly as the admin edits config — no iframe / postMessage round-trip.
 */
export function WidgetPreview({ config }: { config: WidgetConfig }) {
  const color = config.primaryColor || "#2563eb";
  const agentName = config.agentName || "Hỗ trợ";
  const welcome =
    config.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn?";
  const left = config.position === "bottom-left";
  const dark = config.theme === "dark";

  return (
    <div className="relative h-[460px] w-full rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        Xem trước
      </span>

      <div
        className={`absolute bottom-4 ${left ? "left-4" : "right-4"} flex flex-col items-${left ? "start" : "end"} gap-3`}
      >
        {/* Chat panel */}
        <div
          className={`w-72 rounded-xl shadow-2xl overflow-hidden ${
            dark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: color }}
          >
            <span className="text-white text-sm font-semibold">
              {agentName}
            </span>
            <X className="h-4 w-4 text-white/80" />
          </div>
          <div
            className={`p-4 space-y-3 h-44 ${dark ? "bg-gray-800" : "bg-gray-50"}`}
          >
            <div
              className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                dark ? "bg-gray-700 text-gray-100" : "bg-white text-gray-800"
              } shadow-sm`}
            >
              {welcome}
            </div>
          </div>
          <div
            className={`flex items-center gap-2 border-t p-2 ${
              dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            <input
              disabled
              placeholder="Nhập tin nhắn…"
              className={`flex-1 text-sm rounded-md px-2 py-1.5 outline-none ${
                dark
                  ? "bg-gray-700 text-gray-200 placeholder-gray-400"
                  : "bg-gray-100 text-gray-700"
              }`}
            />
            <span
              className="inline-flex items-center justify-center h-7 w-7 rounded-md"
              style={{ backgroundColor: color }}
            >
              <Send className="h-4 w-4 text-white" />
            </span>
          </div>
        </div>

        {/* Launcher bubble */}
        <span
          className="inline-flex items-center justify-center h-12 w-12 rounded-full shadow-lg"
          style={{ backgroundColor: color }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </span>
      </div>
    </div>
  );
}
