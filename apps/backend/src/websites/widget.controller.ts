import { Controller, Get, Query } from "@nestjs/common";
import { WebsitesService } from "./websites.service";

/**
 * Public, unauthenticated endpoints the embedded widget calls from arbitrary
 * customer domains. CORS for these is opened by WidgetCorsMiddleware; the API
 * key in the query is the only gate (the config returned is not secret).
 */
@Controller("api/widget")
export class WidgetController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get("config")
  getConfig(@Query("apiKey") apiKey: string) {
    return this.websitesService.getPublicConfigByApiKey(apiKey);
  }
}
