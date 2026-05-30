import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WorkspaceGuard } from "../workspaces/workspace.guard";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";

@Controller("api/analytics")
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(
    @CurrentWorkspace("id") workspaceId: string,
    @Query("websiteId") websiteId?: string
  ) {
    return this.analyticsService.getAnalytics(workspaceId, websiteId);
  }
}
