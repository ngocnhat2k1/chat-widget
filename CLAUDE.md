# CLAUDE.md — Chat Widget Service

## Project Overview

This is a **pnpm monorepo** for a live chat widget service. It provides an embeddable JavaScript widget, an admin dashboard, and a backend API.

**Current state**: ~60% complete (Step 6 in progress — see `STEP_6_PROGRESS.md`).

---

## Repository Structure

```
chat-widget/
├── apps/
│   ├── backend/          # NestJS API + Socket.IO WebSocket server
│   ├── widget/           # Embeddable React chat widget (Vite, IIFE bundle)
│   └── admin-dashboard/  # React admin interface (Vite + TanStack Router)
├── packages/
│   ├── ui/               # Shared React component library (tsup)
│   ├── eslint-config-custom/  # Shared ESLint config
│   └── tsconfig/         # Shared TypeScript configs (base, nestjs, react-library)
└── *.md                  # Documentation and step progress files
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Admin routing | TanStack Router (file-based, `src/routes/`) |
| Server state | TanStack Query (React Query v5) |
| Forms | react-hook-form + yup |
| Styling | Tailwind CSS 3 |
| HTTP client | Axios singleton with JWT interceptors |
| Real-time | Socket.IO (client + server) |
| Widget bundler | Vite (IIFE output, inlined CSS) |
| Backend framework | NestJS 10 |
| ORM | Prisma 5 (SQLite dev / PostgreSQL prod) |
| Auth | JWT (7-day expiry, localStorage) |
| Validation | class-validator + class-transformer |
| Package manager | pnpm (workspaces) |
| Shared components | `packages/ui` — exported as ESM + CJS |

---

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start all services

```bash
./start-dev.sh       # all services
./start-admin.sh     # admin dashboard only
```

### Individual app dev servers

```bash
# Backend (port 3001)
cd apps/backend && pnpm dev

# Widget (port 5173)
cd apps/widget && pnpm dev

# Admin Dashboard (port 5174)
cd apps/admin-dashboard && pnpm dev
```

### Database

```bash
cd apps/backend
pnpm prisma migrate dev   # run migrations
pnpm db:seed              # seed sample data
```

Docker for PostgreSQL:

```bash
docker-compose up -d      # starts Postgres on port 5432
```

---

## Build

```bash
# Widget (IIFE bundle, embeddable)
cd apps/widget && pnpm build:widget

# Admin Dashboard (SPA)
cd apps/admin-dashboard && pnpm build

# Backend
cd apps/backend && pnpm build

