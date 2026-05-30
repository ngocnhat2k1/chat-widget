# Execution Checklist

> Tactical TODO list. Tick `[x]` khi xong. _Tại sao_ làm từng việc → xem [ROADMAP.md](ROADMAP.md).
> **Last updated:** 2026-05-29 — Phase 0 ✅ + Phase 1 (backend + admin UI) ✅; còn verify widget↔admin end-to-end qua browser

---

## Phase 0 — Dev environment alignment

### Setup Postgres local

- [x] `docker-compose up -d` (Postgres on port 5432) — compose file ở `apps/backend/`
- [x] Verify connect: `docker exec -it chat-widget-db psql -U chatuser -d chat_widget`
- [x] Cập nhật `apps/backend/.env`: `DATABASE_URL="postgresql://chatuser:chatpass123@localhost:5432/chat_widget"`

### Migrate schema sang Postgres

- [x] Đổi `provider = "postgresql"` trong `apps/backend/prisma/schema.prisma` (đã sẵn)
- [x] Chuyển field `String` → native enum:
  - [x] `Conversation.status` → `enum ConversationStatus { ACTIVE CLOSED ARCHIVED }`
  - [x] `Message.senderType` → `enum SenderType { VISITOR AGENT SYSTEM }`
- [x] Update các DTO + service nếu cần — bỏ enum tự định nghĩa trong `chat.dto.ts`, re-export `SenderType` từ `@prisma/client` (single source of truth); sửa `"USER"` không hợp lệ trong `conversations/dto/conversation.dto.ts`
- [x] Xoá folder `apps/backend/prisma/migrations/` (chưa tồn tại — bỏ qua)
- [x] Xoá `apps/backend/prisma/dev.db` (file SQLite cũ)
- [x] `pnpm prisma migrate dev --name init` → tạo `20260529032110_init` với `CREATE TYPE` enum native
- [x] `pnpm prisma generate`

### Verify

- [x] Update `apps/backend/prisma/seed.ts` nếu seed dùng string literals → enum (seed không dùng literal enum nào → không cần đổi)
- [x] `pnpm db:seed` → tạo demo user + website + API key
- [x] Backend boot: `cd apps/backend && pnpm dev` → boot sạch với Postgres, không lỗi
- [x] Smoke test: login demo user → tạo website → tạo API key (REST) ✅; enum round-trip verified: ghi `ACTIVE`/`VISITOR` OK, DB reject giá trị enum sai `'USER'` ✅

---

## Phase 1 — Workspace Foundation

### Schema

- [x] Thêm model `Workspace` (id, name, slug @unique, createdAt)
- [x] Thêm model `Membership` (userId, workspaceId, role) + @@unique([userId, workspaceId])
- [x] Thêm enum `Role { OWNER ADMIN AGENT }`
- [x] Sửa `Website`: bỏ `userId`, thêm `workspaceId` (+ `User.websites` → `User.memberships`)
- [x] `pnpm prisma migrate dev --name add_workspace` (migration `20260529042336_add_workspace`)
- [x] Update seed: demo user → demo workspace (OWNER) → demo website

### Backend modules mới

- [x] Tạo `apps/backend/src/workspaces/` module (controller, service, dto)
  - [x] `GET /api/workspaces` — list workspace user có membership (bootstrap, KHÔNG sau WorkspaceGuard)
  - [x] `GET /api/workspaces/:workspaceId` — detail
  - [x] `PATCH /api/workspaces/:workspaceId` — update (chỉ OWNER/ADMIN)
- [ ] ~~Tạo `apps/backend/src/memberships/`~~ — hoãn: schema `Membership` đã sẵn, module để Phase invitation (chưa cần endpoint nào)

### Auth + Workspace context

- [x] Đăng ký user → auto-create Workspace + Membership(OWNER) trong `prisma.$transaction`
- [x] Tạo decorator `@CurrentWorkspace()` resolve từ header `X-Workspace-Id` (hoặc param `:workspaceId`)
- [x] Tạo `WorkspaceGuard` check Membership tồn tại (param `:workspaceId` ưu tiên hơn header — tránh leak)
- [x] Tạo `WorkspaceRoleGuard([OWNER, ADMIN])` (mixin) — dùng cho PATCH workspace
- [x] Apply guard lên các route websites/conversations/analytics

