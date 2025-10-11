import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConversationsModule } from '../conversations/conversations.module';
import { WebsitesModule } from '../websites/websites.module';

@Module({
  imports: [ConversationsModule, WebsitesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