# Shared UI package
cd packages/ui && pnpm build
```

---

## Port Assignments

| Service | Port |
|---|---|
| Backend API | 3001 |
| Widget dev server | 5173 |
| Admin Dashboard | 5174 |
| PostgreSQL (Docker) | 5432 |

---

## Code Conventions

### Naming

- **React components**: PascalCase (`ChatWidget`, `LoginPage`)
- **Files**: kebab-case or camelCase (`dashboard-layout.tsx`, `api-client.ts`)
- **Prisma models**: PascalCase; table names are snake_case (`User` → `users`)
- **API endpoints**: kebab-case (`/api/auth/login`, `/api/websites`)

### TypeScript

- Strict mode enabled across all apps
- All feature boundaries use DTOs (`dto/*.dto.ts`)
- Prefer explicit types over `any`; `any` triggers an ESLint warning

### Prettier (enforced)

- Tab width: 2
- Semicolons: true
- Quotes: double (`"`)
- Print width: 80
- Trailing commas: es5
- Line endings: LF

Run formatter: `pnpm format` (root)
Check only: `pnpm format:check`

### ESLint

- Widget & Admin: `eslint-config-custom/react`
- Backend: `eslint-config-custom/base`
- Unused variables prefixed with `_` are allowed

---

## Application Details

### `apps/widget`

The embeddable chat widget renders into a **Shadow DOM** to avoid style leakage.

Key files:
- `src/widget.tsx` — `ChatWidgetManager` class; registers `window.ChatWidget` global; reads config from `<script>` data attributes
- `src/App.tsx` — `ChatWidget` React component; handles connection, messages, theming
- `src/api.ts` — `ChatAPI` class wrapping Socket.IO; manages visitor ID in localStorage
- `src/config.ts` — `WidgetConfig` interface and defaults

Widget embedding:
```html
<script
  src="/widget.js"
  data-chat-widget-api-key="YOUR_KEY"
  data-chat-widget-domain="yourdomain.com"
></script>
```

Or programmatically:
```js
window.ChatWidget.mount('container-id', { apiKey: '...', position: 'bottom-right' });
```

Vite config produces an **IIFE bundle** with inlined CSS and Terser minification (console statements stripped).

### `apps/admin-dashboard`

Single-page app with file-based routing via TanStack Router. Route files live in `src/routes/`; `src/routeTree.gen.ts` is **auto-generated** — do not edit manually.

Key files:
- `src/contexts/auth-context.tsx` — `AuthContext`; login/register/logout; JWT stored in localStorage; auto-validates token on load
- `src/lib/api-client.ts` — Axios singleton; all CRUD endpoints; interceptors attach JWT and redirect to login on 401
- `src/hooks/api.ts` — React Query hooks (5-minute stale time)
- `src/components/dashboard-layout.tsx` — main layout with sidebar

> Note: There are duplicate page components in `src/pages/` (e.g., `LoginPage.tsx` alongside `login.tsx`). The `src/routes/` + `src/pages/` split is in transition — prefer adding new pages under `src/routes/`.

### `apps/backend`

NestJS modular architecture. Each domain is a self-contained module:

```
auth/         – login, register, JWT strategy, guard, @GetUser() decorator
websites/     – CRUD + API key validation
conversations/– conversation lifecycle
chat/         – message storage (REST) + WebSocket gateway
analytics/    – stats calculation
prisma/       – shared PrismaService module
```

WebSocket events (Socket.IO):
- `createConversation` — widget opens a new chat
- `joinConversation` — admin/widget joins a room (`conversation:{id}`)
- `sendMessage` — broadcast to room members
- `leaveConversation`
- `receiveMessage` — emitted to subscribers

Auth:
- Widget connects using API key (`data-chat-widget-api-key`)
- Admin uses JWT Bearer token

CORS is configured in `src/main.ts`. Validation pipe is global. Logger is used via NestJS `Logger`.

### `packages/ui`

Shared React component library built with tsup. Exports:
- `Button` — reusable button component
- `cn` utility — `clsx` + `tailwind-merge`

Import in apps:
```ts
import { Button, cn } from '@chat-widget/ui';
```

---

## Database Schema (Prisma)

Models: `User`, `Website`, `ApiKey`, `Conversation`, `Message`

- Dev: SQLite (`apps/backend/prisma/dev.db`)
- Prod: PostgreSQL (set `DATABASE_URL` env var; run Docker Compose)

Migration workflow:
```bash
pnpm prisma migrate dev --name <migration-name>
pnpm prisma generate
```

---

## Environment Variables

Create `apps/backend/.env`:

```env
DATABASE_URL="file:./dev.db"          # SQLite (dev)
# DATABASE_URL="postgresql://chatuser:chatpass123@localhost:5432/chat_widget"
JWT_SECRET="your-jwt-secret"
PORT=3001
```

---

## Testing

**Status**: Jest and Supertest are installed in the backend but no tests are implemented yet. This is a known gap.

When adding tests:
- Backend unit tests: `apps/backend/src/**/*.spec.ts`
- Backend e2e tests: `apps/backend/test/`
- Run: `cd apps/backend && pnpm test`

---

## Known Issues / Gaps

1. **No tests** — Jest configured but no test files exist.
2. **No CI/CD** — No `.github/workflows/` directory.
3. **Duplicate components** — `src/pages/` has legacy components alongside `src/routes/`. Use `src/routes/` going forward.
4. **TypeScript config issues** — Some path/module resolution issues noted in `STEP_6_PROGRESS.md`; be careful with import paths in the admin dashboard.

---

## Key Workflow Notes for AI Assistants

- **Never edit `src/routeTree.gen.ts`** in the admin dashboard — it is auto-generated by the TanStack Router Vite plugin on every dev/build run.
- **Widget bundle is IIFE** — do not use dynamic imports or code-splitting in `apps/widget`; the output must be a single embeddable file.
- **Shadow DOM** — widget styles must use Tailwind classes injected into the shadow root; global CSS will not apply inside the widget.
- **Add new routes** in `apps/admin-dashboard/src/routes/` using the TanStack Router file-based convention (the plugin auto-generates the route tree).
- **Backend feature modules** should follow the pattern: `module.ts`, `service.ts`, `controller.ts`, `dto/feature.dto.ts`; register the module in `app.module.ts`.
- **Prisma changes** require running `pnpm prisma migrate dev` and `pnpm prisma generate` before the TypeScript types are updated.
- **pnpm** is the only package manager; do not use npm or yarn.
- **Formatting**: always run `pnpm format` from the repo root before committing.
