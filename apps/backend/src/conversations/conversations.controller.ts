import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WorkspaceGuard } from "../workspaces/workspace.guard";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";

export class CreateConversationDto {
  websiteId: string;
  visitorId: string;
}

export class CreateMessageDto {
  content: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
}

export class UpdateConversationDto {
  status?: "ACTIVE" | "CLOSED" | "ARCHIVED";
}

@Controller("api/conversations")
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @CurrentWorkspace("id") workspaceId: string,
    @Query("websiteId") websiteId?: string,
    @Query("status") status?: "ACTIVE" | "CLOSED",
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.conversationsService.findAll(
      workspaceId,
      websiteId,
      status,
      pageNum,
      limitNum
    );
  }

  @Get(":id")
  async findOne(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") id: string
  ) {
    return this.conversationsService.findOne(id, workspaceId);
  }

  @Post()
  async create(
    @CurrentWorkspace("id") workspaceId: string,
    @Body() createConversationDto: CreateConversationDto
  ) {
    return this.conversationsService.create(createConversationDto, workspaceId);
  }

  @Patch(":id")
  async update(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") id: string,
    @Body() updateConversationDto: UpdateConversationDto
  ) {
    return this.conversationsService.update(
      id,
      updateConversationDto,
      workspaceId
    );
  }

  @Delete(":id")
  async remove(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") id: string
  ) {
    return this.conversationsService.remove(id, workspaceId);
  }

  // Messages endpoints
  @Get(":id/messages")
  async getMessages(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") conversationId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return this.conversationsService.getMessages(
      conversationId,
      workspaceId,
      pageNum,
      limitNum
    );
  }

  @Post(":id/messages")
  async createMessage(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") conversationId: string,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.conversationsService.createMessage(
      conversationId,
      createMessageDto,
      workspaceId
    );
  }

  @Delete(":conversationId/messages/:messageId")
  async deleteMessage(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("conversationId") conversationId: string,
    @Param("messageId") messageId: string
  ) {
    return this.conversationsService.deleteMessage(
      messageId,
      conversationId,
      workspaceId
    );
  }
}
