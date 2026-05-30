import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AnalyticsData {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  conversationsToday: number;
  messagesPerDay: Array<{
    date: string;
    count: number;
  }>;
  conversationsPerDay: Array<{
    date: string;
    count: number;
  }>;
  topWebsites: Array<{
    website: {
      id: string;
      name: string;
      domain: string;
    };
    conversationCount: number;
    messageCount: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(
    workspaceId: string,
    websiteId?: string
  ): Promise<AnalyticsData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Base where clause — always scoped to the workspace
    const baseWhere = websiteId
      ? { websiteId, website: { workspaceId } }
      : { website: { workspaceId } };

    // Get total conversations
    const totalConversations = await this.prisma.conversation.count({
      where: baseWhere,
    });

    // Get active conversations
    const activeConversations = await this.prisma.conversation.count({
      where: {
        ...baseWhere,
        status: "ACTIVE",
      },
    });

    // Get total messages
    const totalMessages = await this.prisma.message.count({
      where: {
        conversation: baseWhere,
      },
    });

    // Get conversations created today
    const conversationsToday = await this.prisma.conversation.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: today,
        },
      },
    });

    // Get messages per day (last 30 days)
    const messagesPerDay = await this.getMessagesPerDay(
      workspaceId,
      websiteId,
      thirtyDaysAgo
    );

    // Get conversations per day (last 30 days)
    const conversationsPerDay = await this.getConversationsPerDay(
      workspaceId,
      websiteId,
      thirtyDaysAgo
    );

    // Get top websites (if not filtering by specific website)
    const topWebsites = websiteId ? [] : await this.getTopWebsites(workspaceId);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      conversationsToday,
      messagesPerDay,
      conversationsPerDay,
      topWebsites,
    };
  }

  private async getMessagesPerDay(
    workspaceId: string,
    websiteId?: string,
    since?: Date
  ) {
    const where = websiteId
      ? { conversation: { websiteId, website: { workspaceId } } }
      : { conversation: { website: { workspaceId } } };

    if (since) {
      where["createdAt"] = { gte: since };
    }

    // This is a simplified version - in a real app you'd use SQL aggregation
    const messages = await this.prisma.message.findMany({
      where,
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const grouped = messages.reduce(
      (acc, message) => {
        const date = message.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private async getConversationsPerDay(
    workspaceId: string,
    websiteId?: string,
    since?: Date
  ) {
    const where = websiteId
      ? { websiteId, website: { workspaceId } }
      : { website: { workspaceId } };

    if (since) {
      where["createdAt"] = { gte: since };
    }

    // This is a simplified version - in a real app you'd use SQL aggregation
    const conversations = await this.prisma.conversation.findMany({
      where,
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const grouped = conversations.reduce(
      (acc, conversation) => {
        const date = conversation.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private async getTopWebsites(workspaceId: string) {
    // Get websites with conversation and message counts
    const websites = await this.prisma.website.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        domain: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    // Get message counts for each website
    const websitesWithCounts = await Promise.all(
      websites.map(async (website) => {
        const messageCount = await this.prisma.message.count({
          where: {
            conversation: {
              websiteId: website.id,
            },
          },
        });

        return {
          website: {
            id: website.id,
            name: website.name,
            domain: website.domain,
          },
          conversationCount: website._count.conversations,
          messageCount,
        };
      })
    );

    // Sort by conversation count (or you could sort by message count)
    return websitesWithCounts
      .sort((a, b) => b.conversationCount - a.conversationCount)
      .slice(0, 5); // Top 5
  }
}
