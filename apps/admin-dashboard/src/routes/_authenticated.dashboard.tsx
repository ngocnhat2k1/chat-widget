import { createFileRoute, Link } from "@tanstack/react-router";
import { useAnalytics, useWebsites } from "../hooks/api";
import {
  MessageCircle,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function OnboardingGuide({
  hasWebsite,
  hasApiKey,
}: {
  hasWebsite: boolean;
  hasApiKey: boolean;
}) {
  const steps = [
    {
      id: 1,
      title: "Tạo tài khoản",
      description: "Đăng ký và đăng nhập vào dashboard.",
      done: true,
      link: null as string | null,
      linkLabel: "",
    },
    {
      id: 2,
      title: "Thêm website",
      description: "Đăng ký domain website bạn muốn gắn chat widget.",
      done: hasWebsite,
      link: "/websites",
      linkLabel: "Thêm website",
    },
    {
      id: 3,
      title: "Tạo API key",
      description: "Tạo key để widget xác thực với backend.",
      done: hasApiKey,
      link: "/websites",
      linkLabel: "Tạo API key",
    },
    {
      id: 4,
      title: "Nhúng widget vào website",
      description: "Copy snippet và paste vào thẻ <head> của website.",
      done: false,
      link: "/docs",
      linkLabel: "Xem hướng dẫn",
    },
    {
      id: 5,
      title: "Nhận cuộc hội thoại đầu tiên",
      description: "Vào website của bạn và thử chat để kiểm tra.",
      done: false,
      link: null,
      linkLabel: "",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-blue-900">
            Bắt đầu với Chat Widget
          </h2>
          <p className="text-sm text-blue-700 mt-0.5">
            {completedCount}/{steps.length} bước hoàn thành
          </p>
        </div>
        <span className="text-sm font-medium text-blue-600">{pct}%</span>
      </div>

      <div className="w-full bg-blue-200 rounded-full h-1.5 mb-5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-blue-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
            {!step.done && step.link && (
              <Link
                to={step.link}
                className="flex-shrink-0 flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                {step.linkLabel}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: analytics, isLoading, error } = useAnalytics();
  const { data: websites } = useWebsites();

  const isNewUser =
    !isLoading && !error && (analytics?.totalConversations ?? 0) === 0;
  const hasWebsite = (websites?.length ?? 0) > 0;
  const hasApiKey =
    websites?.some((w) => (w.apiKeys?.length ?? 0) > 0) ?? false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white overflow-hidden shadow rounded-lg animate-pulse"
            >
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          Error loading dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Conversations",
      stat: analytics?.totalConversations || 0,
      change: "+12%",
      changeType: "increase",
      icon: MessageCircle,
    },
    {
      name: "Active Conversations",
      stat: analytics?.activeConversations || 0,
      change: "+5%",
      changeType: "increase",
      icon: Activity,
    },
    {
      name: "Total Messages",
      stat: analytics?.totalMessages || 0,
      change: "+8%",
      changeType: "increase",
      icon: TrendingUp,
    },
    {
      name: "Today's Conversations",
      stat: analytics?.conversationsToday || 0,
      change: "+15%",
      changeType: "increase",
      icon: Users,
    },
  ];

  // Prepare chart data
  const messageChartData =
    analytics?.messagesPerDay?.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      messages: item.count,
    })) || [];

  const conversationChartData =
    analytics?.conversationsPerDay?.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      conversations: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Onboarding checklist — visible until first conversation arrives */}
      {isNewUser && (
        <OnboardingGuide hasWebsite={hasWebsite} hasApiKey={hasApiKey} />
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.stat.toLocaleString()}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === "increase"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.changeType === "increase" ? (
                          <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">{item.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Messages Over Time
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={messageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversations Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            New Conversations
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversations" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Websites */}
      {analytics?.topWebsites && analytics.topWebsites.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Top Performing Websites
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {analytics.topWebsites.map((website, index) => (
                <div
                  key={website.website.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {website.website.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {website.website.domain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {website.conversationCount} conversations
                    </p>
                    <p className="text-sm text-gray-500">
                      {website.messageCount} messages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});