### Refactor services sang workspace scope

- [x] `WebsitesService`: query theo `workspaceId` thay `userId`
- [x] `ConversationsService`: filter qua `website.workspaceId`
- [x] `AnalyticsService`: scope theo workspace
- [x] WebSocket gateway: room `admin:userId` → `admin:workspaceId`
- [x] Xoá `chat.controller.ts` (REST `/conversations` dead-code + leak: `getWebsiteConversations` không check ownership)

### WebSocket auth (không có header)

- [x] Admin WS: parse `socket.handshake.auth.workspaceId` + **validate membership** trước khi join room
- [x] Widget WS: vẫn `handshake.auth = { apiKey, domain }`, server resolve workspaceId qua `validateApiKey` → `website.workspaceId`
- [ ] ~~Helper `resolveWebsiteByApiKey` + cache 60s~~ — hoãn: `validateApiKey` hiện tại đủ dùng; cache là tối ưu hiệu năng, làm khi đo thấy chậm

### Dynamic CORS

- [x] HTTP API: allowlist cố định qua `ADMIN_CORS_ORIGINS` (fallback `CORS_ORIGINS`) — API REST chỉ admin dùng
- [x] WS gateway: reflect origin (`origin: true`) — widget nhúng domain bất kỳ; bảo mật thật = apiKey+domain validation trong handshake (đã có sẵn check `website.domain === domain`)
- [ ] ~~`WidgetCorsMiddleware` lookup per-request~~ — hoãn sang Phase 2: chưa có route HTTP `/api/widget/*` nào để bảo vệ (config widget là việc 2.2)

### Admin Dashboard UI

- [x] Tạo `src/contexts/workspace-context.tsx`
- [x] Persist `currentWorkspaceId` trong localStorage
- [x] Workspace switcher dropdown ở header layout (+ link sang workspace settings)
- [x] Update `src/lib/api-client.ts`: interceptor gắn `X-Workspace-Id` + methods `getWorkspaces`/`updateWorkspace`
- [x] Update Socket.IO client: gửi `workspaceId` qua `auth` payload; reconnect khi đổi workspace
- [x] Trang `/_authenticated/settings/workspace` (form: tên, slug; chỉ OWNER/ADMIN sửa được)

### Verify Phase 1

- [x] Register user mới → workspace auto-tạo → bootstrap `GET /api/workspaces` trả OWNER (test A/B)
- [x] Tạo website trong workspace → API key gen ngon (scoped theo workspace)
- [x] **Tenant isolation (mục tiêu chính): REST 13/13 + WS 4/4** — B không đọc/sửa được dữ liệu của A; admin socket claim workspace lạ bị disconnect
- [ ] Widget connect + admin inbox real-time end-to-end qua browser — _chưa chạy thủ công_ (cần mở widget + admin, để verify khi chạy `./start-dev.sh`)

---

## Phase 2 — MVP Polish

### 2.1 Cleanup duplicate routes ✅

- [x] Audit imports tới `apps/admin-dashboard/src/pages/`
- [x] Inline page component vào route file tương ứng (canonical TanStack layout)
- [x] Xoá `src/pages/`
- [x] Build + type-check admin dashboard pass

### 2.2 Widget customization UI có preview

- [ ] Schema: thêm `Website.widgetConfig Json?`
- [ ] Backend: `GET /api/widget/config?apiKey=...` (public, dynamic CORS)
- [ ] Backend: `PATCH /api/websites/:id/widget-config` (admin auth)
- [ ] Admin: trang `/_authenticated/websites/$id/customize`
  - [ ] Color picker (primaryColor)
  - [ ] Position select (bottom-left/right)
  - [ ] Welcome message textarea
  - [ ] Agent display name
  - [ ] Save button
- [ ] Live preview iframe (load widget với config hiện tại, postMessage để update)
- [ ] Widget: fetch config từ backend trước khi mount React
- [ ] Widget: merge order `{ ...baseline, ...dataAttrs }`

