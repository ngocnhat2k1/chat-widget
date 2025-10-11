import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI, type Website, type ApiKey, type Conversation, type Message, type Analytics, type CreateWebsiteRequest, type CreateApiKeyRequest } from './api'
import { toast } from 'react-hot-toast'

// Auth hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => adminAPI.getProfile(),
    retry: false,
  })
}

export const useLogin = () => {
  return useMutation({
    mutationFn: adminAPI.login.bind(adminAPI),
    onSuccess: () => {
      toast.success('Đăng nhập thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại')
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: adminAPI.register.bind(adminAPI),
    onSuccess: () => {
      toast.success('Đăng ký thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại')
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminAPI.logout.bind(adminAPI),
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công!')
    },
  })
}

// Website hooks
export const useWebsites = () => {
  return useQuery({
    queryKey: ['websites'],
    queryFn: () => adminAPI.getWebsites(),
  })
}

export const useWebsite = (id: string) => {
  return useQuery({
    queryKey: ['websites', id],
    queryFn: () => adminAPI.getWebsite(id),
    enabled: !!id,
  })
}

export const useCreateWebsite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateWebsiteRequest) => adminAPI.createWebsite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] })
      toast.success('Website đã được tạo!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tạo website thất bại')
    },
  })
}

export const useUpdateWebsite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebsiteRequest> }) =>
      adminAPI.updateWebsite(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['websites'] })
      queryClient.invalidateQueries({ queryKey: ['websites', variables.id] })
      toast.success('Website đã được cập nhật!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật website thất bại')
    },
  })
}

export const useDeleteWebsite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => adminAPI.deleteWebsite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] })
      toast.success('Website đã được xóa!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xóa website thất bại')
    },
  })
}

// API Key hooks
export const useApiKeys = (websiteId: string) => {
  return useQuery({
    queryKey: ['apiKeys', websiteId],
    queryFn: () => adminAPI.getApiKeys(websiteId),
    enabled: !!websiteId,
  })
}

export const useCreateApiKey = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => adminAPI.createApiKey(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', variables.websiteId] })
      toast.success('API key đã được tạo!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tạo API key thất bại')
    },
  })
}

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ websiteId, keyId }: { websiteId: string; keyId: string }) =>
      adminAPI.deleteApiKey(websiteId, keyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', variables.websiteId] })
      toast.success('API key đã được xóa!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xóa API key thất bại')
    },
  })
}

// Conversation hooks
export const useConversations = (websiteId?: string) => {
  return useQuery({
    queryKey: ['conversations', websiteId],
    queryFn: () => adminAPI.getConversations(websiteId),
  })
}

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => adminAPI.getConversation(id),
    enabled: !!id,
  })
}

export const useUpdateConversationStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Conversation['status'] }) =>
      adminAPI.updateConversationStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.id] })
      toast.success('Trạng thái cuộc trò chuyện đã được cập nhật!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại')
    },
  })
}

// Message hooks
export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => adminAPI.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      adminAPI.sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gửi tin nhắn thất bại')
    },
  })
}

// Analytics hooks
export const useAnalytics = (websiteId?: string) => {
  return useQuery({
    queryKey: ['analytics', websiteId],
    queryFn: () => adminAPI.getAnalytics(websiteId),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Real-time hooks
export const useRealTimeConversations = (websiteId?: string) => {
  const queryClient = useQueryClient()
  
  // This would be enhanced with Socket.IO in a real implementation
  return useQuery({
    queryKey: ['conversations', 'realtime', websiteId],
    queryFn: () => adminAPI.getConversations(websiteId),
    refetchInterval: 3000, // Poll every 3 seconds for near real-time
    onSuccess: (data) => {
      // Update the main conversations cache
      queryClient.setQueryData(['conversations', websiteId], data)
    },
  })
}

// Utility hooks
export const useInvalidateConversations = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
  }
}

export const useInvalidateMessages = () => {
  const queryClient = useQueryClient()
  
  return (conversationId: string) => {
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
  }
}
