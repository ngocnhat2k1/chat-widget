import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  useWebsites,
  useCreateWebsite,
  useDeleteWebsite,
  useCreateApiKey,
  useDeleteApiKey,
} from "../hooks/api";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Globe,
  Plus,
  Trash2,
  Copy,
  Key,
  Eye,
  EyeOff,
  Code,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { EmbedCodeBlock } from "../components/embed-code-block";

const websiteSchema = yup.object({
  name: yup.string().required("Website name is required"),
  domain: yup
    .string()
    .url("Please enter a valid URL")
    .required("Domain is required"),
});

const apiKeySchema = yup.object({
  name: yup.string().optional(),
});

type WebsiteFormData = yup.InferType<typeof websiteSchema>;
type ApiKeyFormData = yup.InferType<typeof apiKeySchema>;

export function WebsitesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
  // Plaintext key is only available once (on creation) — reveal it with the
  // ready-to-paste embed snippet.
  const [keyReveal, setKeyReveal] = useState<{
    key: string;
    domain: string;
  } | null>(null);
  const [embedFor, setEmbedFor] = useState<{
    domain: string;
  } | null>(null);

  const { data: websites, isLoading, error } = useWebsites();
  const createWebsiteMutation = useCreateWebsite();
  const deleteWebsiteMutation = useDeleteWebsite();
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();

  const {
    register: registerWebsite,
    handleSubmit: handleWebsiteSubmit,
    formState: { errors: websiteErrors },
    reset: resetWebsiteForm,
  } = useForm<WebsiteFormData>({
    resolver: yupResolver(websiteSchema),
  });

  const {
    register: registerApiKey,
    handleSubmit: handleApiKeySubmit,
    formState: { errors: apiKeyErrors },
    reset: resetApiKeyForm,
  } = useForm<ApiKeyFormData>({
    resolver: yupResolver(apiKeySchema),
  });

  const onCreateWebsite = async (data: WebsiteFormData) => {
    try {
      await createWebsiteMutation.mutateAsync(data);
      setShowCreateForm(false);
      resetWebsiteForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onDeleteWebsite = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this website? This action cannot be undone."
      )
    ) {
      try {
        await deleteWebsiteMutation.mutateAsync(id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const onCreateApiKey = async (data: ApiKeyFormData) => {
    if (!selectedWebsite) return;

    try {
      const result = await createApiKeyMutation.mutateAsync({
        websiteId: selectedWebsite,
        name: data.name,
      });

      const website = websites?.find((w) => w.id === selectedWebsite);

      // Show the generated API key once, with the embed snippet ready to copy.
      navigator.clipboard.writeText(result.key);
      toast.success("API key đã tạo (đã copy vào clipboard)");
      setKeyReveal({ key: result.key, domain: website?.domain ?? "" });

      setShowApiKeyForm(false);
      setSelectedWebsite(null);
      resetApiKeyForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onDeleteApiKey = async (websiteId: string, keyId: string) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteApiKeyMutation.mutateAsync({ websiteId, keyId });
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleApiKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleApiKeys(newVisible);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white shadow rounded-lg p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          Error loading websites. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Website
        </button>
      </div>

      {/* Create Website Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Add New Website
          </h2>
          <form
            onSubmit={handleWebsiteSubmit(onCreateWebsite)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Website Name
              </label>
              <input
                {...registerWebsite("name")}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="My Website"
              />
              {websiteErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {websiteErrors.name.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-gray-700"
              >
                Domain
              </label>
              <input
                {...registerWebsite("domain")}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com"
              />
              {websiteErrors.domain && (
                <p className="mt-1 text-sm text-red-600">
                  {websiteErrors.domain.message}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetWebsiteForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createWebsiteMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createWebsiteMutation.isPending
                  ? "Creating..."
                  : "Create Website"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Key Form */}
      {showApiKeyForm && selectedWebsite && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Create API Key
          </h2>
          <form
            onSubmit={handleApiKeySubmit(onCreateApiKey)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="apiKeyName"
                className="block text-sm font-medium text-gray-700"
              >
                API Key Name (Optional)
              </label>
              <input
                {...registerApiKey("name")}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Production Key"
              />
              {apiKeyErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {apiKeyErrors.name.message}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyForm(false);
                  setSelectedWebsite(null);
                  resetApiKeyForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createApiKeyMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {createApiKeyMutation.isPending
                  ? "Creating..."
                  : "Create API Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Websites Grid */}
      {websites && websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <div
              key={website.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Globe className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {website.name}
                      </h3>
                      <p className="text-sm text-gray-500">{website.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEmbedFor({ domain: website.domain })}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Embed code"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWebsite(website.id);
                        setShowApiKeyForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Create API Key"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWebsite(website.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Delete Website"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* API Keys */}
                {website.apiKeys && website.apiKeys.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      API Keys
                    </h4>
                    <div className="space-y-2">
                      {website.apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900">
                              {apiKey.name || "Unnamed Key"}
                            </p>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs text-gray-500 font-mono">
                                {visibleApiKeys.has(apiKey.id)
                                  ? apiKey.hashedKey
                                  : "••••••••••••••••"}
                              </code>
                              <button
                                onClick={() =>
                                  toggleApiKeyVisibility(apiKey.id)
                                }
                                className="text-gray-400 hover:text-gray-500"
                              >
                                {visibleApiKeys.has(apiKey.id) ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  copyToClipboard(apiKey.hashedKey)
                                }
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              onDeleteApiKey(website.id, apiKey.id)
                            }
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No websites
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first website.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Website
            </button>
          </div>
        </div>
      )}

      {/* API key reveal + embed snippet (shown once, on creation) */}
      {keyReveal && (
        <Modal title="API key của bạn" onClose={() => setKeyReveal(null)}>
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Lưu key này ngay — nó chỉ hiển thị một lần và không xem lại được.
            </div>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-sm font-mono bg-gray-100 rounded px-3 py-2 break-all">
                {keyReveal.key}
              </code>
              <button
                onClick={() => copyToClipboard(keyReveal.key)}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Copy key"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Nhúng vào website
              </p>
              <EmbedCodeBlock
                apiKey={keyReveal.key}
                domain={keyReveal.domain}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Embed code reference (placeholder key) */}
      {embedFor && (
        <Modal title="Mã nhúng widget" onClose={() => setEmbedFor(null)}>
          <p className="text-sm text-gray-500 mb-3">
            Thay <code>YOUR_API_KEY</code> bằng API key của website (tạo ở nút{" "}
            <Key className="inline h-3 w-3" />
            ).
          </p>
          <EmbedCodeBlock apiKey="YOUR_API_KEY" domain={embedFor.domain} />
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/websites")({
  component: WebsitesPage,
});
