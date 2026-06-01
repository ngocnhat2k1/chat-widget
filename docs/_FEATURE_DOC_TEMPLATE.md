# Feature: <Name>

> Copy this template when adding a new feature. Save as:
>
> - **Backend module**: `apps/backend/src/<feature>/docs/README.md`
> - **Widget feature**: `apps/widget/docs/features/<feature>.md`
> - **Admin feature**: `apps/admin-dashboard/docs/features/<feature>.md`
> - **Cross-cutting topic**: `docs/architecture/<topic>.md`
>
> Delete this blockquote after copying.

**Status:** Active | Experimental | Deprecated
**Last updated:** YYYY-MM-DD
**Related**: [link to roadmap section / related features / external resources]

---

## What it does

Tóm tắt 2-3 câu, viết cho người mới đọc code. Tính năng này giải quyết vấn đề gì cho user? Ai dùng nó?

## How it works

Tổng quan kỹ thuật:

- **Key files**: liệt kê 3-5 file quan trọng nhất với đường dẫn tương đối
- **Data flow**: data đi từ đâu đến đâu (1 đoạn ngắn hoặc bullet list)
- **External dependencies**: API, library, service bên ngoài (vd: Resend, Cloudinary, Stripe)
- **Schema impact**: model/field Prisma liên quan (nếu có)

```
Ví dụ data flow:
Widget → POST /api/widget/config → resolveByApiKey() → Website.widgetConfig → return JSON → merge với data-attrs → render
```

## Decisions + why

Những quyết định không-hiển-nhiên khi build, để người sau hiểu lý do:

- **Chọn X thay vì Y** — vì <lý do>. Tradeoff đã chấp nhận: <tradeoff>.
- **Pattern Z** — vì <constraint hoặc preference>.

> Đây là phần quan trọng nhất. Code chỉ nói "làm gì", phần này nói "tại sao".

## Edge cases / known issues

- Hành vi đặc biệt khi <điều kiện X>
- Limitation: chưa hỗ trợ <Y>
- Bug nhỏ đã biết: <Z>
- Things to be careful about khi modify

## TODO / future improvements

- [ ] Item 1
- [ ] Item 2

## Changelog (optional)

- YYYY-MM-DD — short note about what changed and why
