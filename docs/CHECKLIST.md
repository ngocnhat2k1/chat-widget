# Execution Checklist

> Tactical TODO list. Tick `[x]` khi xong. _Tại sao_ làm từng việc → xem [ROADMAP.md](ROADMAP.md).
> **Last updated:** 2026-05-29

---

## Phase 0 — Dev environment alignment

### Setup Postgres local
- [ ] `docker-compose up -d` (Postgres on port 5432)
- [ ] Verify connect: `docker exec -it <container> psql -U chatuser -d chat_widget`
- [ ] Cập nhật `apps/backend/.env`: `DATABASE_URL="postgresql://chatuser:chatpass123@localhost:5432/chat_widget"`

### Migrate schema sang Postgres
- [ ] Đổi `provider = "postgresql"` trong `apps/backend/prisma/schema.prisma`
- [ ] Chuyển field `String` → native enum:
  - [ ] `Conversation.status` → `enum ConversationStatus { ACTIVE CLOSED ARCHIVED }`
  - [ ] `Message.senderType` → `enum SenderType { VISITOR AGENT SYSTEM }`
- [ ] Update các DTO + service nếu cần (TypeScript type sẽ tự update qua `prisma generate`)
- [ ] Xoá folder `apps/backend/prisma/migrations/`
- [ ] Xoá `apps/backend/prisma/dev.db` (file SQLite cũ)
- [ ] `pnpm prisma migrate dev --name init`
- [ ] `pnpm prisma generate`

### Verify
- [ ] Update `apps/backend/prisma/seed.ts` nếu seed dùng string literals → enum
- [ ] `pnpm db:seed`
- [ ] Backend boot: `cd apps/backend && pnpm dev` → không lỗi
- [ ] Smoke test: register user qua admin dashboard → tạo website → tạo API key

---

## Phase 1 — Workspace Foundation

### Schema
- [ ] Thêm model `Workspace` (id, name, slug @unique, createdAt)
- [ ] Thêm model `Membership` (userId, workspaceId, role) + @@unique
- [ ] Thêm enum `Role { OWNER ADMIN AGENT }`
- [ ] Sửa `Website`: bỏ `userId`, thêm `workspaceId`
- [ ] `pnpm prisma migrate dev --name add_workspace`
- [ ] Update seed: demo user → demo workspace (OWNER) → demo websites

### Backend modules mới
- [ ] Tạo `apps/backend/src/workspaces/` module (controller, service, dto)
  - [ ] `GET /api/workspaces` — list workspace user có membership
  - [ ] `GET /api/workspaces/:id` — detail
  - [ ] `PATCH /api/workspaces/:id` — update (chỉ OWNER/ADMIN)
- [ ] Tạo `apps/backend/src/memberships/` (cho Phase sau, nhưng schema sẵn)

### Auth + Workspace context
- [ ] Đăng ký user → auto-create Workspace + Membership(OWNER) trong transaction
- [ ] Tạo decorator `@CurrentWorkspace()` resolve từ header `X-Workspace-Id`
- [ ] Tạo `WorkspaceGuard` check Membership tồn tại
- [ ] Tạo `WorkspaceRoleGuard(['OWNER', 'ADMIN'])` cho route nhạy cảm
- [ ] Apply guard lên các route websites/conversations/analytics

### Refactor services sang workspace scope
- [ ] `WebsitesService`: query theo `workspaceId` thay `userId`
- [ ] `ConversationsService`: filter qua `website.workspaceId`
- [ ] `AnalyticsService`: scope theo workspace
- [ ] WebSocket gateway: room `admin:userId` → `admin:workspaceId`

### WebSocket auth (không có header)
- [ ] Admin WS: parse `socket.handshake.auth.workspaceId` + validate membership
- [ ] Widget WS: vẫn `handshake.auth = { apiKey, domain }`, server resolve workspaceId
- [ ] Tạo helper `ApiKeysService.resolveWebsiteByApiKey(apiKey)` + in-memory cache 60s

### Dynamic CORS
- [ ] Tạo middleware `WidgetCorsMiddleware`:
  - [ ] Nhận `Origin` header
  - [ ] Lookup `Website.domain` qua API key trong request
  - [ ] Allow nếu khớp, reject nếu không
- [ ] Apply cho route `/api/widget/*` và Socket.IO handshake
- [ ] Admin routes vẫn dùng fixed `ADMIN_CORS_ORIGINS` env

### Admin Dashboard UI
- [ ] Tạo `src/contexts/WorkspaceContext.tsx`
- [ ] Persist `currentWorkspaceId` trong localStorage
- [ ] Workspace switcher dropdown ở header layout
- [ ] Update `src/lib/api-client.ts`: Axios interceptor gắn `X-Workspace-Id`
- [ ] Update Socket.IO client: gửi workspaceId qua `auth` payload
- [ ] Trang `/_authenticated/settings/workspace` (form: tên, slug)

### Verify Phase 1
- [ ] Register user mới → workspace auto-tạo → có thể login
- [ ] Tạo website trong workspace → API key gen ngon
- [ ] Widget connect với API key + domain → vào đúng workspace
- [ ] Admin inbox nhận real-time msg từ widget (cùng workspace)

---

## Phase 2 — MVP Polish

### 2.1 Cleanup duplicate routes
- [ ] Audit imports tới `apps/admin-dashboard/src/pages/`
- [ ] Migrate những gì còn dùng sang `src/routes/`
- [ ] Xoá `src/pages/`
- [ ] Build + smoke test admin dashboard

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

### 2.4 Visitor info capture
- [ ] Schema: `Conversation.metadata Json?`
- [ ] Widget: gửi userAgent, language, screen, referrer, currentPageUrl, timezone khi `createConversation`
- [ ] Backend: lưu vào `Conversation.metadata`
- [ ] Admin inbox: panel phải hiển thị visitor info (browser, OS, current page)

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
- [ ] Cài `@nestjs/throttler`
- [ ] Config:
  - [ ] Auth (`/api/auth/*`): 5/min/IP
  - [ ] Upload: 10/min/user
  - [ ] WS `sendMessage`: 30/min/conversation
- [ ] Tested: hit limit → 429 response

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