### 2.3 Embed code copy UI

- [ ] Component `EmbedCodeBlock` với tabs HTML/React/WordPress
- [ ] Snippet generator dựa trên website (api key + domain)
- [ ] Nút "Copy" → clipboard + toast
- [ ] Đặt ở trang website detail

### 2.4 Visitor info capture ✅

- [x] Schema: `Conversation.metadata Json?` (migration `20260530053113_add_conversation_metadata`)
- [x] Widget: gửi userAgent, language, screen, referrer, currentPageUrl, timezone khi `createConversation`
- [x] Backend: lưu vào `Conversation.metadata` (gateway → chat.service)
- [x] Admin inbox: panel phải hiển thị visitor info (E2E test PASS: metadata lưu + admin đọc lại đúng)

### 2.5 File upload (image only)

- [ ] Tạo `apps/backend/src/uploads/` module
- [ ] Cài `multer`, `sharp`, Cloudinary SDK
- [ ] Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] `POST /api/uploads/image` (multipart, max 5MB, validate mime + dimension)
- [ ] Schema: `Message` thêm `attachmentUrl String?`, `attachmentType String?`
- [ ] Widget UI: nút paperclip → file input → preview → send
- [ ] Admin inbox: render image trong bubble (click → full view)
- [ ] Dynamic CORS apply cho `/api/uploads/*`

### 2.6 Email notification (offline)

- [ ] Cài Resend SDK, env `RESEND_API_KEY`, `EMAIL_FROM`
- [ ] Tạo `apps/backend/src/notifications/` module
- [ ] Presence tracking: in-memory `Map<workspaceId, Set<socketId>>` trong gateway
- [ ] Logic: visitor gửi msg → check presence → nếu workspace không có admin online → gửi email cho tất cả Membership
- [ ] Logic: admin reply → nếu conversation đã đóng/visitor offline + có email → gửi link tiếp tục chat
- [ ] Template HTML (inline hoặc MJML)
- [ ] Tested: simulate offline, verify email gửi

### 2.7 Rate limiting

- [x] Cài `@nestjs/throttler`
- [x] Config:
  - [x] Global default: 100/min/IP (ThrottlerGuard là APP_GUARD)
  - [x] Auth (`/api/auth/login|register`): 5/min/IP (`@Throttle`)
  - [ ] ~~Upload: 10/min/user~~ — làm cùng 2.5 (chưa có upload module)
  - [ ] ~~WS `sendMessage`: 30/min/conversation~~ — hoãn: throttler HTTP không cover WS gateway; cần custom WS throttle
- [x] Tested: login 6 lần → lần 6 trả `429`

### 2.8 Sentry

- [ ] Backend: cài `@sentry/node`, init trong `main.ts`
- [ ] Backend: NestJS exception filter forward sang Sentry
- [ ] Widget: cài `@sentry/react`, init trong `widget.tsx` (chỉ track lỗi JS, KHÔNG track message content)
- [ ] Admin: cài `@sentry/react`, init trong `main.tsx`
- [ ] Env: `SENTRY_DSN` (backend), `VITE_SENTRY_DSN` (widget + admin)
- [ ] Test: throw sample error → verify lên Sentry dashboard

### 2.9 Sound + browser notification (admin inbox)

- [ ] Add file `apps/admin-dashboard/public/notification.mp3`
- [ ] Khi tab không focus + có msg mới: `new Notification(...)` + play sound
- [ ] Permission request flow
- [ ] Toggle on/off trong workspace settings

### Verify Phase 2

- [ ] Nhúng widget vào file HTML test → đổi màu trong customize UI → preview update real-time
- [ ] Upload image trong widget → admin thấy image
- [ ] Đóng tất cả admin tab → visitor gửi msg → nhận email noti
- [ ] Mở admin tab background → có msg → nghe sound + browser noti

---

## Phase 3 — Deploy

### Backend → Render

