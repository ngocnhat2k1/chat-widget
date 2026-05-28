import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GetUser } from "../auth/get-user.decorator";

@Controller("conversations")
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(":id/messages")
  async getConversationMessages(@Param("id") conversationId: string) {
    return this.chatService.getConversationMessages(conversationId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWebsiteConversations(
    @Query("websiteId") websiteId: string,
    @GetUser() user: any
  ) {
    return this.chatService.getWebsiteConversations(websiteId);
  }

  @Post(":id/close")
  @UseGuards(JwtAuthGuard)
  async closeConversation(@Param("id") conversationId: string) {
    return this.chatService.closeConversation(conversationId);
  }
}
