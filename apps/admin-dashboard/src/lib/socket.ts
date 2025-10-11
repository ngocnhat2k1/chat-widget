import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '../lib/api-client';

export interface SocketMessage {
  message: Message;
  conversationId: string;
}

export interface SocketNewConversation {
  conversation: Conversation;
}

export interface SocketMessageNotification {
  message: Message;
  conversation: Conversation;
}

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
    if (this.socket?.connected) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    
    this.socket = io(`${socketUrl}/chat`, {
      auth: {
        token, // JWT token for admin authentication
      },
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

  // Join a conversation room
  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Send a message to a conversation
  sendMessage(conversationId: string, content: string, senderName?: string): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        senderName: senderName || 'Admin',
      });
    }
  }

  // Listen for new messages
  onNewMessage(callback: (data: SocketMessage) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Stop listening for new messages
  offNewMessage(callback?: (data: SocketMessage) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('new_message', callback);
      } else {
        this.socket.off('new_message');
      }
    }
  }

  // Listen for new conversations
  onNewConversation(callback: (data: SocketNewConversation) => void): void {
    if (this.socket) {
      this.socket.on('new_conversation', callback);
    }
  }

  // Stop listening for new conversations
  offNewConversation(callback?: (data: SocketNewConversation) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('new_conversation', callback);
      } else {
        this.socket.off('new_conversation');
      }
    }
  }

  // Listen for message notifications (for conversations not currently viewed)
  onMessageNotification(callback: (data: SocketMessageNotification) => void): void {
    if (this.socket) {
      this.socket.on('new_message_notification', callback);
    }
  }

  // Stop listening for message notifications
  offMessageNotification(callback?: (data: SocketMessageNotification) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('new_message_notification', callback);
      } else {
        this.socket.off('new_message_notification');
      }
    }
  }
}

export const socketService = SocketService.getInstance();
