import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateConversationDto {
  websiteId: string;
  visitorId: string;
}

export interface CreateMessageDto {
  content: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
}

export interface UpdateConversationDto {
  status?: "ACTIVE" | "CLOSED" | "ARCHIVED";
}

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    workspaceId: string,
    websiteId?: string,
    status?: "ACTIVE" | "CLOSED" | "ARCHIVED",
    page = 1,
    limit = 20
  ) {
    const where: Record<string, unknown> = {
      website: { workspaceId },
    };
    if (websiteId) where.websiteId = websiteId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          website: {
            select: { id: true, name: true, domain: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { conversations, total, page, limit };
  }

  async findOne(id: string, workspaceId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, website: { workspaceId } },
      include: {
        website: { select: { id: true, name: true, domain: true } },
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return conversation;
  }

  async create(dto: CreateConversationDto, _workspaceId?: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: dto.websiteId },
    });

    if (!website) {
      throw new NotFoundException("Website not found");
    }

    return this.prisma.conversation.create({
      data: {
        websiteId: dto.websiteId,
        visitorId: dto.visitorId,
        status: "ACTIVE",
      },
      include: {
        website: { select: { id: true, name: true, domain: true } },
      },
    });
  }

  async update(id: string, dto: UpdateConversationDto, workspaceId: string) {
    await this.findOne(id, workspaceId);

    return this.prisma.conversation.update({
      where: { id },
      data: dto,
      include: {
        website: { select: { id: true, name: true, domain: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    await this.prisma.conversation.delete({ where: { id } });
    return { success: true };
  }

  async getMessages(
    conversationId: string,
    workspaceId?: string,
    page = 1,
    limit = 50
  ) {
    if (workspaceId) {
      await this.findOne(conversationId, workspaceId);
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { messages, total, page, limit };
  }

  async createMessage(
    conversationId: string,
    dto: CreateMessageDto,
    workspaceId?: string
  ) {
    if (workspaceId && dto.senderType === "AGENT") {
      await this.findOne(conversationId, workspaceId);
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content: dto.content,
        senderType: dto.senderType,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteMessage(
    messageId: string,
    conversationId: string,
    workspaceId: string
  ) {
    await this.findOne(conversationId, workspaceId);

    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    await this.prisma.message.delete({ where: { id: messageId } });
    return { success: true };
  }

  async findOrCreateConversation(websiteId: string, visitorId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { websiteId, visitorId, status: "ACTIVE" },
      include: {
        website: { select: { id: true, name: true, domain: true } },
      },
    });

    if (existing) return existing;

    return this.create({ websiteId, visitorId });
  }
}
