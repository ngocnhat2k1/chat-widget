import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateWebsiteDto {
  @IsString()
  name: string;

  @IsUrl()
  domain: string;
}

export class CreateApiKeyDto {
  @IsString()
  websiteId: string;

  @IsOptional()
  @IsString()
  name?: string;
}
