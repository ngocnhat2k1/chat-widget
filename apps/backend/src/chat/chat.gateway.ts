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
  // The widget is embedded on arbitrary customer domains, so the WS handshake
  // reflects any origin. This is NOT the security boundary — every connection
  // must still pass apiKey+domain validation (widget) or JWT + workspace
  // membership (admin) in handleConnection before it can do anything.
  cors: {
    origin: true,
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
        // Workspace is derived from the apiKey→website, never trusted from the
        // client — so a widget can only ever reach its own workspace.
        client.data.websiteId = validation.website.id;
        client.data.workspaceId = validation.website.workspaceId;
        client.data.isWidget = true;
        this.logger.log(
          `Widget authenticated for website ${validation.website.id} (workspace ${validation.website.workspaceId})`
        );
      } else if (token) {
        let userId: string;
        try {
          const payload = this.jwtService.verify(token);
          userId = payload.sub;
        } catch (err) {
          this.logger.warn(
            `Admin JWT verification failed for ${client.id}: ${err.message}`
          );
          client.disconnect();
          return;
        }

        // The client claims a workspace via the handshake — verify membership
        // before joining its room, otherwise any authed user could subscribe
        // to another tenant's realtime stream.
        const workspaceId = client.handshake.auth?.workspaceId;
        if (!workspaceId) {
          this.logger.warn(`Admin ${userId} sent no workspaceId`);
          client.disconnect();
          return;
        }

        const membership = await this.prisma.membership.findUnique({
          where: { userId_workspaceId: { userId, workspaceId } },
        });
        if (!membership) {
          this.logger.warn(
            `Admin ${userId} is not a member of workspace ${workspaceId}`
          );
          client.disconnect();
          return;
        }

        client.data.userId = userId;
        client.data.workspaceId = workspaceId;
        client.data.isAdmin = true;
        await client.join(`admin:${workspaceId}`);
        this.logger.log(
          `Admin ${userId} connected to workspace ${workspaceId} via socket ${client.id}`
        );
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

      if (client.data.workspaceId) {
        this.server
          .to(`admin:${client.data.workspaceId}`)
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

      // Notify the workspace's admin room so dashboards can show a badge
      // even when the agent isn't viewing the conversation.
      const workspaceId = await this.resolveWorkspaceId(
        client,
        data.conversationId
      );
      if (workspaceId) {
        this.server.to(`admin:${workspaceId}`).emit("receiveMessage", message);
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

  private async resolveWorkspaceId(
    client: Socket,
    conversationId: string
  ): Promise<string | null> {
    if (client.data.workspaceId) return client.data.workspaceId;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { website: { select: { workspaceId: true } } },
    });
    return conversation?.website.workspaceId ?? null;
  }
}
