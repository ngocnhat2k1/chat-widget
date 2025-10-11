import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Chat Widget Admin Dashboard
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Chào mừng đến với bảng điều khiển quản trị
        </h2>
        <p className="text-gray-600 mb-4">
          Đây là nơi bạn có thể quản lý các cuộc trò chuyện và cấu hình widget chat.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Cuộc trò chuyện hoạt động</h3>
            <p className="text-2xl font-bold text-blue-600">12</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Tin nhắn hôm nay</h3>
            <p className="text-2xl font-bold text-green-600">48</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Websites kết nối</h3>
            <p className="text-2xl font-bold text-purple-600">3</p>
          </div>
        </div>
      </div>
    </div>
  ),
})
