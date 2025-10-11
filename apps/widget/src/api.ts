import { io, Socket } from 'socket.io-client'
import { API_CONFIG } from './config'

export interface Message {
  id: string
  conversationId: string
  content: string
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM'
  createdAt: string
}

export interface Conversation {
  id: string
  websiteId: string
  visitorId: string
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
}

export class ChatAPI {
  private socket: Socket | null = null
  private apiKey: string
  private domain: string
  private visitorId: string

  constructor(apiKey: string, domain: string) {
    this.apiKey = apiKey
    this.domain = domain
    this.visitorId = this.generateVisitorId()
  }

  private generateVisitorId(): string {
    const stored = localStorage.getItem('chat_widget_visitor_id')
    if (stored) return stored
    
    const newId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    localStorage.setItem('chat_widget_visitor_id', newId)
    return newId
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket

    this.socket = io(API_CONFIG.SOCKET_URL, {
      auth: {
        apiKey: this.apiKey,
        domain: this.domain,
      },
      transports: ['websocket', 'polling'],
    })

    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'))

      this.socket.on('connect', () => {
        console.log('✅ Widget connected to chat server')
        resolve(this.socket!)
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ Widget connection error:', error)
        reject(error)
      })

      this.socket.on('error', (error) => {
        console.error('❌ Widget socket error:', error)
      })
    })
  }

  async createConversation(initialMessage?: string): Promise<Conversation> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Conversation creation timeout'))
      }, 10000)

      this.socket!.emit('createConversation', {
        visitorId: this.visitorId,
        initialMessage,
      })

      this.socket!.on('conversationCreated', (conversation: Conversation) => {
        clearTimeout(timeout)
        resolve(conversation)
      })

      this.socket!.on('error', (error) => {
        clearTimeout(timeout)
        reject(new Error(error.message || 'Failed to create conversation'))
      })
    })
  }

  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) return

    this.socket.emit('joinConversation', { conversationId })
  }

  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) return

    this.socket.emit('sendMessage', {
      conversationId,
      content,
      senderType: 'VISITOR',
    })
  }

  onMessage(callback: (message: Message) => void): void {
    if (!this.socket) return
    this.socket.on('receiveMessage', callback)
  }

  onConversationHistory(callback: (data: { conversationId: string; messages: Message[] }) => void): void {
    if (!this.socket) return
    this.socket.on('conversationHistory', callback)
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getVisitorId(): string {
    return this.visitorId
  }
}
