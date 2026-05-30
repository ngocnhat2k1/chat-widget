import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // HTTP API is admin-facing only (the widget talks over WebSocket), so the
  // REST surface keeps a fixed allowlist. Prefer ADMIN_CORS_ORIGINS, falling
  // back to the legacy CORS_ORIGINS for compatibility.
  const adminOrigins = (
    process.env.ADMIN_CORS_ORIGINS ??
    process.env.CORS_ORIGINS ??
    "http://localhost:5173,http://localhost:5174"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: adminOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");

  console.log("🚀 Backend server is running on http://localhost:" + port);
  console.log("📡 Socket.IO server is ready for real-time connections");
  console.log("🔐 JWT Authentication enabled");
  console.log("🗄️ Prisma database connection ready");
}
bootstrap();
