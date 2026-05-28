import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, SendMessageDto, SenderType } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createConversation(createConversationDto: CreateConversationDto) {
    const { websiteId, visitorId, initialMessage } = createConversationDto;

    // Check if there's already an active conversation for this visitor
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        websiteId,
        visitorId,
        status: 'ACTIVE',
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        websiteId,
        visitorId,
        status: 'ACTIVE',
      },
    });

    // Add initial message if provided
    if (initialMessage) {
      await this.createMessage({
        conversationId: conversation.id,
        content: initialMessage,
        senderType: SenderType.VISITOR,
      });
    }

    return conversation;
  }

  async createMessage(sendMessageDto: SendMessageDto) {
    const { conversationId, content, senderType } = sendMessageDto;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content,
        senderType,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getConversationMessages(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async getWebsiteConversations(websiteId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { websiteId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations;
  }

  async closeConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'CLOSED' },
    });

    return conversation;
  }
}
