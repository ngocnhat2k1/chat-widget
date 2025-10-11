import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebsiteDto, CreateApiKeyDto } from './dto/websites.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface UpdateWebsiteDto {
  domain?: string
  name?: string
}

@Injectable()
export class WebsitesService {
  constructor(private prisma: PrismaService) {}

  // Find all websites for a user
  async findAll(userId: string) {
    return this.prisma.website.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            conversations: true,
            apiKeys: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Find one website by ID and verify ownership
  async findOne(id: string, userId: string) {
    const website = await this.prisma.website.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            conversations: true,
            apiKeys: true,
          },
        },
      },
    })

    if (!website) {
      throw new NotFoundException('Website not found')
    }

    return website
  }

  // Create new website
  async create(createWebsiteDto: CreateWebsiteDto, userId: string) {
    return this.prisma.website.create({
      data: {
        ...createWebsiteDto,
        userId,
      },
      include: {
        _count: {
          select: {
            conversations: true,
            apiKeys: true,
          },
        },
      },
    })
  }

  // Update website
  async update(id: string, updateWebsiteDto: UpdateWebsiteDto, userId: string) {
    // Verify ownership
    await this.findOne(id, userId)

    return this.prisma.website.update({
      where: { id },
      data: updateWebsiteDto,
      include: {
        _count: {
          select: {
            conversations: true,
            apiKeys: true,
          },
        },
      },
    })
  }

  // Delete website
  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId)

    return this.prisma.website.delete({
      where: { id },
    })
  }

  // API Key management
  async getApiKeys(websiteId: string, userId: string) {
    // Verify ownership
    await this.findOne(websiteId, userId)

    return this.prisma.apiKey.findMany({
      where: { websiteId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        // Don't return the actual hashed key
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createApiKey(websiteId: string, createApiKeyDto: CreateApiKeyDto, userId: string) {
    // Verify ownership
    await this.findOne(websiteId, userId)

    // Generate a random API key
    const apiKey = crypto.randomBytes(32).toString('hex')
    
    // Hash the API key for storage
    const hashedKey = await bcrypt.hash(apiKey, 12)

    const result = await this.prisma.apiKey.create({
      data: {
        websiteId,
        hashedKey,
        name: createApiKeyDto.name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
      },
    })

    // Return the API key only once (on creation)
    return {
      ...result,
      key: apiKey, // Plain text key - only returned on creation
    }
  }

  async deleteApiKey(websiteId: string, keyId: string, userId: string) {
    // Verify ownership
    await this.findOne(websiteId, userId)

    // Verify the API key belongs to this website
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, websiteId },
    })

    if (!apiKey) {
      throw new NotFoundException('API key not found')
    }

    return this.prisma.apiKey.delete({
      where: { id: keyId },
    })
  }

  // Validate API key for widget usage
  async validateApiKey(apiKey: string, domain: string) {
    // Find all API keys and check them
    const apiKeys = await this.prisma.apiKey.findMany({
      include: {
        website: true,
      },
    })

    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.hashedKey)
      if (isValid && key.website.domain === domain) {
        // Update last used timestamp
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsed: new Date() },
        })

        return {
          isValid: true,
          website: key.website,
        }
      }
    }

    return { isValid: false }
  }

  // Legacy methods (keep for backward compatibility)
  async createWebsite(userId: string, createWebsiteDto: CreateWebsiteDto) {
    return this.create(createWebsiteDto, userId)
  }

  async getUserWebsites(userId: string) {
    return this.findAll(userId)
  }

  async generateApiKey(userId: string, createApiKeyDto: CreateApiKeyDto) {
    const { websiteId, name } = createApiKeyDto
    return this.createApiKey(websiteId, { name }, userId)
  }
}
