import { IsString, IsEnum, IsOptional } from "class-validator";
import { SenderType } from "@prisma/client";

// Re-export so existing imports (`./dto/chat.dto`) keep working while the
// single source of truth is the Prisma-generated enum.
export { SenderType };

export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

  @IsEnum(SenderType)
  senderType: SenderType;
}

export class JoinConversationDto {
  @IsString()
  conversationId: string;
}

export class CreateConversationDto {
  @IsString()
  websiteId: string;

  @IsString()
  visitorId: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;

  @IsOptional()
  @IsString()
  visitorName?: string;

  @IsOptional()
  @IsString()
  visitorEmail?: string;

  @IsOptional()
  visitorInfo?: Record<string, string>;
}
