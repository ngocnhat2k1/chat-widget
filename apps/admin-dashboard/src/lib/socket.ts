import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '../lib/api-client';

export interface SocketMessage extends Message {}

export interface SocketNewConversation extends Conversation {}

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string): void {
    if (this.socket?.connected) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected as admin');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leaveConversation', { conversationId });
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('sendMessage', {
      conversationId,
      content,
      senderType: 'AGENT',
    });
  }

  onNewMessage(callback: (data: SocketMessage) => void): void {
    this.socket?.on('receiveMessage', callback);
  }

  offNewMessage(callback?: (data: SocketMessage) => void): void {
    if (callback) {
      this.socket?.off('receiveMessage', callback);
    } else {
      this.socket?.off('receiveMessage');
    }
  }

  onNewConversation(callback: (data: SocketNewConversation) => void): void {
    this.socket?.on('conversationCreated', callback);
  }

  offNewConversation(callback?: (data: SocketNewConversation) => void): void {
    if (callback) {
      this.socket?.off('conversationCreated', callback);
    } else {
      this.socket?.off('conversationCreated');
    }
  }

  // Alias used by dashboard layout for toast notifications on background convos
  onMessageNotification(callback: (data: SocketMessage) => void): void {
    this.onNewMessage(callback);
  }

  offMessageNotification(callback?: (data: SocketMessage) => void): void {
    this.offNewMessage(callback);
  }
}

export const socketService = SocketService.getInstance();
