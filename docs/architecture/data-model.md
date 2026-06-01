# Data Model

> Tài liệu hệ thống mô tả schema Prisma + decisions. Update khi schema thay đổi.

**Status:** Active
**Last updated:** 2026-05-29
**Source of truth:** [`apps/backend/prisma/schema.prisma`](../../apps/backend/prisma/schema.prisma)

---

## Hiện trạng (trước Phase 1)

```
User
 ↓ (1:M)
Website ─── ApiKey (1:M, hashed)
 ↓ (1:M)
Conversation
 ↓ (1:M)
Message
```

### Models

| Model          | Fields chính                                                              | Note                                                                        |
| -------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `User`         | id, email (unique), passwordHash, timestamps                              | Owner trực tiếp Website                                                     |
| `Website`      | id, userId, domain, name, timestamps                                      | Sẽ đổi sang `workspaceId` ở Phase 1                                         |
| `ApiKey`       | id, websiteId, hashedKey, name?, createdAt, lastUsed?                     | bcrypt-hashed, raw key chỉ show 1 lần khi tạo                               |
| `Conversation` | id, websiteId, visitorId, visitorName?, visitorEmail?, status, timestamps | status hiện là `String` (SQLite workaround), sẽ thành native enum ở Phase 0 |
| `Message`      | id, conversationId, senderType, content, readAt?, createdAt               | senderType: VISITOR / AGENT / SYSTEM                                        |

**Cascade**: xoá `Website` → cascade `Conversation` + `ApiKey`. Xoá `Conversation` → cascade `Message`.

---

## Target (sau Phase 1 — Workspace foundation)

```
User
 ↓ (M:M qua Membership với role)
Workspace
 ↓ (1:M)
Website ─── ApiKey
 ↓ (1:M)
Conversation
 ↓ (1:M)
Message
```

### Models mới

```prisma
model Workspace {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  createdAt   DateTime     @default(now())
  memberships Membership[]
  websites    Website[]
}

model Membership {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        Role
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@unique([userId, workspaceId])
}

enum Role { OWNER ADMIN AGENT }
```

`Website` đổi: bỏ `userId`, thêm `workspaceId`.

**Khi register user**: auto-create Workspace + Membership(OWNER) trong cùng transaction.

---

## DB providers

| Env               | Provider                    | Lý do                                           |
| ----------------- | --------------------------- | ----------------------------------------------- |
| Dev (hiện tại)    | SQLite                      | Đơn giản, không cần Docker                      |
| Dev (sau Phase 0) | PostgreSQL local qua Docker | Match prod → tránh bug drift (vd: enum support) |
| Prod              | PostgreSQL trên Render      | Managed, có backup                              |

**Phase 0** chuyển dev sang Postgres để dev = prod environment. Cho phép dùng native Prisma enum thay vì `String` workaround.

---

## Migration workflow

```bash
# Tạo migration mới sau khi sửa schema
pnpm prisma migrate dev --name <description>

# Generate Prisma Client types
pnpm prisma generate

# Apply migration trên prod (Render)
pnpm prisma migrate deploy

# Reset DB local (mất data)
pnpm prisma migrate reset
```

---

## Decisions + why

- **API key hashed bcrypt thay vì plain text** — leak DB ≠ leak credentials. Raw key chỉ show 1 lần khi tạo.
- **`visitorId` là client-generated UUID** thay vì cookie — visitor có thể quay lại từ device khác (không cross-device) nhưng giữ persistent trong cùng browser.
- **Status enum trên Conversation** thay vì soft-delete — dễ filter, dễ analytics.
- **Cascade delete** — đơn giản hơn soft-delete cho beta. Nếu cần audit log thì add separately sau.

---

## Edge cases

- `visitorEmail` optional — visitor có thể skip pre-chat form.
- `readAt` nullable — chưa đọc = null, không phải timestamp 0.
- `Message.senderType = SYSTEM` cho welcome message / status change announcements (vd "Conversation closed by admin").

---

## TODO sau Phase 1

- [ ] Invitation model (token-based, expires)
- [ ] Tags / labels cho Conversation
- [ ] Attachment model (riêng hay merge vào Message.attachmentUrl?)
- [ ] Subscription / Plan model (Phase post-beta)
