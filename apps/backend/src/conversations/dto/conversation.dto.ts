export interface CreateConversationDto {
  websiteId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorInfo?: any;
}

export interface JoinConversationDto {
  conversationId: string;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  senderName?: string;
}
