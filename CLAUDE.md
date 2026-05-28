# CLAUDE.md — Chat Widget Service

pnpm monorepo cho **live chat widget SaaS**. Customer nhúng widget vào website của họ, admin quản lý hội thoại qua dashboard.

**Status**: ~60% — xem [docs/ROADMAP.md](docs/ROADMAP.md) và [docs/CHECKLIST.md](docs/CHECKLIST.md).

## Apps

| Path | Mô tả | Docs |
|---|---|---|
| [`apps/backend`](apps/backend) | NestJS API + Socket.IO | [apps/backend/docs/README.md](apps/backend/docs/README.md) |
| [`apps/widget`](apps/widget) | Embeddable React widget (IIFE + Shadow DOM) | [apps/widget/docs/README.md](apps/widget/docs/README.md) |
| [`apps/admin-dashboard`](apps/admin-dashboard) | Admin SPA (TanStack Router) | [apps/admin-dashboard/docs/README.md](apps/admin-dashboard/docs/README.md) |

**Packages**: `packages/ui` (Button + cn), `packages/eslint-config-custom`, `packages/tsconfig`.

**Docs hub**: [`docs/`](docs/) — roadmap, checklist, architecture, feature template.

---

## Tech Stack

| Layer | Tech |
|---|---|
| FE framework | React 18 + TypeScript strict |
| Admin routing | TanStack Router (file-based) |
| Server state | TanStack Query v5 |
| Forms | react-hook-form + yup |
| Styling | Tailwind 3 |
| HTTP | Axios singleton + JWT interceptors |
| Real-time | Socket.IO |
| Widget bundler | Vite (IIFE, CSS inlined) |
| Backend | NestJS 10 |
| ORM | Prisma 5 — xem [docs/architecture/data-model.md](docs/architecture/data-model.md) |
| Auth | JWT 7d, localStorage |
| Validation | class-validator + class-transformer |
| Package manager | **pnpm** only |

---

## Ports

| Service | Port |
|---|---|
| Backend | 3001 |
| Widget dev | 5173 |
| Admin dev | 5174 |
| Postgres (Docker) | 5432 |

---

## Quick start

Đầy đủ: [GETTING_STARTED.md](GETTING_STARTED.md). Tóm tắt:

```bash
pnpm install
./start-dev.sh        # all services
```

---

## Code Conventions

- **Naming**: components PascalCase, files kebab/camelCase, API endpoints kebab-case (`/api/auth/login`), Prisma model PascalCase.
- **TypeScript strict** mọi app. Tránh `any` (ESLint warn).
- **Prettier**: 2 spaces, semi, double quotes, width 80, trailing es5, LF. Run `pnpm format` (root) trước commit.
- **ESLint**: widget/admin = `eslint-config-custom/react`, backend = `eslint-config-custom/base`. `_prefix` cho unused OK.
- **Backend DTOs**: mọi feature boundary có `dto/*.dto.ts`.

---

## Key Workflow Notes for AI Assistants

Critical rules — vi phạm sẽ break:

- **Never edit `apps/admin-dashboard/src/routeTree.gen.ts`** — auto-generated bởi TanStack Router plugin mọi dev/build.
- **Widget = IIFE single bundle** — KHÔNG dynamic import, KHÔNG code-splitting trong `apps/widget`. Output phải là một file embeddable.
- **Shadow DOM** — widget styles inject vào shadow root; global CSS không apply bên trong widget.
- **New admin routes**: tạo trong `apps/admin-dashboard/src/routes/` (file-based).
- **Backend feature pattern**: `module.ts`, `service.ts`, `controller.ts`, `dto/feature.dto.ts`, register trong `app.module.ts`.
- **Prisma schema thay đổi** → `pnpm prisma migrate dev` + `pnpm prisma generate` trước khi TS types update.
- **pnpm only** — không npm/yarn.
- **Format**: `pnpm format` từ root trước commit.

### Known gaps (open work, planned)

- No tests, no CI/CD — Phase 4 trong [ROADMAP](docs/ROADMAP.md).
- Duplicate `src/pages/` ↔ `src/routes/` trong admin — dùng `src/routes/`. Cleanup ở Phase 2.1.

---

## Documentation Maintenance (RULES)

Project tracks long-term work trong [`docs/`](docs/). Keep sync as work happens.

### Files

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — strategic, _why_ behind phases. Update khi scope/timeline thay đổi hoặc phase complete.
- [`docs/CHECKLIST.md`](docs/CHECKLIST.md) — tactical TODO. Tick `[x]` **immediately** khi xong (don't batch). Update "Last updated" date.

### Per-feature docs (FE + BE)

Mọi feature non-trivial có docs riêng. Template: [`docs/_FEATURE_DOC_TEMPLATE.md`](docs/_FEATURE_DOC_TEMPLATE.md).

| App | Location |
|---|---|
| Backend module | `apps/backend/src/<feature>/docs/README.md` |
| Widget feature | `apps/widget/docs/features/<feature>.md` |
| Admin feature | `apps/admin-dashboard/docs/features/<feature>.md` |
| Cross-cutting | `docs/architecture/<topic>.md` |

### When finishing a task (AI checklist)

BEFORE declaring done:

1. **Tick CHECKLIST.md** nếu task map vào item trong checklist; update "Last updated".
2. **Update ROADMAP.md** nếu phase complete.
3. **Create/update feature doc** nếu add/change feature substantial (new behavior, new endpoint, new schema field, new UX).
4. **List doc files updated** trong end-of-turn summary.

Skip docs cho: typo fixes, single-line tweaks, dep bumps, formatting/lint.

### When user requests non-trivial work not in checklist

Propose add vào [`docs/CHECKLIST.md`](docs/CHECKLIST.md) BEFORE starting để track được.
