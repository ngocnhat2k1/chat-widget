import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getErrorMessage } from "../lib/errors";
import toast from "react-hot-toast";

// Query Keys
export const queryKeys = {
  websites: ["websites"] as const,
  website: (id: string) => ["website", id] as const,
  conversations: (params?: Record<string, unknown>) =>
    ["conversations", params] as const,
  conversation: (id: string) => ["conversation", id] as const,
  messages: (conversationId: string, params?: Record<string, unknown>) =>
    ["messages", conversationId, params] as const,
  analytics: (websiteId?: string) => ["analytics", websiteId] as const,
};

// Website Hooks
export function useWebsites() {
  return useQuery({
    queryKey: queryKeys.websites,
    queryFn: () => apiClient.getWebsites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWebsite(id: string) {
  return useQuery({
    queryKey: queryKeys.website(id),
    queryFn: () => apiClient.getWebsite(id),
    enabled: !!id,
  });
}

export function useCreateWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { domain: string; name: string }) =>
      apiClient.createWebsite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      toast.success("Website created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create website"));
    },
  });
}

export function useUpdateWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { domain?: string; name?: string };
    }) => apiClient.updateWebsite(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      queryClient.invalidateQueries({
        queryKey: queryKeys.website(variables.id),
      });
      toast.success("Website updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update website"));
    },
  });
}

export function useDeleteWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWebsite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      toast.success("Website deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete website"));
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ websiteId, name }: { websiteId: string; name?: string }) =>
      apiClient.createApiKey(websiteId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.website(variables.websiteId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      toast.success("API key created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create API key"));
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ websiteId, keyId }: { websiteId: string; keyId: string }) =>
      apiClient.deleteApiKey(websiteId, keyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.website(variables.websiteId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.websites });
      toast.success("API key deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete API key"));
    },
  });
}

// Conversation Hooks
export function useConversations(params?: {
  websiteId?: string;
  status?: "ACTIVE" | "CLOSED";
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.conversations(params),
    queryFn: () => apiClient.getConversations(params),
    staleTime: 30 * 1000, // 30 seconds (since conversations update frequently)
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => apiClient.getConversation(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: "ACTIVE" | "CLOSED"; assignedTo?: string };
    }) => apiClient.updateConversation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(variables.id),
      });
      toast.success("Conversation updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update conversation"));
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      toast.success("Conversation deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete conversation"));
    },
  });
}

// Message Hooks
export function useMessages(
  conversationId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId, params),
    queryFn: () => apiClient.getMessages(conversationId, params),
    enabled: !!conversationId,
    staleTime: 5 * 1000, // 5 seconds (messages update very frequently)
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: { content: string; senderType: "AGENT"; senderName?: string };
    }) => apiClient.createMessage(conversationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to send message"));
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => apiClient.deleteMessage(conversationId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.conversationId),
      });
      toast.success("Message deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete message"));
    },
  });
}

// Analytics Hooks
export const useAnalytics = (params?: {
  startDate?: string;
  endDate?: string;
  websiteId?: string;
}) => {
  return useQuery({
    queryKey: ["analytics", params],
    queryFn: () => apiClient.getAnalytics(params),
  });
};
