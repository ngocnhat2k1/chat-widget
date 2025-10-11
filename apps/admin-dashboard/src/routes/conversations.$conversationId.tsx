import { createFileRoute } from '@tanstack/react-router'
import { ConversationDetailPage } from '../pages/conversation-detail'

export const Route = createFileRoute('/conversations/$conversationId')({
  component: ConversationDetailPage,
})
