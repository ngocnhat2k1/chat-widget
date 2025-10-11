import React from 'react'
import SidebarLayout from '../components/SidebarLayout'
import { useAnalytics, useWebsites, useConversations } from '../lib/hooks'
import { 
  Globe, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

interface RecentActivityProps {
  conversations: any[]
  loading: boolean
}

function RecentActivity({ conversations, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
      <div className="space-y-4">
        {conversations.slice(0, 5).map((conversation) => (
          <div key={conversation.id} className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              conversation.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {conversation.status === 'ACTIVE' ? (
                <Clock className="w-4 h-4 text-green-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Cuộc trò chuyện từ {conversation.website?.domain || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(conversation.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              conversation.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {conversation.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
            </div>
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có cuộc trò chuyện nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics()
  const { data: websites, isLoading: websitesLoading } = useWebsites()
  const { data: conversations, isLoading: conversationsLoading } = useConversations()

  const stats = [
    {
      title: 'Tổng số Websites',
      value: websites?.length || 0,
      icon: Globe,
      color: 'blue' as const,
      trend: 'Đã đăng ký'
    },
    {
      title: 'Cuộc trò chuyện',
      value: analytics?.totalConversations || 0,
      icon: MessageSquare,
      color: 'green' as const,
      trend: `${analytics?.conversationsToday || 0} hôm nay`
    },
    {
      title: 'Đang hoạt động',
      value: analytics?.activeConversations || 0,
      icon: Users,
      color: 'yellow' as const,
      trend: 'Trực tuyến'
    },
    {
      title: 'Tổng tin nhắn',
      value: analytics?.totalMessages || 0,
      icon: TrendingUp,
      color: 'red' as const,
      trend: 'Tất cả thời gian'
    },
  ]

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Chào mừng trở lại! 👋</h1>
          <p className="text-blue-100">
            Đây là tổng quan về hệ thống chat widget của bạn
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity 
            conversations={conversations || []} 
            loading={conversationsLoading}
          />
          
          {/* Quick actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-3">
              <a
                href="/websites"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Thêm website mới</p>
                  <p className="text-sm text-gray-500">Tạo chat widget cho website</p>
                </div>
              </a>
              
              <a
                href="/conversations"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Xem cuộc trò chuyện</p>
                  <p className="text-sm text-gray-500">Quản lý tin nhắn từ khách hàng</p>
                </div>
              </a>
              
              <a
                href="/analytics"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Xem báo cáo</p>
                  <p className="text-sm text-gray-500">Phân tích hiệu suất chat</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* System status */}
        {!analyticsLoading && !websitesLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">API Server: Hoạt động</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Database: Kết nối</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Socket.IO: Trực tuyến</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
