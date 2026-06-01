# Backend — `apps/backend`

NestJS 10 modular API + Socket.IO WebSocket server. Each domain is a self-contained module.

**Status:** Active
**Last updated:** 2026-05-29

---

## Module map

| Module           | Trách nhiệm                                                  |
| ---------------- | ------------------------------------------------------------ |
| `auth/`          | login, register, JWT strategy, guard, `@GetUser()` decorator |
| `websites/`      | CRUD + API key generate/validate                             |
| `conversations/` | conversation lifecycle (status: ACTIVE/CLOSED/ARCHIVED)      |
| `chat/`          | message storage (REST) + WebSocket gateway                   |
| `analytics/`     | tổng quan, daily stats, top websites                         |
| `prisma/`        | shared `PrismaService` module                                |

**Pattern**: mỗi feature module có `module.ts`, `service.ts`, `controller.ts`, `dto/feature.dto.ts`. Register trong `app.module.ts`.

**Per-module docs**: nằm trong `src/<feature>/docs/README.md` (sẽ được tạo khi feature đó được touch — xem rule trong CLAUDE.md).

---

## WebSocket (Socket.IO)

### Events client → server

- `createConversation` — widget mở chat mới
- `joinConversation` — admin/widget join room `conversation:{id}`
- `sendMessage` — broadcast vào room
- `leaveConversation`
- `typing` — typing indicator

### Events server → client

- `conversationCreated`
- `conversationHistory`
- `receiveMessage`
- `visitorTyping`
- `error`

### Rooms

- `conversation:{id}` — visitor + admin trong conversation
- `admin:{userId}` — admin user room (sẽ đổi thành `admin:{workspaceId}` ở Phase 1 — xem [ROADMAP](../../../docs/ROADMAP.md))

---

## Authentication

| Loại client     | Cơ chế                      | Where                                        |
| --------------- | --------------------------- | -------------------------------------------- |
| Widget          | API key + domain validation | `socket.handshake.auth = { apiKey, domain }` |
| Admin REST      | JWT Bearer token            | `Authorization: Bearer <token>`              |
| Admin WebSocket | JWT trong handshake         | `socket.handshake.auth = { token }`          |

JWT: HS256, 7-day expiry, signed bằng `JWT_SECRET`.

---

## Bootstrap (main.ts)

- `ValidationPipe` global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS: hiện list cứng cho `localhost:5173/5174` (sẽ refactor sang dynamic CORS ở Phase 1)
- Health check: `GET /health`
- Listen port `process.env.PORT || 3001`

---

## Environment variables

File `.env` ở `apps/backend/.env`:

```env
DATABASE_URL="file:./dev.db"          # SQLite (dev) — sẽ chuyển sang Postgres ở Phase 0
# DATABASE_URL="postgresql://chatuser:chatpass123@localhost:5432/chat_widget"
JWT_SECRET="your-jwt-secret"
PORT=3001
```

Env sẽ thêm ở các phase tiếp:

- Phase 2: `RESEND_API_KEY`, `EMAIL_FROM`, `CLOUDINARY_*`, `SENTRY_DSN`
- Phase 3: `ADMIN_CORS_ORIGINS`

---

## Database

Xem [docs/architecture/data-model.md](../../../docs/architecture/data-model.md).

```bash
pnpm prisma migrate dev --name <name>
pnpm prisma generate
pnpm db:seed
```

---

## Build + run

```bash
# Dev
pnpm dev          # nodemon hot-reload

# Prod
pnpm build        # → dist/
node dist/main.js
```

---

## Testing

Jest + Supertest đã cài, **chưa có test file**. Plan ở Phase 4 — xem [CHECKLIST](../../../docs/CHECKLIST.md).

- Unit: `src/**/*.spec.ts`
- E2E: `test/`
- Run: `pnpm test`
