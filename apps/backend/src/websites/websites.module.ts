import { Module } from "@nestjs/common";
import { WebsitesController } from "./websites.controller";
import { WebsitesService } from "./websites.service";
import { WorkspaceGuard } from "../workspaces/workspace.guard";

@Module({
  controllers: [WebsitesController],
  providers: [WebsitesService, WorkspaceGuard],
  exports: [WebsitesService],
})
export class WebsitesModule {}
