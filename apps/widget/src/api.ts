import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "./config";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  websiteId: string;
  visitorId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export class ChatAPI {
  private socket: Socket | null = null;
  private apiKey: string;
  private domain: string;
  private visitorId: string;
  private conversationKey: string;

  constructor(apiKey: string, domain: string) {
    this.apiKey = apiKey;
    this.domain = domain;
    this.visitorId = this.generateVisitorId();
    this.conversationKey = `chat_widget_conversation_${apiKey}`;
  }

  private generateVisitorId(): string {
    const stored = localStorage.getItem("chat_widget_visitor_id");
    if (stored) return stored;

    const newId =
      "visitor_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("chat_widget_visitor_id", newId);
    return newId;
  }

  // Context the agent sees when replying — collected client-side, best-effort.
  private collectVisitorInfo(): Record<string, string> {
    const info: Record<string, string> = {};
    try {
      info.userAgent = navigator.userAgent;
      info.language = navigator.language;
      info.screen = `${window.screen.width}x${window.screen.height}`;
      info.referrer = document.referrer || "";
      info.currentPageUrl = window.location.href;
      info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      // Some embedding contexts restrict these APIs — send what we have.
    }
    return info;
  }

  getStoredConversationId(): string | null {
    return localStorage.getItem(this.conversationKey);
  }

  setStoredConversationId(conversationId: string): void {
    localStorage.setItem(this.conversationKey, conversationId);
  }

  clearStoredConversationId(): void {
    localStorage.removeItem(this.conversationKey);
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;

    this.socket = io(API_CONFIG.SOCKET_URL, {
      auth: {
        apiKey: this.apiKey,
        domain: this.domain,
      },
      transports: ["websocket", "polling"],
    });

    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not initialized"));

      this.socket.on("connect", () => {
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        reject(error);
      });

      this.socket.on("error", (error) => {
        console.error("Widget socket error:", error);
      });
    });
  }

  async createConversation(
    initialMessage?: string,
    visitorName?: string,
    visitorEmail?: string
  ): Promise<Conversation> {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat server");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Conversation creation timeout"));
      }, 10000);

      this.socket!.emit("createConversation", {
        visitorId: this.visitorId,
        initialMessage,
        visitorName,
        visitorEmail,
        visitorInfo: this.collectVisitorInfo(),
      });

      this.socket!.once("conversationCreated", (conversation: Conversation) => {
        clearTimeout(timeout);
        resolve(conversation);
      });

      this.socket!.once("error", (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || "Failed to create conversation"));
      });
    });
  }

  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("joinConversation", { conversationId });
  }

  sendMessage(
    conversationId: string,
    content: string,
    attachment?: { url: string; type: string }
  ): void {
    if (!this.socket?.connected) return;

    this.socket.emit("sendMessage", {
      conversationId,
      content,
      senderType: "VISITOR",
      ...(attachment && {
        attachmentUrl: attachment.url,
        attachmentType: attachment.type,
      }),
    });
  }

  // Upload an image to the backend and get back its hosted URL.
  async uploadImage(file: File): Promise<{ url: string; type: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/uploads/image`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      throw new Error("Upload failed");
    }
    return res.json();
  }

  sendTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("typing", { conversationId });
  }

  onMessage(callback: (message: Message) => void): void {
    if (!this.socket) return;
    this.socket.on("receiveMessage", callback);
  }

  onConversationHistory(
    callback: (data: { conversationId: string; messages: Message[] }) => void
  ): void {
    if (!this.socket) return;
    this.socket.on("conversationHistory", callback);
  }

  onMessagesRead(callback: (data: { conversationId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on("messagesRead", callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getVisitorId(): string {
    return this.visitorId;
  }
}
