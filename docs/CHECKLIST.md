# Execution Checklist

> Tactical TODO list. Tick `[x]` khi xong. _Tại sao_ làm từng việc → xem [ROADMAP.md](ROADMAP.md).
> **Last updated:** 2026-06-04 — Phase 0-2 ✅; Phase 3 **deploy LIVE** ✅ (backend Render `chat-widget-api-5x5b.onrender.com` + admin `chat-widget-admin-dashboard.vercel.app` + widget `chat-widget-widget.vercel.app` — đã wire + verify); Phase 4 CI + tests + bug fixes ✅. Còn: verify chat real-time end-to-end qua browser; onboard beta (thủ công); bật branch protection; (sau) custom domains + env keys thật (Cloudinary/Resend/Sentry); Postgres free hết hạn **2026-06-27**.

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

### 2.2 Widget customization UI có preview ✅

- [x] Schema: thêm `Website.widgetConfig Json?` (migration `20260531113529_add_website_widget_config`)
- [x] Backend: `GET /api/widget/config?apiKey=...` (public `WidgetController` + `WidgetCorsMiddleware` reflect-origin) — test PASS + CORS header
- [x] Backend: `PATCH /api/websites/:id/widget-config` (admin auth, workspace-scoped, merge) — test PASS
- [x] Admin: trang `/_authenticated/websites/$id/customize`
  - [x] Color picker (primaryColor)
  - [x] Position select (bottom-left/right)
  - [x] Welcome message textarea
  - [x] Agent display name
  - [x] Theme (light/dark) + Save button
- [x] Live preview — React mock `WidgetPreview` update real-time (thay iframe+postMessage: instant, không cần WS/apiKey)
- [x] Widget: fetch config từ backend (`fetchServerConfig`) trước khi mount
- [x] Widget: merge order `DEFAULT < server baseline < dataAttrs` (chỉ đọc data-attr customer thực sự set)

### 2.3 Embed code copy UI ✅

- [x] Component `EmbedCodeBlock` với tabs HTML/React/WordPress (data-attrs khớp widget auto-mount)
- [x] Snippet generator dựa trên website (api key + domain)
- [x] Nút "Copy" → clipboard + toast
- [x] Đặt ở trang websites: modal reveal key (plaintext chỉ hiện 1 lần khi tạo) + nút Code xem mã nhúng (placeholder key)

### 2.4 Visitor info capture ✅

- [x] Schema: `Conversation.metadata Json?` (migration `20260530053113_add_conversation_metadata`)
- [x] Widget: gửi userAgent, language, screen, referrer, currentPageUrl, timezone khi `createConversation`
- [x] Backend: lưu vào `Conversation.metadata` (gateway → chat.service)
- [x] Admin inbox: panel phải hiển thị visitor info (E2E test PASS: metadata lưu + admin đọc lại đúng)

### 2.5 File upload (image only) ✅ (code-complete — cần CLOUDINARY\_\* để upload thật)

- [x] Tạo `apps/backend/src/uploads/` module
- [x] Cài `sharp` + Cloudinary SDK (`multer` qua `@nestjs/platform-express` FileInterceptor)
- [x] Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — chưa set → endpoint trả `503` (đã verify)
- [x] `POST /api/uploads/image` (multipart, max 5MB, `FileTypeValidator` mime + `sharp` validate dimension ≤4000px) + rate limit 10/min
- [x] Schema: `Message` thêm `attachmentUrl String?`, `attachmentType String?` (migration `20260531121134_add_message_attachment`); WS `sendMessage` mang attachment
- [x] Widget UI: nút paperclip → file input → upload → send (demo mode preview local)
- [x] Admin inbox: render image trong bubble (click → mở tab mới)
- [x] Dynamic CORS apply cho `/api/uploads/*` (WidgetCorsMiddleware reflect-origin, GET/POST — verified header)

### 2.6 Email notification (offline) ✅ (code-complete — cần RESEND_API_KEY + EMAIL_FROM để gửi thật)

- [x] Cài Resend SDK, env `RESEND_API_KEY`, `EMAIL_FROM` — chưa set → service log warning, `notifyOfflineAgents` no-op
- [x] Tạo `apps/backend/src/notifications/` module (`NotificationsService`)
- [x] Presence tracking: in-memory `Map<workspaceId, Set<socketId>>` trong gateway (add/remove theo admin connect/disconnect)
- [x] Logic: visitor gửi msg → `hasOnlineAdmin(workspaceId)` → nếu offline → email cho tất cả Membership (cooldown 5 phút/conversation)
- [ ] ~~Logic: admin reply → conversation đóng + visitor offline → link tiếp tục~~ — hoãn (cần visitor email + token link; phần offline-admin là phần chính, đã làm)
- [x] Template HTML inline (escape content)
- [ ] Tested: simulate offline, verify email gửi — _path đã verify chạy không crash; gửi thật cần điền RESEND env_

### 2.7 Rate limiting

