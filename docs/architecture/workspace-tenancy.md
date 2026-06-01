# Workspace Tenancy (Phase 1)

> Cross-cutting: multi-tenant data model + cách scope mọi request theo workspace.
> **Status:** ✅ Backend + admin UI xong, tenant isolation verified (REST 13/13 + WS 4/4). Còn smoke widget↔admin qua browser.

## Tại sao

Trước Phase 1: `User → Website` (1:M) trực tiếp, mọi thứ scope theo `userId`. Không thể có nhiều agent/team trên cùng tài sản. Phase 1 chèn **Workspace** làm tenant boundary giữa User và Website, làm sớm lúc chưa có user thật để khỏi migrate data đau về sau.

## Data model

```
User 1──M Membership M──1 Workspace 1──M Website 1──M ApiKey / Conversation
                         (role: OWNER|ADMIN|AGENT)
```

- `Workspace { id, name, slug @unique, … }`
- `Membership { userId, workspaceId, role }` với `@@unique([userId, workspaceId])` — một user một role trong một workspace.
- `Website.workspaceId` (đã bỏ `userId`). `User` không còn `websites`, thay bằng `memberships`.
- Enum `Role { OWNER ADMIN AGENT }` (native Postgres enum).

**Register** tạo `User + Workspace + Membership(OWNER)` trong một `prisma.$transaction` → mọi user luôn sở hữu ít nhất một workspace. Slug = `slugify(local-part)-<random hex>`.

## Cách workspace được resolve mỗi request

JWT vẫn chỉ chứa `userId` (stateless, cho phép user thuộc nhiều workspace + switch không cần đổi token). Workspace là **context động**:

| Kênh                                | Nguồn workspace                     | Validation                                                          |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| REST (admin)                        | header `X-Workspace-Id`             | `WorkspaceGuard` check Membership tồn tại                           |
| REST `/api/workspaces/:workspaceId` | route param (ưu tiên hơn header)    | như trên                                                            |
| `GET /api/workspaces`               | — (bootstrap)                       | chỉ `JwtAuthGuard`, KHÔNG WorkspaceGuard                            |
| WS admin                            | `socket.handshake.auth.workspaceId` | verify JWT → check Membership → mới join `admin:<workspaceId>`      |
| WS widget                           | `auth.{apiKey, domain}`             | `validateApiKey` → `website.workspaceId` (không bao giờ tin client) |

### Guards & decorator (`apps/backend/src/workspaces/`)

- `WorkspaceGuard` — chạy SAU `JwtAuthGuard`. Resolve workspaceId: **param `:workspaceId` trước, rồi header** (thứ tự này quan trọng — nếu header trước, một member của workspace B gửi `X-Workspace-Id: B` khi gọi `PATCH /workspaces/A` sẽ qua guard nhưng controller sửa A → **leak**, đã từng bị và đã fix). Gắn `req.workspace = { id, role }`.
- `@CurrentWorkspace("id")` — đọc `req.workspace` (decorator param).
- `WorkspaceRoleGuard([Role.OWNER, Role.ADMIN])` — mixin, chạy sau WorkspaceGuard, gate theo role. Dùng cho `PATCH /api/workspaces/:workspaceId`.

Apply: `@UseGuards(JwtAuthGuard, WorkspaceGuard)` trên controllers websites / conversations / analytics. Mỗi module có `WorkspaceGuard` trong `providers` để DI resolve.

### Service scope

Mọi query admin-facing đổi từ `userId` → `workspaceId`:

- `WebsitesService`: `where: { workspaceId }`
- `ConversationsService` / `AnalyticsService`: `where: { website: { workspaceId } }`
- WS gateway: room `admin:<workspaceId>` (trước là `admin:<userId>`); helper `resolveWorkspaceId`.

> Đã xoá `chat.controller.ts` (REST `/conversations`): dead code (client dùng `/api/conversations` + WS), và `getWebsiteConversations(websiteId)` không check ownership → cross-tenant leak.

## CORS (Phase 1 phần đã làm)

- HTTP API chỉ admin dùng → allowlist cố định qua `ADMIN_CORS_ORIGINS` (fallback `CORS_ORIGINS`).
- WS gateway `cors.origin: true` (reflect) vì widget nhúng domain bất kỳ. **Bảo mật thật = apiKey+domain validation** trong handshake (`validateApiKey` check `website.domain === domain`), không phải CORS.
- Hoãn: `WidgetCorsMiddleware` lookup-per-request cho route HTTP `/api/widget/*` — chưa có route nào (làm ở Phase 2.2 khi có widget config endpoint).

## Admin client (`apps/admin-dashboard/src/`)

- `contexts/workspace-context.tsx` — sau login fetch `GET /api/workspaces`, chọn `currentWorkspaceId` (localStorage hoặc workspace đầu), persist localStorage. `switchWorkspace` đổi + `queryClient.invalidateQueries()`.
- `lib/api-client.ts` — request interceptor gắn `X-Workspace-Id` từ localStorage; methods `getWorkspaces`/`getWorkspace`/`updateWorkspace`.
- `lib/socket.ts` — `connect(token, workspaceId)` gửi workspaceId qua `auth`.
- `dashboard-layout.tsx` — gate render đến khi có `currentWorkspaceId` (tránh fire request scoped khi chưa có context → 403); reconnect socket khi đổi workspace; `WorkspaceSwitcher` dropdown ở header.
- Route `/_authenticated/settings/workspace` — form đổi tên/slug (chỉ OWNER/ADMIN).

## Tenant isolation — đã verify (mục tiêu chính)

REST (13 checks): B không list/đọc/sửa được website/analytics/workspace của A; thiếu header → 403; token A + header B → 403.
WS (4 checks): admin socket token A + `workspaceId=B` → disconnect; thiếu workspaceId → disconnect; token rác → disconnect; đúng workspace → connected.

## Hoãn sang sau (schema đã sẵn)

- Module `memberships/` + invitation flow + role-based UI permissions.
- `resolveWebsiteByApiKey` + in-memory cache 60s (tối ưu hiệu năng).
- Per-domain `WidgetCorsMiddleware` (Phase 2 cùng widget HTTP routes).
