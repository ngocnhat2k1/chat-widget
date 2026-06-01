import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { EmbedCodeBlock } from "../components/embed-code-block";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const DATA_ATTRS: { attr: string; desc: string; required?: boolean }[] = [
  {
    attr: "data-chat-widget-api-key",
    desc: "API key của website",
    required: true,
  },
  {
    attr: "data-chat-widget-domain",
    desc: "Domain đã đăng ký (mặc định: hostname hiện tại)",
  },
  { attr: "data-chat-widget-color", desc: "Màu chủ đạo, ví dụ #2563eb" },
  {
    attr: "data-chat-widget-position",
    desc: "bottom-right | bottom-left",
  },
  { attr: "data-chat-widget-welcome", desc: "Lời chào" },
  { attr: "data-chat-widget-agent", desc: "Tên hiển thị của agent" },
  { attr: "data-chat-widget-theme", desc: "light | dark" },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-gray-100">
        <nav className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold">ChatWidget</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chủ
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold">Hướng dẫn nhúng</h1>
        <p className="mt-3 text-gray-600">
          Nhúng chat widget vào bất kỳ website nào chỉ với một đoạn script.
        </p>

        {/* Step 1 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Lấy API key</h2>
          <p className="mt-2 text-gray-600 text-sm">
            <Link to="/register" className="text-blue-600 hover:underline">
              Đăng ký
            </Link>{" "}
            → vào <span className="font-medium">Websites</span> → tạo website →
            bấm <span className="font-medium">Create API Key</span>. Key chỉ
            hiện một lần, hãy lưu lại ngay.
          </p>
        </section>

        {/* Step 2 */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. Dán đoạn nhúng</h2>
          <p className="mt-2 text-gray-600 text-sm mb-4">
            Thay <code className="bg-gray-100 px-1 rounded">YOUR_API_KEY</code>{" "}
            và domain bằng giá trị của bạn.
          </p>
          <EmbedCodeBlock apiKey="YOUR_API_KEY" domain="yourdomain.com" />
        </section>

        {/* Data attributes */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. Tuỳ chỉnh (tùy chọn)</h2>
          <p className="mt-2 text-gray-600 text-sm mb-4">
            Đặt mặc định trong dashboard (Websites → biểu tượng{" "}
            <span className="font-medium">Palette</span>), hoặc override từng
            trang bằng các thuộc tính <code>data-*</code>:
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Thuộc tính</th>
                  <th className="px-4 py-2 font-medium">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DATA_ATTRS.map((d) => (
                  <tr key={d.attr}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800 whitespace-nowrap">
                      {d.attr}
                      {d.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{d.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            <span className="text-red-500">*</span> bắt buộc. Thứ tự ưu tiên:
            mặc định &lt; cấu hình trong dashboard &lt; thuộc tính{" "}
            <code>data-*</code>.
          </p>
        </section>

        {/* WordPress note */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">WordPress</h2>
          <p className="mt-2 text-gray-600 text-sm">
            Dán đoạn HTML ở tab WordPress phía trên vào footer theme (Appearance
            → Theme File Editor → <code>footer.php</code>, trước{" "}
            <code>&lt;/body&gt;</code>) hoặc dùng plugin{" "}
            <span className="font-medium">Insert Headers and Footers</span>.
          </p>
        </section>

        {/* API docs */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">API tham chiếu</h2>
          <p className="mt-2 text-gray-600 text-sm">
            Tài liệu API đầy đủ (Swagger) sẽ có ở{" "}
            <code className="bg-gray-100 px-1 rounded">/api/docs</code> —{" "}
            <span className="text-gray-400">sắp ra mắt</span>.
          </p>
        </section>

        <div className="mt-12 rounded-xl bg-blue-50 border border-blue-100 p-6 text-center">
          <p className="font-medium text-gray-900">Sẵn sàng bắt đầu?</p>
          <Link
            to="/register"
            className="mt-3 inline-block text-white bg-blue-600 hover:bg-blue-700 font-semibold px-5 py-2.5 rounded-lg"
          >
            Tạo tài khoản miễn phí
          </Link>
        </div>
      </main>
    </div>
  );
}
