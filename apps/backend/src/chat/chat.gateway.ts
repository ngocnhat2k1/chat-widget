import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ChatService } from "./chat.service";
import { WebsitesService } from "../websites/websites.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateConversationDto,
  JoinConversationDto,
  SendMessageDto,
} from "./dto/chat.dto";

@WebSocketGateway({
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private websitesService: WebsitesService,
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const apiKey = client.handshake.auth?.apiKey;
      const domain = client.handshake.auth?.domain;
      const token = client.handshake.auth?.token;

      if (apiKey && domain) {
        const validation = await this.websitesService.validateApiKey(
          apiKey,
          domain
        );
        if (!validation.isValid || !validation.website) {
          this.logger.warn(`Invalid API key for client ${client.id}`);
          client.disconnect();
          return;
        }
        client.data.websiteId = validation.website.id;
        client.data.ownerId = validation.website.userId;
        client.data.isWidget = true;
        this.logger.log(
          `Widget authenticated for website ${validation.website.id} (owner ${validation.website.userId})`
        );
      } else if (token) {
        try {
          const payload = this.jwtService.verify(token);
          client.data.userId = payload.sub;
          client.data.isAdmin = true;
          await client.join(`admin:${payload.sub}`);
          this.logger.log(
            `Admin ${payload.sub} connected via socket ${client.id}`
          );
        } catch (err) {
          this.logger.warn(
            `Admin JWT verification failed for ${client.id}: ${err.message}`
          );
          client.disconnect();
          return;
        }
      } else {
        this.logger.warn(`Client ${client.id} provided no credentials`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("createConversation")
  async handleCreateConversation(
    @MessageBody() data: CreateConversationDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      if (!client.data.isWidget) {
        client.emit("error", { message: "Unauthorized" });
        return;
      }

      const conversation = await this.chatService.createConversation({
        websiteId: client.data.websiteId,
        visitorId: data.visitorId,
        initialMessage: data.initialMessage,
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
      });

      client.emit("conversationCreated", conversation);

      if (client.data.ownerId) {
        this.server
          .to(`admin:${client.data.ownerId}`)
          .emit("conversationCreated", conversation);
      }

      return conversation;
    } catch (error) {
      this.logger.error("Error creating conversation:", error);
      client.emit("error", { message: "Failed to create conversation" });
    }
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { conversationId } = data;

      await client.join(`conversation:${conversationId}`);

      const messages =
        await this.chatService.getConversationMessages(conversationId);
      client.emit("conversationHistory", { conversationId, messages });

      this.logger.log(
        `Client ${client.id} joined conversation: ${conversationId}`
      );
    } catch (error) {
      this.logger.error("Error joining conversation:", error);
      client.emit("error", { message: "Failed to join conversation" });
    }
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const message = await this.chatService.createMessage(data);

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("receiveMessage", message);

      // Notify the website owner's admin room so dashboards can show a badge
      // even when the agent isn't viewing the conversation.
      const ownerId = await this.resolveOwnerId(client, data.conversationId);
      if (ownerId) {
        this.server.to(`admin:${ownerId}`).emit("receiveMessage", message);
      }

      this.logger.log(`Message sent in conversation: ${data.conversationId}`);
      return message;
    } catch (error) {
      this.logger.error("Error sending message:", error);
      client.emit("error", { message: "Failed to send message" });
    }
  }

  @SubscribeMessage("leaveConversation")
  async handleLeaveConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { conversationId } = data;
      await client.leave(`conversation:${conversationId}`);
      this.logger.log(
        `Client ${client.id} left conversation: ${conversationId}`
      );
    } catch (error) {
      this.logger.error("Error leaving conversation:", error);
    }
  }

  @SubscribeMessage("typing")
  handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.isWidget) return;
    client
      .to(`conversation:${data.conversationId}`)
      .emit("visitorTyping", { conversationId: data.conversationId });
  }

  private async resolveOwnerId(
    client: Socket,
    conversationId: string
  ): Promise<string | null> {
    if (client.data.ownerId) return client.data.ownerId;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { website: { select: { userId: true } } },
    });
    return conversation?.website.userId ?? null;
  }
}
