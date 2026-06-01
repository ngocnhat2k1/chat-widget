import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

const MAX_DIMENSION = 4000;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly configured: boolean;

  constructor() {
    this.configured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (this.configured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } else {
      this.logger.warn(
        "Cloudinary env not set — image uploads are disabled (set CLOUDINARY_* to enable)."
      );
    }
  }

  async uploadImage(file: {
    buffer: Buffer;
    mimetype: string;
  }): Promise<{ url: string; type: string }> {
    if (!this.configured) {
      throw new ServiceUnavailableException("Image uploads are not configured");
    }

    // Verify the bytes really are an image (not just a trusted mimetype) and
    // are within sane bounds.
    let meta: sharp.Metadata;
    try {
      meta = await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException("File is not a valid image");
    }
    if (!meta.width || !meta.height) {
      throw new BadRequestException("File is not a valid image");
    }
    if (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION) {
      throw new BadRequestException(
        `Image too large (max ${MAX_DIMENSION}px per side)`
      );
    }

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "chat-widget", resource_type: "image" },
          (error, uploaded) => {
            if (error || !uploaded) {
              reject(error ?? new Error("Upload failed"));
            } else {
              resolve(uploaded as { secure_url: string });
            }
          }
        );
        stream.end(file.buffer);
      }
    );

    return { url: result.secure_url, type: file.mimetype };
  }
}
