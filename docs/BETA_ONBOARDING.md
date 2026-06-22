# Beta Onboarding Guide

> Hướng dẫn vận hành **public beta** của Chat Widget Service. Dành cho founder (vận
> hành beta) + nội dung có thể gửi trực tiếp cho beta user.
> **Last updated:** 2026-06-22

---

## 1. Production URLs

| Thành phần      | URL                                                                        |
| --------------- | -------------------------------------------------------------------------- |
| Admin dashboard | https://chat-widget-admin-dashboard.vercel.app                             |
| Đăng ký         | https://chat-widget-admin-dashboard.vercel.app/register                    |
| Docs nhúng      | https://chat-widget-admin-dashboard.vercel.app/docs                        |
| Widget bundle   | https://chat-widget-widget.vercel.app/chat-widget.iife.js                  |
| API             | https://chat-widget-api-5x5b.onrender.com (`/health`, `/api`, `/api/docs`) |

> ⚠️ **Free-tier caveats để biết trước khi mời user:**
>
> - **Backend (Render free)** ngủ sau ~15 phút không request → request đầu tiên
>   cold-start **~30–60s** (đã đo: TTFB ~5s sau khi thức). Nói trước với beta user,
>   hoặc nâng paid để tránh.
> - **Postgres (Render free)** **hết hạn 2026-06-27** → cần migrate (Neon free) hoặc
>   nâng paid **trước** ngày đó, nếu không mất toàn bộ dữ liệu beta.

---

## 2. Onboarding flow cho beta user (5 phút)

1. **Đăng ký** tại `/register` → workspace tự tạo (bạn là OWNER).
2. **Thêm website**: Dashboard → Websites → New → nhập tên + domain (đúng domain
   site sẽ nhúng, ví dụ `myshop.com`). Domain phải **khớp** nơi nhúng — đây là lớp
   bảo mật của API key.
3. **Sinh API key**: trong website vừa tạo → Create API key → **copy ngay** (key
   plaintext chỉ hiện đúng 1 lần).
4. **Nhúng widget** (xem mục 3) vào site thật.
5. **Customize** (tùy chọn): Websites → Customize → đổi màu / vị trí / welcome
   message / theme → Save. Có live preview.
6. **Test**: mở site đã nhúng → bong bóng chat hiện góc dưới → gửi thử 1 tin →
   mở Dashboard → Conversations thấy tin real-time → reply.

---

## 3. Embed snippets

Thay `YOUR_API_KEY` và `your-domain.com` bằng giá trị thật (lấy trong dashboard,
hoặc copy sẵn ở tab **Code** của website).

### HTML (mọi site)

```html
<script
  src="https://chat-widget-widget.vercel.app/chat-widget.iife.js"
  data-chat-widget-api-key="YOUR_API_KEY"
  data-chat-widget-domain="your-domain.com"
  defer
></script>
```

### React

```tsx
import { useEffect } from "react";

export function ChatWidget() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://chat-widget-widget.vercel.app/chat-widget.iife.js";
    s.defer = true;
    s.setAttribute("data-chat-widget-api-key", "YOUR_API_KEY");
    s.setAttribute("data-chat-widget-domain", "your-domain.com");
    document.body.appendChild(s);
    return () => s.remove();
  }, []);
  return null;
}
```

### WordPress

Dán snippet HTML vào footer theme (Appearance → Theme File Editor → `footer.php`,
ngay trước `</body>`) hoặc dùng plugin "Insert Headers and Footers".

> Widget là **IIFE single bundle + Shadow DOM** → không xung đột CSS với site host,
> không cần build step. Bảng đầy đủ `data-*` + thứ tự merge config: xem `/docs`.

---

## 4. Tính năng đang TẮT ở beta (cần env key để bật)

Code đã sẵn (graceful-off khi thiếu env). Nói trước với beta user để khỏi hiểu nhầm
là bug:

| Tính năng                   | Bật bằng                         | Khi tắt                     |
| --------------------------- | -------------------------------- | --------------------------- |
| Upload ảnh trong chat       | `CLOUDINARY_*` (backend)         | Endpoint trả `503`          |
| Email báo khi admin offline | `RESEND_API_KEY` + `EMAIL_FROM`  | No-op (log warning)         |
| Error tracking              | `SENTRY_DSN` / `VITE_SENTRY_DSN` | Init no-op                  |
| Analytics landing           | `VITE_PLAUSIBLE_DOMAIN` (admin)  | Script Plausible không load |

