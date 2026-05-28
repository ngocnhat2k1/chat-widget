import { createFileRoute } from "@tanstack/react-router";
import { ConversationDetailPage } from "../pages/conversation-detail";

export const Route = createFileRoute(
  "/_authenticated/conversations/$conversationId"
)({
  component: ConversationDetailPage,
});
