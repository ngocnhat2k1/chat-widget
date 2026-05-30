import { Module } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { ConversationsController } from "./conversations.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspaceGuard } from "../workspaces/workspace.guard";

@Module({
  imports: [PrismaModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, WorkspaceGuard],
  exports: [ConversationsService],
})
export class ConversationsModule {}
