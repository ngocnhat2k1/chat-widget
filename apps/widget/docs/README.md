# Widget — `apps/widget`

Embeddable React chat widget. **IIFE single bundle** với CSS inlined, render vào **Shadow DOM** để cô lập style.

**Status:** Active
**Last updated:** 2026-05-29

---

## Key files

| File             | Trách nhiệm                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `src/widget.tsx` | `ChatWidgetManager` class, đăng ký `window.ChatWidget` global, đọc config từ `<script>` data-attrs |
| `src/App.tsx`    | `ChatWidget` React component, handle connection/messages/theming                                   |
| `src/api.ts`     | `ChatAPI` class wrap Socket.IO, quản lý visitor ID trong localStorage                              |
| `src/config.ts`  | `WidgetConfig` interface + defaults                                                                |

---

## Embedding

### Script tag (chính)

```html
<script
  src="https://widget.yourapp.com/widget.js"
  data-chat-widget-api-key="YOUR_KEY"
  data-chat-widget-domain="yourdomain.com"
></script>
```

### Programmatic mount

```js
window.ChatWidget.mount("container-id", {
  apiKey: "...",
  position: "bottom-right",
});
```

### Config attributes

- `data-chat-widget-api-key` (required)
- `data-chat-widget-domain` (required) — phải khớp `Website.domain` server-side
- `data-chat-widget-color`
- `data-chat-widget-position` (`bottom-left` | `bottom-right`)
- `data-chat-widget-welcome`

---

## Bundle

Vite config:

- **IIFE output** (KHÔNG dùng dynamic import / code-splitting — phải single file)
- CSS inlined vào JS
- Terser minify, strip `console.*`
- Output: `dist/widget.iife.js`

```bash
pnpm build:widget
```

---

## Shadow DOM

Widget render vào Shadow root → CSS bên ngoài không leak vào, và ngược lại. Global stylesheet (document `<head>`) KHÔNG áp dụng bên trong shadow root, nên Tailwind phải được inject thẳng vào shadow root.

Cách làm (`src/widget.tsx`): import **Tailwind đã compile** dưới dạng string qua `import widgetCss from "./index.css?inline"` rồi gán vào `<style>` của shadow root. `?inline` cho ra đúng CSS mà Vite/PostCSS sinh từ `index.css` (Tailwind scan `src/**` trong `tailwind.config.js`), nên mọi class mà `App.tsx` dùng đều có mặt.

> ⚠️ Trước đây chỗ này là một **subset Tailwind viết tay** (`getWidgetCSS()`). Nó thiếu class (vd `.bottom-16`, `.right-0`) khiến cửa sổ chat của bản IIFE bị lệch khỏi viewport — bản dev (`main.tsx`, render ngoài shadow DOM) không lộ. Bug này bị bắt bởi Playwright e2e (click nút "Gửi" → off-screen). Đừng quay lại subset thủ công; luôn dùng CSS compiled.

---

## Visitor identification

- Stored trong `localStorage` key `chat_widget_visitor_id`
- Sinh client-side khi visitor truy cập lần đầu
- Server dùng `visitorId` để link conversation across sessions

---

## Pre-chat form

- Hỏi name + email trước khi mở chat
- Skip nếu visitor đã có trong localStorage

---

## Demo mode

`data-chat-widget-demo="true"` → widget chạy standalone không cần backend, mock auto-reply. Dùng để preview UI hoặc dev frontend offline.

---

## Feature docs

Per-feature documentation (theo rule trong CLAUDE.md): `docs/features/<feature>.md`. Sẽ được tạo khi feature được build/sửa (Phase 2 sẽ có nhiều: customize UI, file upload, visitor info capture).
