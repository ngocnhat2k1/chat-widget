import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query 
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

export class CreateConversationDto {
  websiteId: string;
  visitorId: string;
}

export class CreateMessageDto {
  content: string;
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM';
}

export class UpdateConversationDto {
  status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
}

@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @User('id') userId: string,
    @Query('websiteId') websiteId?: string,
    @Query('status') status?: 'ACTIVE' | 'CLOSED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.conversationsService.findAll(
      userId,
      websiteId,
      status,
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  async findOne(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.conversationsService.findOne(id, userId);
  }

  @Post()
  async create(
    @User('id') userId: string,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(createConversationDto, userId);
  }

  @Patch(':id')
  async update(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateConversationDto, userId);
  }

  @Delete(':id')
  async remove(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.conversationsService.remove(id, userId);
  }

  // Messages endpoints
  @Get(':id/messages')
  async getMessages(
    @User('id') userId: string,
    @Param('id') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return this.conversationsService.getMessages(
      conversationId,
      userId,
      pageNum,
      limitNum,
    );
  }

  @Post(':id/messages')
  async createMessage(
    @User('id') userId: string,
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.conversationsService.createMessage(
      conversationId,
      createMessageDto,
      userId,
    );
  }

  @Delete(':conversationId/messages/:messageId')
  async deleteMessage(
    @User('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.conversationsService.deleteMessage(
      messageId,
      conversationId,
      userId,
    );
  }
}
