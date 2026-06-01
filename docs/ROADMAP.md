# Roadmap — Chat Widget Service

> **Tài liệu chiến lược.** Giải thích _tại sao_ và _làm gì_ ở mỗi phase. Việc tick off cụ thể nằm trong [CHECKLIST.md](CHECKLIST.md).
> **Last updated:** 2026-05-29
> **Current phase:** Phase 0-3 ✅ (deploy + landing + /docs) + Phase 4 đang làm (Swagger + CI + unit tests ✅) → còn e2e/Playwright, onboard 3-5 beta user, verify production qua browser

---

## Mục tiêu

Ship **public beta** trong 6-8 tuần — deploy thật trên Vercel + Render, có 3-5 beta user dùng thật, có docs để tự nhúng được. **Chưa cần Stripe/billing** ở phase này.

**Bối cảnh:** Solo developer học fullstack — chấp nhận chậm để làm đúng cách, mỗi phase đều phải hiểu được "tại sao".

---

## Hiện trạng codebase (~60%)

### ✅ Đã có

- **Backend**: auth (JWT), websites + API key CRUD, conversations + messages (REST + WS), analytics, Prisma 5 model cơ bản
- **Widget**: Shadow DOM, pre-chat form, typing indicators, read receipts, customization (color/position), demo mode, IIFE bundle
- **Admin**: login/register, dashboard charts, websites CRUD, live inbox với real-time, analytics chi tiết

### ❌ Thiếu cho SaaS bán được

| Nhóm           | Hạng mục                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| Monetization   | Stripe, plans, quota, landing/pricing, self-serve signup                                     |
| Team & Roles   | Multi-agent, OWNER/ADMIN/AGENT, invitation, assignment                                       |
| Customer comms | Email noti, file upload, push, sound, office hours                                           |
| UX             | Customize UI có preview, copy embed code, canned replies, tags, search, visitor info, export |
| Production     | Tests, CI/CD, rate limit, Swagger, Sentry, deploy scripts                                    |
| Data model     | Workspace/Organization (hiện User trực tiếp own Website → cản trở team)                      |

### ⚠️ Cần lưu ý

- Duplicate routes: `apps/admin-dashboard/src/pages/` vs `src/routes/` — đang migrate dở
- ~~Schema thiếu `Workspace`, `Membership`~~ → ✅ thêm ở Phase 1. Còn thiếu `Plan`, `Invitation`, `Attachment`, `Tag` (phase sau)
- ~~Dev SQLite vs prod Postgres → enum behavior khác nhau~~ → ✅ Đã giải quyết ở Phase 0: dev dùng Postgres + native enum (`ConversationStatus`, `SenderType`)

---

## Roadmap tổng quan

| Phase | Mục tiêu                                                                        | Tuần | Trạng thái                                                     |
| ----- | ------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------- |
| 0     | Dev environment alignment (SQLite → Postgres)                                   | <1   | ✅ Hoàn thành (2026-05-29)                                     |
| 1     | Workspace foundation + dynamic CORS + WS auth                                   | 2-3  | ✅ Hoàn thành (2026-05-29)                                     |
| 2     | MVP polish (customize UI, file upload, email, visitor info, Sentry, rate limit) | 2    | ✅ Hoàn thành (2026-06-01)                                     |
| 3     | Deploy (Vercel + Render + landing + docs)                                       | 1    | ✅ Hoàn thành (2026-06-01)                                     |
| 4     | Beta validation (Swagger, CI, smoke tests, onboard user)                        | 1-3  | 🔄 Đang làm (Swagger+CI+unit ✅; còn e2e/Playwright + onboard) |

> Phase 1 đụng vào auth + mọi service + WS gateway + admin client → realistic 2-3 tuần cho solo, không phải 1-2. Đừng coi slippage là thất bại.

---

## Phase 0 — Dev environment alignment

**Tại sao**: Dev đang dùng SQLite, prod sẽ là PostgreSQL. SQLite không có native enum nên code đang xài `String` workaround — Postgres có native enum. Khác biệt này sẽ tạo bug surprise khi deploy. Sửa _trước_ Phase 1 vì Phase 1 sẽ thêm enum `Role` mới — không muốn làm 2 lần.

**Lợi ích cho việc học**: Dev = prod environment → hiểu được cách Prisma generate khác nhau giữa các DB, debug realistic.

**Việc làm chính**:

- Start Postgres qua `docker-compose.yml` (đã có sẵn)
- Đổi `provider` trong `schema.prisma` → `postgresql`
- Chuyển các field String (status, senderType) → native Prisma enum
- Reset migrations, viết lại từ đầu (chưa có data prod, an toàn)
- Update seed

---

## Phase 1 — Workspace Foundation

**Tại sao**: Hiện `User → Website` (1:M) trực tiếp. Khi thêm multi-agent sau này phải migrate data thật → đau. Làm SỚM lúc chưa có user nào là rẻ nhất. Schema xong → UI invite/role làm sau cũng OK.

**Schema mới**:

```prisma
Workspace { id, name, slug, memberships, websites }
Membership { userId, workspaceId, role (OWNER|ADMIN|AGENT) }
Website { workspaceId } // bỏ userId
```

**Khi register**: auto-create Workspace + Membership(OWNER) trong cùng transaction.

**Auth/JWT**:

- JWT chỉ chứa `userId` (giữ stateless)
- REST: header `X-Workspace-Id` + `WorkspaceGuard` check membership
- WS không gửi được custom header → workspace qua `socket.handshake.auth.workspaceId`
- WS widget: `handshake.auth = { apiKey, domain }` → server resolve workspaceId qua ApiKey → Website

