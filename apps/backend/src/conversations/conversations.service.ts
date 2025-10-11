import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateConversationDto {
  websiteId: string;
  visitorId: string;
}

export interface CreateMessageDto {
  content: string;
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM';
}

export interface UpdateConversationDto {
  status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
}

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  // Find all conversations for a user (across all their websites)
  async findAll(userId: string, websiteId?: string) {
    const where = websiteId 
      ? { websiteId, website: { userId } }
      : { website: { userId } };

    return this.prisma.conversation.findMany({
      where,
      include: {
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Find one conversation and verify user has access
  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        website: { userId },
      },
      include: {
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  // Create new conversation (usually called by widget)
  async create(createConversationDto: CreateConversationDto) {
    const { websiteId, visitorId } = createConversationDto;

    // Verify website exists
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    return this.prisma.conversation.create({
      data: {
        websiteId,
        visitorId,
        status: 'ACTIVE',
      },
      include: {
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });
  }

  // Update conversation status
  async update(id: string, updateConversationDto: UpdateConversationDto, userId: string) {
    // Verify user has access
    await this.findOne(id, userId);

    return this.prisma.conversation.update({
      where: { id },
      data: updateConversationDto,
      include: {
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, userId?: string) {
    // If userId is provided, verify access
    if (userId) {
      await this.findOne(conversationId, userId);
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Create a new message
  async createMessage(conversationId: string, createMessageDto: CreateMessageDto, userId?: string) {
    // If userId is provided (agent message), verify access
    if (userId && createMessageDto.senderType === 'AGENT') {
      await this.findOne(conversationId, userId);
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content: createMessageDto.content,
        senderType: createMessageDto.senderType,
      },
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Find or create conversation for a visitor
  async findOrCreateConversation(websiteId: string, visitorId: string) {
    // Try to find existing active conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        websiteId,
        visitorId,
        status: 'ACTIVE',
      },
      include: {
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    // If no active conversation, create new one
    if (!conversation) {
      conversation = await this.create({ websiteId, visitorId });
    }

    return conversation;
  }

  // Get conversations for a specific website (for widget stats)
  async getWebsiteConversations(websiteId: string) {
    return this.prisma.conversation.findMany({
      where: { websiteId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