- [ ] Tạo Render account
- [ ] Tạo PostgreSQL instance (chọn paid $7 hoặc free + reminder ngày 80)
- [ ] Tạo Web Service từ GitHub repo
- [ ] Build command: `cd apps/backend && pnpm install && pnpm prisma generate && pnpm build`
- [ ] Start command: `cd apps/backend && pnpm prisma migrate deploy && node dist/main.js`
- [ ] Env vars: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CLOUDINARY_*`, `SENTRY_DSN`, `ADMIN_CORS_ORIGINS`
- [ ] Custom domain `api.yourapp.com` + SSL
- [ ] Health check `/health` enabled

### Widget → Vercel

- [ ] Build: `cd apps/widget && pnpm build:widget` → output `dist/widget.iife.js`
- [ ] Tạo Vercel project (root: `apps/widget`)
- [ ] `vercel.json`: header `Cache-Control: public, max-age=3600, s-maxage=86400`
- [ ] Custom domain `widget.yourapp.com`
- [ ] Verify: `curl https://widget.yourapp.com/widget.js`

### Admin Dashboard → Vercel

- [ ] Verify `vercel.json` root config
- [ ] Tạo Vercel project (root: `apps/admin-dashboard`)
- [ ] Env: `VITE_API_URL=https://api.yourapp.com`, `VITE_SENTRY_DSN`
- [ ] Custom domain `app.yourapp.com`

### Public landing + docs

- [ ] Đổi route `/` từ redirect → landing page component
- [ ] Hero, features, pricing "Coming soon", embed code preview
- [ ] Tạo route `/docs` với:
  - [ ] Quick start (HTML embed)
  - [ ] React integration
  - [ ] WordPress plugin instruction
  - [ ] Link sang Swagger (sẽ có ở Phase 4)
- [ ] Verify public route không bị `_authenticated` guard

### Verify Phase 3

- [ ] Từ máy khác nhúng widget vào website thật (HTML file)
- [ ] Chat → admin reply → real-time hoạt động qua production URL
- [ ] Test offline email noti production

---

## Phase 4 — Beta Validation

### Swagger

- [ ] Cài `@nestjs/swagger`
- [ ] Decorator DTO + controller + ApiTags
- [ ] Setup Swagger module trong `main.ts`
- [ ] Expose `/api/docs` (basic auth nếu `NODE_ENV === production`)

### CI (GitHub Actions)

- [ ] Tạo `.github/workflows/ci.yml`
- [ ] Trigger: PR + push main
- [ ] Steps: checkout → setup pnpm + node → install → format:check → lint → type-check → build
- [ ] Branch protection: require CI pass trước khi merge

### Critical-path tests

- [ ] Backend e2e (`apps/backend/test/`):
  - [ ] register → create website → create API key → widget WS connect → send message → admin receive
- [ ] Backend unit:
  - [ ] `WebsitesService.validateApiKey` (valid/invalid/expired)
  - [ ] `AuthService.login` (correct/wrong password/non-existent)
- [ ] Widget Playwright:
  - [ ] open widget → pre-chat form → submit → send message → receive auto-reply (demo mode)

### Onboard beta user

- [ ] Chuẩn bị landing page có CTA signup
- [ ] Tìm 3-5 user (cá nhân, dự án nhỏ, ưu tiên có website thật)
- [ ] Onboarding doc / video ngắn
- [ ] Google Form feedback (UX issues, missing features, bugs)
- [ ] Setup analytics (Plausible/Umami free) cho landing
- [ ] Tuần 1: monitor Sentry, fix critical bugs
- [ ] Tuần 2: tổng hợp feedback → quyết định phase 5 (Stripe? More features?)

### Verify Phase 4

- [ ] CI green trên main
- [ ] 3 beta user đã connect widget vào website của họ
- [ ] Sentry không có unhandled exception trong 48h
- [ ] Có feedback bằng văn bản từ ít nhất 2 user

---

## Sau Phase 4 (parking lot)

Suy nghĩ về các hướng tiếp theo dựa trên feedback:

- [ ] Stripe + plans + quotas
- [ ] Multi-agent invitation UI
- [ ] Conversation tags/labels/search
- [ ] Canned responses
- [ ] Office hours / availability
- [ ] Auto-response / FAQ bot
- [ ] Webhook integrations (Slack, Discord)
- [ ] Chat rating / NPS sau conversation
