import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WebsitesService } from '../websites/websites.service';
import {
  CreateConversationDto,
  JoinConversationDto,
  SendMessageDto,
} from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private websitesService: WebsitesService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const apiKey = client.handshake.auth?.apiKey;
      const domain = client.handshake.auth?.domain;

      if (apiKey && domain) {
        const validation = await this.websitesService.validateApiKey(
          apiKey,
          domain,
        );
        if (!validation.isValid || !validation.website) {
          this.logger.warn(`Invalid API key for client ${client.id}`);
          client.disconnect();
          return;
        }
        client.data.websiteId = validation.website.id;
        client.data.isWidget = true;
        this.logger.log(
          `Widget authenticated for website: ${validation.website.id}`,
        );
      } else {
        client.data.isAdmin = true;
        this.logger.log(`Admin client connected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @MessageBody() data: CreateConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.isWidget) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const conversation = await this.chatService.createConversation({
        websiteId: client.data.websiteId,
        visitorId: data.visitorId,
        initialMessage: data.initialMessage,
      });

      client.emit('conversationCreated', conversation);
      return conversation;
    } catch (error) {
      this.logger.error('Error creating conversation:', error);
      client.emit('error', { message: 'Failed to create conversation' });
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { conversationId } = data;

      await client.join(`conversation:${conversationId}`);

      const messages =
        await this.chatService.getConversationMessages(conversationId);
      client.emit('conversationHistory', { conversationId, messages });

      this.logger.log(
        `Client ${client.id} joined conversation: ${conversationId}`,
      );
    } catch (error) {
      this.logger.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.chatService.createMessage(data);

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('receiveMessage', message);

      this.logger.log(`Message sent in conversation: ${data.conversationId}`);
      return message;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { conversationId } = data;
      await client.leave(`conversation:${conversationId}`);
      this.logger.log(
        `Client ${client.id} left conversation: ${conversationId}`,
      );
    } catch (error) {
      this.logger.error('Error leaving conversation:', error);
    }
  }
}
