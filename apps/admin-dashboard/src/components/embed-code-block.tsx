import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

const WIDGET_URL =
  (import.meta.env.VITE_WIDGET_URL as string | undefined) ||
  "https://widget.yourapp.com/chat-widget.iife.js";

type Tab = "html" | "react" | "wordpress";

const TABS: { id: Tab; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
  { id: "wordpress", label: "WordPress" },
];

function buildSnippet(tab: Tab, apiKey: string, domain: string): string {
  const html = `<script
  src="${WIDGET_URL}"
  data-chat-widget-api-key="${apiKey}"
  data-chat-widget-domain="${domain}"
  defer
></script>`;

  if (tab === "html") return html;

  if (tab === "react") {
    return `import { useEffect } from "react";

export function ChatWidget() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "${WIDGET_URL}";
    s.defer = true;
    s.setAttribute("data-chat-widget-api-key", "${apiKey}");
    s.setAttribute("data-chat-widget-domain", "${domain}");
    document.body.appendChild(s);
    return () => s.remove();
  }, []);
  return null;
}`;
  }

  // WordPress
  return `<!-- Dán đoạn này vào footer theme (Appearance → Theme File Editor → footer.php,
     ngay trước </body>) hoặc dùng plugin "Insert Headers and Footers". -->
${html}`;
}

export function EmbedCodeBlock({
  apiKey,
  domain,
}: {
  apiKey: string;
  domain: string;
}) {
  const [tab, setTab] = useState<Tab>("html");
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(tab, apiKey, domain);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Đã copy đoạn nhúng!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Không copy được");
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-1 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-1" />
          )}
          Copy
        </button>
      </div>
      <pre className="p-4 text-xs leading-relaxed text-gray-100 bg-gray-900 overflow-x-auto">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
