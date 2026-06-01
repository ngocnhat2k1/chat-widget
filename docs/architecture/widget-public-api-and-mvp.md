# Widget public API + MVP polish (Phase 2)

> Cross-cutting reference for the public widget surface and the Phase 2 features.
> Per-item status + env: [CHECKLIST.md](../CHECKLIST.md) §Phase 2. Env keys: [apps/backend/.env.example](../../apps/backend/.env.example).

## Public (unauthenticated) backend endpoints

The widget runs on arbitrary customer domains, so these are **public**, gated by
API key / rate limit, and get reflect-origin CORS via `WidgetCorsMiddleware`
(applied to `api/widget` + `api/uploads`):

| Endpoint                         | Purpose                              | Gate                                                          |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| `GET /api/widget/config?apiKey=` | Widget baseline config (2.2)         | valid API key → 404 otherwise                                 |
| `POST /api/uploads/image`        | Image upload → `{ url, type }` (2.5) | 5MB + mime + `sharp` dims; 10/min/IP; 503 if Cloudinary unset |

Everything else stays admin-only (`JwtAuthGuard` + `WorkspaceGuard`, fixed
`ADMIN_CORS_ORIGINS`).

## Widget config merge (2.2)

`Website.widgetConfig` (Json) holds `{ primaryColor, position, welcomeMessage, agentName, theme }`.

- Admin edits it at `/websites/$id/customize` (PATCH `/api/websites/:id/widget-config`, merges into existing). Live preview is a React mock (`WidgetPreview`) — instant, no iframe/postMessage.
- Widget, on auto-mount, fetches the baseline (`fetchServerConfig`) and merges:
  **`DEFAULT_CONFIG` < server baseline < `data-*` attributes`**. Only `data-*`
  attributes the customer actually set override (so admin settings aren't masked
  by re-introduced defaults).

## Realtime presence + offline email (2.6)

- Gateway keeps an in-memory `Map<workspaceId, Set<socketId>>`, updated when an
  admin socket connects/disconnects (single-instance beta; → Redis when scaling).
- Visitor message → `hasOnlineAdmin(workspaceId)` → if none, `NotificationsService.notifyOfflineAgents`
  emails every workspace member (Resend), with a 5-min per-conversation cooldown.
  No-op without `RESEND_API_KEY` + `EMAIL_FROM`.

## Attachments (2.5)

`Message.attachmentUrl` / `attachmentType`. The widget uploads via REST, then the
WS `sendMessage` carries the URL; both widget and admin render image bubbles.

## Other Phase 2 items

- **2.4 Visitor info** — widget sends UA/lang/screen/referrer/page/timezone on
  `createConversation` → `Conversation.metadata` (Json) → admin side panel.
- **2.7 Rate limiting** — global `ThrottlerGuard` 100/min/IP; auth 5/min; uploads 10/min.
- **2.8 Sentry** — `instrument.ts` (backend) + `@sentry/react` (admin) + `@sentry/browser`
  (widget, no PII / no breadcrumbs). All DSN-guarded no-ops.
- **2.9 Admin alerts** — Web Audio beep + `Notification` when tab backgrounded;
  toggle in workspace settings (`lib/notifications.ts`).
- **2.1** — removed duplicate `src/pages/` (inlined into TanStack route files).

## Config that needs keys to go live

`CLOUDINARY_*` (2.5), `RESEND_API_KEY` + `EMAIL_FROM` (2.6), `SENTRY_DSN` /
`VITE_SENTRY_DSN` (2.8), optional `VITE_WIDGET_URL` (embed snippet base). All are
**no-op/feature-disabled when unset** — the app runs fine without them.
