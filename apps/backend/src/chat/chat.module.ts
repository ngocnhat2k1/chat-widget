import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ConversationsModule } from "../conversations/conversations.module";
import { WebsitesModule } from "../websites/websites.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, ConversationsModule, WebsitesModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