- [x] Cài `@nestjs/throttler`
- [x] Config:
  - [x] Global default: 100/min/IP (ThrottlerGuard là APP_GUARD)
  - [x] Auth (`/api/auth/login|register`): 5/min/IP (`@Throttle`)
  - [ ] ~~Upload: 10/min/user~~ — làm cùng 2.5 (chưa có upload module)
  - [ ] ~~WS `sendMessage`: 30/min/conversation~~ — hoãn: throttler HTTP không cover WS gateway; cần custom WS throttle
- [x] Tested: login 6 lần → lần 6 trả `429`

### 2.8 Sentry ✅ (code-complete, DSN-guarded — cần DSN để test thật)

- [x] Backend: cài `@sentry/node`, init trong `src/instrument.ts` (import đầu tiên ở `main.ts`)
- [x] Backend: `SentryExceptionFilter` (APP_FILTER) forward lỗi 5xx sang Sentry (bỏ qua 4xx)
- [x] Widget: cài `@sentry/browser` (nhẹ hơn react cho IIFE), init trong `widget.tsx` — `sendDefaultPii:false` + bỏ Breadcrumbs (KHÔNG track message content)
- [x] Admin: cài `@sentry/react`, init trong `main.tsx`
- [x] Env: `SENTRY_DSN` (backend), `VITE_SENTRY_DSN` (widget + admin) — init **no-op nếu chưa set** (an toàn dev)
- [ ] Test: throw sample error → verify lên Sentry dashboard — _cần bạn điền DSN vào `.env` rồi test_

### 2.9 Sound + browser notification (admin inbox) ✅

- [x] ~~File `notification.mp3`~~ → dùng Web Audio beep (`lib/notifications.ts`), không cần asset binary
- [x] Khi tab không focus + có msg/conversation mới: `new Notification(...)` + beep (`alertNewActivity`)
- [x] Permission request flow (`ensureNotifPermission`)
- [x] Toggle on/off ở trang workspace settings (lưu localStorage)

### Verify Phase 2

> Backend đã verify bằng test tự động (config PATCH/GET + CORS, upload 503+CORS, offline path không crash, rate limit 429). Phần dưới cần chạy thật qua browser + env keys:

- [ ] Nhúng widget vào file HTML test → customize UI: preview update real-time (React mock ✅); đổi màu lưu → reload widget thấy màu mới (cần chạy thật)
- [ ] Upload image trong widget → admin thấy image (cần `CLOUDINARY_*`)
- [ ] Đóng tất cả admin tab → visitor gửi msg → nhận email noti (cần `RESEND_API_KEY` + `EMAIL_FROM`)
- [ ] Mở admin tab background → có msg → nghe sound + browser noti (cần grant Notification permission)

---

## Phase 3 — Deploy

### Backend → Render ✅ (live)

- [x] **Live:** `https://chat-widget-api-5x5b.onrender.com` (region Singapore, free plan, Docker via `apps/backend/Dockerfile`, autoDeploy on `main`)
- [x] Postgres free (`chat-widget`, Singapore) — **expires 2026-06-27** (free tier ~30 ngày, cần backup/nâng paid trước hạn)
- [x] Build/start qua Dockerfile (multi-stage; CMD: `prisma db push --skip-generate && node dist/main.js`)
- [x] Env: `DATABASE_URL` (internal, đã link), `JWT_SECRET`, `NODE_ENV=production`, `ENABLE_SWAGGER=true`. Chưa set: `RESEND_API_KEY`/`EMAIL_FROM`/`CLOUDINARY_*`/`SENTRY_DSN` (defer — feature graceful-off)
- [x] CORS: `ADMIN_CORS_ORIGINS` cho phép admin Vercel origin (verified preflight 204 + `access-control-allow-origin`)
- [ ] Custom domain `api.yourapp.com` — _defer, dùng URL `.onrender.com` cho beta_
- [ ] Health check `/health` — _chưa có route `/health`; login 401 đã chứng minh app+DB OK_

### Widget → Vercel ✅ (live)

- [x] **Live:** `https://chat-widget-widget.vercel.app/chat-widget.iife.js` (HTTP 200, `Cache-Control: public, max-age=3600, s-maxage=86400`, baked `VITE_API_URL` → backend)
- [x] Vercel project `chat-widget-widget` (deploy qua CLI từ `apps/widget`, `vercel.json` standalone: `npm install` + `build:widget`)
- [x] Fix: thêm `terser` vào widget devDeps (Vite 5 coi terser optional → standalone `npm install` thiếu → build fail)
- [ ] Custom domain `widget.yourapp.com` — _defer_
- [ ] Git-integration auto-deploy — _hiện deploy thủ công qua `vercel --prod`; có thể connect git (root `apps/widget`) sau_

### Admin Dashboard → Vercel ✅ (live)

- [x] **Live:** `https://chat-widget-admin-dashboard.vercel.app` (git-integrated, root `apps/admin-dashboard`, autoDeploy on `main`)
- [x] Env: `VITE_API_URL` → backend (baked, verified); `VITE_WIDGET_URL` → widget URL (set, redeploy khi push để embed snippet đúng)
- [ ] Custom domain `app.yourapp.com` — _defer_

### Public landing + docs ✅

