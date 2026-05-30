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
import { WorkspaceGuard } from "../workspaces/workspace.guard";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";

@Controller("api/websites")
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get()
  findAll(@CurrentWorkspace("id") workspaceId: string) {
    return this.websitesService.findAll(workspaceId);
  }

  @Get(":id")
  findOne(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") id: string
  ) {
    return this.websitesService.findOne(id, workspaceId);
  }

  @Post()
  create(
    @CurrentWorkspace("id") workspaceId: string,
    @Body(ValidationPipe) dto: CreateWebsiteDto
  ) {
    return this.websitesService.create(dto, workspaceId);
  }

  @Patch(":id")
  update(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") id: string,
    @Body() dto: UpdateWebsiteDto
  ) {
    return this.websitesService.update(id, dto, workspaceId);
  }

  @Delete(":id")
  remove(@CurrentWorkspace("id") workspaceId: string, @Param("id") id: string) {
    return this.websitesService.remove(id, workspaceId);
  }

  @Get(":id/api-keys")
  getApiKeys(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") websiteId: string
  ) {
    return this.websitesService.getApiKeys(websiteId, workspaceId);
  }

  @Post(":id/api-keys")
  createApiKey(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") websiteId: string,
    @Body() dto: { name?: string }
  ) {
    return this.websitesService.createApiKey(websiteId, dto, workspaceId);
  }

  @Delete(":id/api-keys/:keyId")
  deleteApiKey(
    @CurrentWorkspace("id") workspaceId: string,
    @Param("id") websiteId: string,
    @Param("keyId") keyId: string
  ) {
    return this.websitesService.deleteApiKey(websiteId, keyId, workspaceId);
  }
}