---

## 5. Kế hoạch tìm 3–5 beta user

**Tiêu chí**: ưu tiên người có **website thật đang chạy** (shop nhỏ, blog, SaaS cá
nhân, freelancer làm site cho client). Tránh người chỉ "xem cho biết".

**Nơi tìm**:

- Cộng đồng dev/indie VN (Facebook group, Discord, X/Twitter indie hackers).
- Bạn bè/đồng nghiệp đang có landing page hoặc shop online.
- Reddit r/SideProject, r/SaaS (post "looking for beta testers").

**Mẫu tin nhắn mời** (chỉnh theo kênh):

> Mình đang làm một **live chat widget** miễn phí (beta) — nhúng 1 dòng script vào
> web là có chat hỗ trợ khách + dashboard quản lý hội thoại real-time. Mình đang tìm
> 3–5 người có website thật dùng thử ~1 tuần và cho feedback thẳng thắn. Free hoàn
> toàn trong beta. Bạn thử giúp mình nhé? Link: <admin URL>

---

## 6. Feedback form (template cho Google Form)

Tạo Google Form với các câu sau (đa số chọn nhanh, 2–3 câu mở):

1. **Bạn nhúng widget vào loại site nào?** _(shop / blog / landing / SaaS / khác)_
2. **Mức độ dễ khi nhúng widget?** _(1–5; 1 = rất khó, 5 = rất dễ)_
3. **Bước nào gây vướng nhất?** _(đăng ký / tạo website / lấy API key / nhúng /
   customize / không vướng gì)_
4. **Tốc độ phản hồi chat real-time có ổn không?** _(ổn / chậm / không hoạt động)_
   — _nếu cold-start chậm, ghi rõ lần đầu hay mọi lần._
5. **Giao diện admin inbox có đủ dùng để trả lời khách không?** _(1–5 + lý do)_
6. **Tính năng nào bạn cần nhất mà đang thiếu?** _(mở)_ — gợi ý: tags, search,
   canned replies, mời thêm agent, mobile app, chatbot/AI, rating sau chat.
7. **Bug gặp phải (nếu có)?** _(mở — mô tả + bước tái hiện + trình duyệt)_
8. **Bạn sẽ tiếp tục dùng sau beta không? Sẵn sàng trả phí ở mức nào?** _(không /
   có nếu free / sẵn sàng trả $X)_

---

## 7. Beta monitoring checklist (tuần 1–2)

- [ ] Set `VITE_PLAUSIBLE_DOMAIN` + tạo site trên Plausible (theo dõi traffic landing).
- [ ] Set `SENTRY_DSN` + `VITE_SENTRY_DSN` → monitor unhandled exception hằng ngày.
- [ ] Theo dõi Render logs cho lỗi 5xx / cold-start bất thường.
- [ ] Tuần 1: fix top 3 critical bug từ feedback + Sentry.
- [ ] Tuần 2: tổng hợp feedback → quyết định Phase 5 (Stripe? feature nào? — xem
      parking lot trong [CHECKLIST.md](CHECKLIST.md)).

---

## 8. Bản ghi verify production (2026-06-22)

Critical-path chạy thật trên production backend (script socket.io-client, mirror
`apps/backend/test/chat-flow.e2e-spec.ts` nhưng trỏ vào URL prod):

- ✅ REST: `register` → `GET /workspaces` (1 OWNER auto-tạo) → `POST /websites`
  (workspace-scoped) → `POST /api-keys` (plaintext key).
- ✅ WS: admin + widget connect (wss) → `createConversation` → `sendMessage`
  (VISITOR) → admin nhận `receiveMessage` real-time, đúng content + senderType.
- ✅ Bundle widget deployed có `.bottom-16` / `.right-0` (fix Shadow DOM) + baked
  `onrender.com` API URL.
- ✅ CI (PR #4): `ci` + `e2e-widget` (Playwright browser) + `e2e-backend` xanh.

**Còn lại (manual, không tự động hóa được):** nhúng widget vào **website thật bên
ngoài** từ máy khác + test chiều admin→visitor reply qua browser; test email offline
(cần `RESEND_*`) + upload ảnh (cần `CLOUDINARY_*`).
