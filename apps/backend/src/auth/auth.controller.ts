import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService, AuthResponse } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Stricter than the global limit: 5 attempts / minute / IP to slow brute force.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto
  ): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success
    return { message: "Logged out successfully" };
  }
}
