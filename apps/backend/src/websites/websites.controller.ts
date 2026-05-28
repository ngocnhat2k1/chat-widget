import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { WebsitesService, UpdateWebsiteDto } from "./websites.service";
import { CreateWebsiteDto } from "./dto/websites.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";

@Controller("api/websites")
@UseGuards(JwtAuthGuard)
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get()
  findAll(@User("id") userId: string) {
    return this.websitesService.findAll(userId);
  }

  @Get(":id")
  findOne(@User("id") userId: string, @Param("id") id: string) {
    return this.websitesService.findOne(id, userId);
  }

  @Post()
  create(
    @User("id") userId: string,
    @Body(ValidationPipe) dto: CreateWebsiteDto
  ) {
    return this.websitesService.create(dto, userId);
  }

  @Patch(":id")
  update(
    @User("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateWebsiteDto
  ) {
    return this.websitesService.update(id, dto, userId);
  }

  @Delete(":id")
  remove(@User("id") userId: string, @Param("id") id: string) {
    return this.websitesService.remove(id, userId);
  }

  @Get(":id/api-keys")
  getApiKeys(@User("id") userId: string, @Param("id") websiteId: string) {
    return this.websitesService.getApiKeys(websiteId, userId);
  }

  @Post(":id/api-keys")
  createApiKey(
    @User("id") userId: string,
    @Param("id") websiteId: string,
    @Body() dto: { name?: string }
  ) {
    return this.websitesService.createApiKey(websiteId, dto, userId);
  }

  @Delete(":id/api-keys/:keyId")
  deleteApiKey(
    @User("id") userId: string,
    @Param("id") websiteId: string,
    @Param("keyId") keyId: string
  ) {
    return this.websitesService.deleteApiKey(websiteId, keyId, userId);
  }
}
