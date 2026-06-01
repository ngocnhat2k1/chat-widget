import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";
import { WidgetCorsMiddleware } from "../websites/widget-cors.middleware";

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Widget visitors upload from arbitrary domains — reflect their origin.
    consumer.apply(WidgetCorsMiddleware).forRoutes("api/uploads");
  }
}
