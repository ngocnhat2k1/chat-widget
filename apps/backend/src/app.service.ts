import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Chat Widget Backend API is running! 🚀";
  }
}
