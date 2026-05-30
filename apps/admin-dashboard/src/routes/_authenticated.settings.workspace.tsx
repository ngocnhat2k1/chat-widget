import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Building2, Save } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { useWorkspace } from "../contexts/workspace-context";

export const Route = createFileRoute("/_authenticated/settings/workspace")({
  component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
  const { currentWorkspace, currentWorkspaceId, refreshWorkspaces } =
    useWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // Sync the form whenever the active workspace changes.
  useEffect(() => {
    setName(currentWorkspace?.name ?? "");
    setSlug(currentWorkspace?.slug ?? "");
  }, [currentWorkspace?.id, currentWorkspace?.name, currentWorkspace?.slug]);

  const canEdit =
    currentWorkspace?.role === "OWNER" || currentWorkspace?.role === "ADMIN";

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.updateWorkspace(currentWorkspaceId as string, { name, slug }),
    onSuccess: async () => {
      await refreshWorkspaces();
      toast.success("Đã lưu workspace");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Không lưu được workspace";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  if (!currentWorkspace) return null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center mb-6">
        <Building2 className="h-6 w-6 text-blue-600 mr-2" />
        <h1 className="text-2xl font-semibold text-gray-900">
          Workspace Settings
        </h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canEdit) mutation.mutate();
        }}
        className="bg-white shadow rounded-lg p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên workspace
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Chỉ chữ thường, số và dấu gạch ngang (3–32 ký tự).
          </p>
        </div>

        <div className="text-sm text-gray-500">
          Vai trò của bạn:{" "}
          <span className="font-medium text-gray-700">
            {currentWorkspace.role}
          </span>
        </div>

        {canEdit ? (
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        ) : (
          <p className="text-sm text-amber-600">
            Chỉ OWNER hoặc ADMIN mới chỉnh sửa được workspace.
          </p>
        )}
      </form>
    </div>
  );
}
