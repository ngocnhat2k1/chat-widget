# Admin Dashboard — `apps/admin-dashboard`

React SPA, **TanStack Router file-based**, TanStack Query cho server state, Tailwind cho styling.

**Status:** Active
**Last updated:** 2026-05-29

---

## Routing

File-based qua TanStack Router. Route files trong `src/routes/`.

⚠️ **`src/routeTree.gen.ts` là auto-generated** — plugin Vite tự sinh mỗi lần dev/build. KHÔNG sửa tay.

Nhóm route:

- `_authenticated/*` — yêu cầu JWT
- `login`, `register` — public

---

## Key files

| File                                  | Trách nhiệm                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/contexts/auth-context.tsx`       | `AuthContext` — login/register/logout; JWT trong localStorage; auto-validate token khi load |
| `src/lib/api-client.ts`               | Axios singleton; all CRUD endpoints; interceptor gắn JWT + redirect login khi 401           |
| `src/hooks/api.ts`                    | React Query hooks (stale 5 phút)                                                            |
| `src/components/dashboard-layout.tsx` | Layout chính với sidebar                                                                    |

---

## ⚠️ Duplicate routes (technical debt)

Hiện có cả `src/pages/` (vd `LoginPage.tsx`) **VÀ** `src/routes/` (vd `login.tsx`). Đang migrate dở.

- **Khi thêm mới**: dùng `src/routes/` (file-based convention).
- **Khi sửa**: kiểm tra version nào đang được import (route tree dùng `src/routes/`).
- **Cleanup**: Phase 2.1 trong [ROADMAP](../../../docs/ROADMAP.md).

---

## Build + run

```bash
pnpm dev          # Vite dev, port 5174
pnpm build        # → dist/ (SPA)
pnpm preview      # serve build
```

---

## Feature docs

Per-feature documentation (theo rule trong CLAUDE.md): `docs/features/<feature>.md`. Sẽ được tạo khi feature được build/sửa.
