import { IsString, IsEnum, IsOptional } from "class-validator";

export enum SenderType {
  VISITOR = "VISITOR",
  AGENT = "AGENT",
  SYSTEM = "SYSTEM",
}

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
}
