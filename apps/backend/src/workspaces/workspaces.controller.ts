import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { WorkspacesService } from "./workspaces.service";
import { WorkspaceGuard } from "./workspace.guard";
import { WorkspaceRoleGuard } from "./workspace-role.guard";
import { UpdateWorkspaceDto } from "./dto/workspace.dto";

@Controller("api/workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // Bootstrap endpoint: list workspaces the user can access. NOT behind
  // WorkspaceGuard — the client has no current workspace yet at this point.
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@User("id") userId: string) {
    return this.workspacesService.findAllForUser(userId);
  }

  @Get(":workspaceId")
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  findOne(@Param("workspaceId") workspaceId: string) {
    return this.workspacesService.findOne(workspaceId);
  }

  @Patch(":workspaceId")
  @UseGuards(
    JwtAuthGuard,
    WorkspaceGuard,
    WorkspaceRoleGuard([Role.OWNER, Role.ADMIN])
  )
  update(
    @Param("workspaceId") workspaceId: string,
    @Body(ValidationPipe) dto: UpdateWorkspaceDto
  ) {
    return this.workspacesService.update(workspaceId, dto);
  }
}
