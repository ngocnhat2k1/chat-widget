import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { UploadsService } from "./uploads.service";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Public image upload used by the widget (visitor) and admin. Gated by a tight
 * rate limit + size/type validation rather than auth, since the widget visitor
 * is unauthenticated. CORS opened by WidgetCorsMiddleware.
 */
@Controller("api/uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("image")
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 uploads / minute / IP
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|gif|webp)$/ }),
        ],
      })
    )
    file: {
      buffer: Buffer;
      mimetype: string;
    }
  ) {
    return this.uploadsService.uploadImage(file);
  }
}
