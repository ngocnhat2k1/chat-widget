import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface WidgetConfig {
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  welcomeMessage?: string;
  agentName?: string;
  theme?: "light" | "dark";
}

export interface Website {
  id: string;
  domain: string;
  name: string;
  widgetConfig?: WidgetConfig | null;
  createdAt: string;
  updatedAt: string;
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  name?: string;
  hashedKey: string;
  createdAt: string;
  lastUsed?: string;
}

export type WorkspaceRole = "OWNER" | "ADMIN" | "AGENT";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: WorkspaceRole;
  createdAt: string;
  websiteCount?: number;
  memberCount?: number;
}

export interface Conversation {
  id: string;
  websiteId: string;
  visitorId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
  metadata?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  website: Website;
  messages: Message[];
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  content: string;
  readAt?: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  conversationsToday: number;
  messagesPerDay: Array<{
    date: string;
    count: number;
  }>;
  conversationsPerDay: Array<{
    date: string;
    count: number;
  }>;
  topWebsites: Array<{
    website: {
      id: string;
      name: string;
      domain: string;
    };
    conversationCount: number;
    messageCount: number;
  }>;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Attach the active workspace so the backend can scope the request.
        // WorkspaceContext keeps this in sync; absent on the bootstrap
        // /api/workspaces call (which doesn't require it).
        const workspaceId = localStorage.getItem("currentWorkspaceId");
        if (workspaceId) {
          config.headers["X-Workspace-Id"] = workspaceId;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleAuthError() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/api/auth/register",
      {
        email,
        password,
      }
    );
    return response.data;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await this.client.get<AuthUser>("/api/auth/me");
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post("/api/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }

  // Website methods
  async getWebsites(): Promise<Website[]> {
    const response = await this.client.get<Website[]>("/api/websites");
    return response.data;
  }

  async getWebsite(id: string): Promise<Website> {
    const response = await this.client.get<Website>(`/api/websites/${id}`);
    return response.data;
  }

  async createWebsite(data: {
    domain: string;
    name: string;
  }): Promise<Website> {
    const response = await this.client.post<Website>("/api/websites", data);
    return response.data;
  }

  async updateWebsite(
    id: string,
    data: { domain?: string; name?: string }
  ): Promise<Website> {
    const response = await this.client.patch<Website>(
      `/api/websites/${id}`,
      data
    );
    return response.data;
  }

  async deleteWebsite(id: string): Promise<void> {
    await this.client.delete(`/api/websites/${id}`);
  }

  async createApiKey(
    websiteId: string,
    name?: string
  ): Promise<{ key: string; apiKey: ApiKey }> {
    const response = await this.client.post<{ key: string; apiKey: ApiKey }>(
      `/api/websites/${websiteId}/api-keys`,
      { name }
    );
    return response.data;
  }

  async deleteApiKey(websiteId: string, keyId: string): Promise<void> {
    await this.client.delete(`/api/websites/${websiteId}/api-keys/${keyId}`);
  }

  async updateWidgetConfig(
    websiteId: string,
    config: WidgetConfig
  ): Promise<{ id: string; widgetConfig: WidgetConfig }> {
    const response = await this.client.patch<{
      id: string;
      widgetConfig: WidgetConfig;
    }>(`/api/websites/${websiteId}/widget-config`, config);
    return response.data;
  }

  // Conversation methods
  async getConversations(params?: {
    websiteId?: string;
    status?: "ACTIVE" | "CLOSED";
    page?: number;
    limit?: number;
  }): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.websiteId) searchParams.append("websiteId", params.websiteId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const response = await this.client.get<{
      conversations: Conversation[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/conversations?${searchParams.toString()}`);
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get<Conversation>(
      `/api/conversations/${id}`
    );
    return response.data;
  }

  async updateConversation(
    id: string,
    data: { status?: "ACTIVE" | "CLOSED"; assignedTo?: string }
  ): Promise<Conversation> {
    const response = await this.client.patch<Conversation>(
      `/api/conversations/${id}`,
      data
    );
    return response.data;
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.delete(`/api/conversations/${id}`);
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const response = await this.client.get<{
      messages: Message[];
      total: number;
      page: number;
      limit: number;
    }>(
      `/api/conversations/${conversationId}/messages?${searchParams.toString()}`
    );
    return response.data;
  }

  async createMessage(
    conversationId: string,
    data: { content: string; senderType: "AGENT"; senderName?: string }
  ): Promise<Message> {
    const response = await this.client.post<Message>(
      `/api/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  }

  async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await this.client.delete(
      `/api/conversations/${conversationId}/messages/${messageId}`
    );
  }

  // Analytics methods
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    websiteId?: string;
  }): Promise<AnalyticsData> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.websiteId) searchParams.append("websiteId", params.websiteId);

    const response = await this.client.get<AnalyticsData>(
      `/api/analytics?${searchParams.toString()}`
    );
    return response.data;
  }

  // Workspace methods
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.client.get<Workspace[]>("/api/workspaces");
    return response.data;
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await this.client.get<Workspace>(`/api/workspaces/${id}`);
    return response.data;
  }

  async updateWorkspace(
    id: string,
    data: { name?: string; slug?: string }
  ): Promise<Workspace> {
    const response = await this.client.patch<Workspace>(
      `/api/workspaces/${id}`,
      data
    );
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();
