import {
  IsString,
  IsOptional,
  IsUrl,
  IsIn,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateWebsiteDto {
  @IsString()
  name: string;

  @IsUrl()
  domain: string;
}

export class UpdateWidgetConfigDto {
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: "primaryColor must be a hex color",
  })
  primaryColor?: string;

  @IsOptional()
  @IsIn(["bottom-right", "bottom-left"])
  position?: "bottom-right" | "bottom-left";

  @IsOptional()
  @IsString()
  @MaxLength(200)
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  agentName?: string;

  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: "light" | "dark";
}

export class CreateApiKeyDto {
  @IsString()
  websiteId: string;

  @IsOptional()
  @IsString()
  name?: string;
}
