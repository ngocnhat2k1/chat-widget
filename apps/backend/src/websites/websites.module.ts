import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { WebsitesController } from "./websites.controller";
import { WidgetController } from "./widget.controller";
import { WebsitesService } from "./websites.service";
import { WorkspaceGuard } from "../workspaces/workspace.guard";
import { WidgetCorsMiddleware } from "./widget-cors.middleware";

@Module({
  controllers: [WebsitesController, WidgetController],
  providers: [WebsitesService, WorkspaceGuard],
  exports: [WebsitesService],
})
export class WebsitesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Reflect-origin CORS for the public widget endpoints only.
    consumer.apply(WidgetCorsMiddleware).forRoutes("api/widget");
  }
}