- [x] Đổi route `/` từ redirect → landing page component
- [x] Hero, features (6), 3 bước nhúng, pricing Beta/Pro "Coming soon", embed snippet preview, CTA
- [x] Tạo route `/docs` với:
  - [x] Quick start (HTML embed qua `EmbedCodeBlock`)
  - [x] React integration (tab trong EmbedCodeBlock)
  - [x] WordPress instruction
  - [x] Bảng `data-*` attributes + thứ tự merge config
  - [x] Link sang Swagger `/api/docs` (ghi "sắp ra mắt" — Phase 4)
- [x] Verify public route không bị `_authenticated` guard (route top-level, `__root` chỉ Outlet) + `vercel.json` đã có SPA rewrite

### Verify Phase 3

- [ ] Từ máy khác nhúng widget vào website thật (HTML file)
- [ ] Chat → admin reply → real-time hoạt động qua production URL
- [ ] Test offline email noti production

---

## Phase 4 — Beta Validation

### Swagger ✅

- [x] Cài `@nestjs/swagger@7` (khớp Nest 10, không phải v11)
- [ ] ~~Decorator DTO + controller + ApiTags~~ — auto-discover routes đủ dùng; decorate sau cho đẹp
- [x] Setup Swagger trong `main.ts` (`setupSwagger`)
- [x] Expose `/api/docs` — tắt ở production trừ khi `ENABLE_SWAGGER=true` (verified: `/api/docs` 200, `/api/docs-json` có paths)

### CI (GitHub Actions) ✅ (lint hoãn)

- [x] Tạo `.github/workflows/ci.yml`
- [x] Trigger: PR + push main
- [x] Steps: checkout → pnpm + node 20 → install → prisma generate → format:check → **lint** → type-check → unit test → build (mọi bước verify xanh local)
- [x] lint — fix `eslint-config-custom` (extends `plugin:@typescript-eslint/recommended`) + đổi `.eslintrc.js`→`.eslintrc.cjs` cho widget/admin (`type:module`); bỏ `--max-warnings 0` → CI fail trên _error_, không chặn trên _warn_ (`any` cố ý là warn, xem CLAUDE.md). Còn ~25 `any` warnings non-blocking để cleanup dần. Backend `lint` bỏ `--fix` (thêm `lint:fix` riêng cho local)
- [ ] Branch protection: require CI pass trước khi merge — _bật trong GitHub repo settings (việc của bạn)_

### Critical-path tests

- [x] Backend e2e (`apps/backend/test/chat-flow.e2e-spec.ts`, 2 tests pass): register → workspace → website → API key (REST) + widget→admin realtime (WS connect → createConversation → sendMessage → admin nhận `receiveMessage`). Chạy app thật (`app.listen(0)`) + socket.io-client. Test DB `chat_widget_test` (tách khỏi dev) tự tạo+sync qua `prisma db push` ở `globalSetup`; `setup-e2e.ts` ép `DATABASE_URL`/`JWT_SECRET` trước khi app load. CI: job `e2e-backend` với Postgres service (env `DATABASE_URL_TEST`).
- [x] Backend unit (6 tests pass):
  - [x] `WebsitesService.validateApiKey` (valid / wrong-domain / invalid)
  - [x] `AuthService.login` (correct / wrong password / non-existent)
- [x] Widget Playwright (2 tests pass, chromium): demo mode open → welcome → send → auto-reply; non-demo pre-chat form render + name validation. Setup: `apps/widget/playwright.config.ts` + `e2e/host.html` (expose `window.ChatWidget`, không auto-mount) + `e2e/widget.spec.ts`; webServer tự khởi động Vite; CI job riêng `e2e-widget`.
  - ✅ **Bug phát hiện qua test → đã fix**: `getWidgetCSS()` trong `src/widget.tsx` (Shadow DOM) từng là subset Tailwind viết tay, **thiếu `.bottom-16`/`.right-0`** → cửa sổ chat của bản **IIFE embed thật** lệch khỏi viewport (dev `main.tsx` không lộ vì render ngoài Shadow DOM). **Fix**: thay bằng Tailwind compiled `import widgetCss from "./index.css?inline"` inject vào shadow root (xem `apps/widget/docs/README.md` › Shadow DOM). Verify: build inline đủ class (`.bottom-16{bottom:4rem}`, `.right-0{right:0}`); test đổi sang **click nút "Gửi" thật** (nút giờ trong viewport) — 2 tests vẫn pass.

### Onboard beta user

- [ ] Chuẩn bị landing page có CTA signup
- [ ] Tìm 3-5 user (cá nhân, dự án nhỏ, ưu tiên có website thật)
- [ ] Onboarding doc / video ngắn
- [ ] Google Form feedback (UX issues, missing features, bugs)
- [ ] Setup analytics (Plausible/Umami free) cho landing
- [ ] Tuần 1: monitor Sentry, fix critical bugs
- [ ] Tuần 2: tổng hợp feedback → quyết định phase 5 (Stripe? More features?)

### Verify Phase 4

- [x] CI green trên main (run #26875122589: `ci` + `e2e-widget` + `e2e-backend` ✅)
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
