import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Zap,
  Palette,
  Users,
  BarChart3,
  ImageIcon,
  Bell,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time tức thì",
    desc: "Socket.IO hai chiều — tin nhắn, typing, read receipt ngay lập tức.",
  },
  {
    icon: Palette,
    title: "Tuỳ chỉnh không cần code",
    desc: "Đổi màu, vị trí, lời chào, tên agent — preview trực tiếp, lưu là xong.",
  },
  {
    icon: Users,
    title: "Workspace cho team",
    desc: "Nhiều website, nhiều thành viên với vai trò OWNER / ADMIN / AGENT.",
  },
  {
    icon: ImageIcon,
    title: "Gửi hình ảnh",
    desc: "Khách đính kèm ảnh chụp màn hình, hiển thị ngay trong hội thoại.",
  },
  {
    icon: Bell,
    title: "Không bỏ lỡ tin nhắn",
    desc: "Âm thanh + thông báo trình duyệt, email khi không có ai online.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Theo dõi hội thoại, tin nhắn theo ngày, top website đang hoạt động.",
  },
];

const EMBED_SNIPPET = `<script
  src="https://widget.yourapp.com/chat-widget.iife.js"
  data-chat-widget-api-key="YOUR_API_KEY"
  data-chat-widget-domain="yourdomain.com"
  defer
></script>`;

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold">ChatWidget</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/docs"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              Tài liệu
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Dùng thử miễn phí
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/70 to-white" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              <Zap className="h-3.5 w-3.5" /> Public beta — miễn phí
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Live chat cho website của bạn,{" "}
              <span className="text-blue-600">nhúng trong 1 phút</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-xl">
              Thêm một đoạn script, trò chuyện với khách real-time, quản lý mọi
              hội thoại từ một dashboard. Không phụ thuộc nền tảng — nhúng vào
              bất kỳ website nào.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-semibold px-6 py-3 rounded-lg"
              >
                Bắt đầu miễn phí <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Xem hướng dẫn nhúng
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Không cần thẻ tín dụng · Nhúng HTML / React / WordPress
            </p>
          </div>

          {/* Visual: embed snippet card */}
          <div className="relative">
            <div className="rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 bg-gray-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400">index.html</span>
              </div>
              <pre className="bg-gray-900 text-gray-100 text-xs sm:text-sm p-5 overflow-x-auto leading-relaxed">
                <code>{EMBED_SNIPPET}</code>
              </pre>
            </div>
            {/* Floating launcher bubble */}
            <div className="absolute -bottom-5 -right-3 h-14 w-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">Đủ tính năng để chăm khách</h2>
          <p className="mt-3 text-gray-600">
            Tất cả có sẵn ngay từ bản beta, không tính phí.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 steps */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-3 gap-8">
          {[
            {
              n: "1",
              t: "Tạo website + API key",
              d: "Đăng ký, thêm website của bạn, sinh API key trong dashboard.",
            },
            {
              n: "2",
              t: "Dán đoạn nhúng",
              d: "Copy script HTML/React/WordPress, dán vào trang của bạn.",
            },
            {
              n: "3",
              t: "Trả lời khách",
              d: "Tin nhắn về real-time ngay trong inbox — trả lời mọi lúc.",
            },
          ].map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Giá</h2>
          <p className="mt-3 text-gray-600">
            Đang trong beta — dùng toàn bộ tính năng miễn phí.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-2xl border-2 border-blue-600 p-8">
            <h3 className="font-semibold text-blue-600">Beta</h3>
            <p className="mt-2 text-4xl font-extrabold">
              0₫
              <span className="text-base font-medium text-gray-400">
                /tháng
              </span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Không giới hạn hội thoại",
                "Tuỳ chỉnh widget",
                "Workspace cho team",
                "Gửi hình ảnh + email noti",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" /> {i}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 block text-center text-white bg-blue-600 hover:bg-blue-700 font-semibold py-3 rounded-lg"
            >
              Đăng ký ngay
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 p-8 bg-gray-50">
            <h3 className="font-semibold text-gray-500">Pro</h3>
            <p className="mt-2 text-4xl font-extrabold text-gray-400">
              Coming soon
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-500">
              {[
                "Mọi thứ ở Beta",
                "Canned replies, tags, search",
                "Office hours / availability",
                "Tích hợp Slack / Discord",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gray-300" /> {i}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="mt-8 w-full text-center text-gray-400 bg-gray-200 font-semibold py-3 rounded-lg cursor-not-allowed"
            >
              Sắp ra mắt
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Sẵn sàng chat với khách?</h2>
          <p className="mt-3 text-blue-100">
            Tạo tài khoản và nhúng widget trong vài phút.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50"
          >
            Bắt đầu miễn phí <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-700">ChatWidget</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/docs" className="hover:text-gray-900">
              Tài liệu
            </Link>
            <Link to="/login" className="hover:text-gray-900">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