**Dynamic CORS (làm cùng Phase 1)**:

- Widget nhúng trên domain tuỳ ý → không thể list cứng `CORS_ORIGINS`
- Middleware: nhận `Origin`, lookup `Website.domain` qua API key, allow nếu khớp
- Admin dashboard origin: vẫn fixed list trong env

**KHÔNG làm ở Phase 1**: Invitation flow, role-based UI permissions (schema sẵn sàng, UI sau).

---

## Phase 2 — MVP Polish

Các tính năng tối thiểu để beta user dùng được thật:

| #   | Tính năng                                           | Tại sao                                            |
| --- | --------------------------------------------------- | -------------------------------------------------- |
| 2.1 | Xoá duplicate `src/pages/`                          | Tránh confusion, tech debt                         |
| 2.2 | Widget customize UI có live preview                 | Customer cần đổi màu/welcome msg mà không sửa code |
| 2.3 | Embed code copy UI (HTML/React/WordPress tabs)      | Customer cần copy nhanh để nhúng                   |
| 2.4 | Visitor info capture (UA, page, referrer, timezone) | Admin cần context khi reply                        |
| 2.5 | File upload (image only, Cloudinary)                | Visitor cần share screenshot                       |
| 2.6 | Email noti offline (Resend)                         | Admin không thể online 24/7                        |
| 2.7 | Rate limiting (`@nestjs/throttler`)                 | Chống brute force + spam                           |
| 2.8 | Sentry FE + BE                                      | Track lỗi production                               |
| 2.9 | Sound + browser noti admin inbox                    | Admin biết có msg khi tab background               |

**Config merge order** cho widget:

1. `Website.widgetConfig` (server baseline, admin set)
2. `<script data-...>` attributes (per-page override, customer dev set)
3. Render: `{ ...baseline, ...dataAttrs }` — dataAttrs thắng

**Presence tracking** cho offline noti: in-memory `Map<workspaceId, Set<socketId>>`. Đủ cho beta single-instance. Scale >1 instance → Redis (sau).

---

## Phase 3 — Deploy

| Service         | Hạ tầng       | Note                                                                        |
| --------------- | ------------- | --------------------------------------------------------------------------- |
| Backend + DB    | Render        | Cảnh báo: free Postgres bị xoá ngày 90, **khuyến nghị trả $7/tháng từ đầu** |
| Widget (IIFE)   | Vercel static | `Cache-Control: public, max-age=3600, s-maxage=86400`                       |
| Admin Dashboard | Vercel        | `vercel.json` đã có, verify config monorepo pnpm                            |

**Public routes** (thêm vào admin-dashboard):

- `/` — landing page (hero, features, pricing "Coming soon", embed preview)
- `/docs` — integration guide (HTML/React/WordPress), link sang Swagger

---

## Phase 4 — Beta Validation

- **Swagger** `/api/docs` (chỉ enable nếu `NODE_ENV !== production` hoặc basic auth)
- **CI** GitHub Actions: install → format:check → lint → type-check → build
- **Critical-path tests**:
  - Backend e2e: register → workspace → website → API key → WS connect → send msg → admin receive
  - Backend unit: `validateApiKey`, `login`
  - Widget Playwright: open → pre-chat form → send → auto-reply (demo mode)
- **Onboard 3-5 beta user** với form feedback đơn giản → iterate 2 tuần

---

## Out of scope cho beta

| Hạng mục                               | Khi nào làm                                       |
| -------------------------------------- | ------------------------------------------------- |
| Stripe + plans + quotas                | Có 5+ active beta user và thấy người sẵn sàng trả |
| Multi-agent invitation UI              | Sau Phase 4 khi có yêu cầu thực                   |
| Conversation assignment, routing, tags | Khi user phàn nàn về workflow                     |
| Auto-response / chatbot / AI           | Product v2                                        |
| Mobile app                             | PWA admin tạm đủ                                  |
| File upload non-image, video, voice    | Khi user thực sự cần                              |

---

## Verification end-to-end

Smoke test sau mỗi phase:

1. **Phase 0**: backend boot với Postgres → seed chạy ngon → enum hoạt động native.
2. **Phase 1**: register → workspace auto-tạo → API key → seed.
3. **Phase 2**: nhúng widget HTML test → customize UI đổi màu → preview update → upload image → admin tab khác nghe sound + thấy visitor info.
4. **Phase 3**: deploy → từ máy khác nhúng widget vào website thật → chat → admin reply → offline thì nhận email.
5. **Phase 4**: invite 3 user → 1 tuần xem Sentry/analytics → fix top 3 bug.

---

## Files chính sẽ động vào

**Backend**: `prisma/schema.prisma`, `src/auth/`, `src/websites/`, `src/conversations/`, `src/analytics/`. Module mới: `src/workspaces/`, `src/memberships/`, `src/uploads/`, `src/notifications/`.

**Widget**: `src/api.ts`, `src/App.tsx`, `src/config.ts`, `src/widget.tsx`.

**Admin Dashboard**: xoá `src/pages/`, update `src/lib/api-client.ts`, thêm `src/contexts/WorkspaceContext.tsx`. Routes mới: `settings/workspace`, `websites/$id/customize`, public `/`, `/docs`.

**Infra**: verify `vercel.json`. Mới: `render.yaml`, `.github/workflows/ci.yml`, `apps/backend/.env.example`.
