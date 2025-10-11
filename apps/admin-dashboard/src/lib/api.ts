import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Types
export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Website {
  id: string
  userId: string
  domain: string
  name: string
  createdAt: string
  updatedAt: string
  _count?: {
    conversations: number
    apiKeys: number
  }
}

export interface ApiKey {
  id: string
  websiteId: string
  name?: string
  key?: string // Only returned on creation
  createdAt: string
  lastUsed?: string
}

export interface Conversation {
  id: string
  websiteId: string
  visitorId: string
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  website?: Website
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  conversationId: string
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM'
  content: string
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface CreateWebsiteRequest {
  domain: string
  name: string
}

export interface CreateApiKeyRequest {
  websiteId: string
  name?: string
}

export interface Analytics {
  totalConversations: number
  activeConversations: number
  totalMessages: number
  conversationsToday: number
  messagesPerDay: Array<{
    date: string
    count: number
  }>
  conversationsPerDay: Array<{
    date: string
    count: number
  }>
  topWebsites: Array<{
    website: Website
    conversationCount: number
    messageCount: number
  }>
}

export class AdminAPI {
  private client: AxiosInstance
  private token: string | null = null

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL: baseURL + '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )

    // Load token from localStorage
    this.loadToken()
  }

  private saveToken(token: string) {
    this.token = token
    localStorage.setItem('admin_token', token)
  }

  private loadToken() {
    const token = localStorage.getItem('admin_token')
    if (token) {
      this.token = token
    }
  }

  private clearToken() {
    this.token = null
    localStorage.removeItem('admin_token')
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials)
    this.saveToken(response.data.token)
    return response.data
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data)
    this.saveToken(response.data.token)
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } finally {
      this.clearToken()
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/auth/me')
    return response.data
  }

  // Website methods
  async getWebsites(): Promise<Website[]> {
    const response = await this.client.get<Website[]>('/websites')
    return response.data
  }

  async getWebsite(id: string): Promise<Website> {
    const response = await this.client.get<Website>(`/websites/${id}`)
    return response.data
  }

  async createWebsite(data: CreateWebsiteRequest): Promise<Website> {
    const response = await this.client.post<Website>('/websites', data)
    return response.data
  }

  async updateWebsite(id: string, data: Partial<CreateWebsiteRequest>): Promise<Website> {
    const response = await this.client.patch<Website>(`/websites/${id}`, data)
    return response.data
  }

  async deleteWebsite(id: string): Promise<void> {
    await this.client.delete(`/websites/${id}`)
  }

  // API Key methods
  async getApiKeys(websiteId: string): Promise<ApiKey[]> {
    const response = await this.client.get<ApiKey[]>(`/websites/${websiteId}/api-keys`)
    return response.data
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await this.client.post<ApiKey>(`/websites/${data.websiteId}/api-keys`, {
      name: data.name,
    })
    return response.data
  }

  async deleteApiKey(websiteId: string, keyId: string): Promise<void> {
    await this.client.delete(`/websites/${websiteId}/api-keys/${keyId}`)
  }

  // Conversation methods
  async getConversations(websiteId?: string): Promise<Conversation[]> {
    const url = websiteId ? `/conversations?websiteId=${websiteId}` : '/conversations'
    const response = await this.client.get<Conversation[]>(url)
    return response.data
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get<Conversation>(`/conversations/${id}`)
    return response.data
  }

  async updateConversationStatus(id: string, status: Conversation['status']): Promise<Conversation> {
    const response = await this.client.patch<Conversation>(`/conversations/${id}`, { status })
    return response.data
  }

  // Message methods
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.client.get<Message[]>(`/conversations/${conversationId}/messages`)
    return response.data
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await this.client.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
      senderType: 'AGENT',
    })
    return response.data
  }

  // Analytics methods
  async getAnalytics(websiteId?: string): Promise<Analytics> {
    const url = websiteId ? `/analytics?websiteId=${websiteId}` : '/analytics'
    const response = await this.client.get<Analytics>(url)
    return response.data
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL + '/api'
  }
}

// Create a default instance
export const adminAPI = new AdminAPI()

// Export for testing and custom instances
export default AdminAPI
