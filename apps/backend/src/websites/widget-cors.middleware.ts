import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * Opens CORS for the public widget-facing endpoints (`/api/widget/*`,
 * `/api/uploads/*`). The widget is embedded on arbitrary customer domains, so
 * the origin is reflected rather than allow-listed. These routes are gated by
 * API key / rate limit, not by origin.
 */
@Injectable()
export class WidgetCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  }
}
