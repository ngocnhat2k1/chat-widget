import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import { apiClient, type WidgetConfig } from "../lib/api-client";
import { useWebsite, queryKeys } from "../hooks/api";
import { WidgetPreview } from "../components/widget-preview";

export const Route = createFileRoute("/_authenticated/websites/$id/customize")({
  component: CustomizeWidgetPage,
});

const DEFAULTS: Required<WidgetConfig> = {
  primaryColor: "#2563eb",
  position: "bottom-right",
  welcomeMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
  agentName: "Hỗ trợ",
  theme: "light",
};

function CustomizeWidgetPage() {
  const { id } = useParams({ from: "/_authenticated/websites/$id/customize" });
  const { data: website, isLoading } = useWebsite(id);
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<Required<WidgetConfig>>(DEFAULTS);

  // Seed the form from the saved config once the website loads.
  useEffect(() => {
    if (website) {
      setConfig({ ...DEFAULTS, ...(website.widgetConfig ?? {}) });
    }
  }, [website?.id, website?.widgetConfig]);

  const mutation = useMutation({
    mutationFn: () => apiClient.updateWidgetConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.website(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      toast.success("Đã lưu giao diện widget");
    },
    onError: (e: any) => {
      const m = e.response?.data?.message || "Không lưu được";
      toast.error(Array.isArray(m) ? m.join(", ") : m);
    },
  });

  const set = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/websites"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tuỳ chỉnh widget
            </h1>
            <p className="text-sm text-gray-500">{website?.name}</p>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-white shadow rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Màu chủ đạo
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vị trí
            </label>
            <select
              value={config.position}
              onChange={(e) =>
                set("position", e.target.value as WidgetConfig["position"])
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="bottom-right">Góc dưới phải</option>
              <option value="bottom-left">Góc dưới trái</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chủ đề
            </label>
            <select
              value={config.theme}
              onChange={(e) =>
                set("theme", e.target.value as WidgetConfig["theme"])
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên hiển thị (agent)
            </label>
            <input
              type="text"
              maxLength={60}
              value={config.agentName}
              onChange={(e) => set("agentName", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lời chào
            </label>
            <textarea
              rows={3}
              maxLength={200}
              value={config.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Live preview */}
        <div>
          <WidgetPreview config={config} />
        </div>
      </div>
    </div>
  );
}
