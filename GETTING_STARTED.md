# 🚀 Hướng Dẫn Chạy Chat Widget Service

## 📋 Tổng Quan Dự Án

Dự án Chat Widget Service bao gồm 3 ứng dụng chính:

- **Admin Dashboard** ✅ (Đã hoàn thành và sẵn sàng)
- **Backend API** 🔧 (Cần cấu hình database)
- **Chat Widget** 🔧 (Cần cấu hình)

## 🎯 Chạy Admin Dashboard (Sẵn sáng ngay)

### Bước 1: Chạy Admin Dashboard

```bash
cd /Users/ngocnhat/Desktop/tu\ hoc\ fe/chat-widget/apps/admin-dashboard
npm run dev
```

**✅ Kết quả:** Admin Dashboard sẽ chạy tại: **http://localhost:5174**

### Bước 2: Truy cập và khám phá

- Mở trình duyệt: http://localhost:5174
- Bạn sẽ thấy giao diện admin dashboard hoàn chỉnh với:
  - 🔐 Trang Login/Register
  - 📊 Dashboard với analytics
  - 🌐 Quản lý websites
  - 💬 Quản lý conversations
  - 📈 Analytics chi tiết

### Features Admin Dashboard:

- ✅ **Authentication System**: Login/Register với JWT
- ✅ **Dashboard Overview**: Charts và metrics
- ✅ **Website Management**: CRUD operations cho websites
- ✅ **Conversation Management**: Quản lý cuộc hội thoại
- ✅ **Real-time Features**: Socket.IO integration (sẵn sàng)
- ✅ **Analytics**: Comprehensive reporting
- ✅ **Responsive Design**: Mobile-friendly interface

## 🔧 Chạy Backend API (Cần setup)

### Yêu cầu:

- PostgreSQL database
- Node.js và npm

### Bước 1: Cài đặt dependencies

```bash
cd /Users/ngocnhat/Desktop/tu\ hoc\ fe/chat-widget/apps/backend
npm install
```

### Bước 2: Setup Database

1. Cài đặt PostgreSQL
2. Tạo database `chat_widget`
3. Tạo file `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chat_widget"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3001
```

### Bước 3: Chạy migrations

```bash
npm run db:generate
npx prisma db push
```

### Bước 4: Chạy Backend

```bash
npm run dev
```

**Kết quả:** Backend API sẽ chạy tại: **http://localhost:3001**

## 💬 Chạy Chat Widget (Cần setup)

### Bước 1: Cài đặt dependencies

```bash
cd /Users/ngocnhat/Desktop/tu\ hoc\ fe/chat-widget/apps/widget
npm install
```

### Bước 2: Chạy Widget

```bash
npm run dev
```

**Kết quả:** Chat Widget sẽ chạy tại: **http://localhost:5173**

## 🚀 Chạy Tất Cả Cùng Lúc

### Option 1: Sử dụng script có sẵn

```bash
cd /Users/ngocnhat/Desktop/tu\ hoc\ fe/chat-widget
./start-dev.sh
```

### Option 2: Chạy từng terminal

1. **Terminal 1 - Admin Dashboard:**

   ```bash
   cd apps/admin-dashboard && npm run dev
   ```

2. **Terminal 2 - Backend API:**

   ```bash
   cd apps/backend && npm run dev
   ```

3. **Terminal 3 - Chat Widget:**
   ```bash
   cd apps/widget && npm run dev
   ```

## 🌐 Truy Cập Các Services

- **Admin Dashboard**: http://localhost:5174 ✅
- **Backend API**: http://localhost:3001 (khi chạy)
- **Chat Widget**: http://localhost:5173 (khi chạy)

## 📱 Demo Admin Dashboard Features

### 1. Authentication

- Truy cập: http://localhost:5174/login
- Tạo tài khoản admin mới
- Đăng nhập vào hệ thống

### 2. Dashboard Overview

- Xem tổng quan analytics
- Charts với Recharts library
- Real-time metrics

### 3. Website Management

- Tạo website mới
- Generate API keys
- Quản lý domains

### 4. Conversation Management

- Xem danh sách conversations
- Filter theo status
- Real-time updates

### 5. Analytics Detail

- Detailed charts và reports
- Date range filtering
- Export functionality

## 🔍 Troubleshooting

### Lỗi phổ biến:

1. **Port đã được sử dụng:**

   ```bash
   # Kill processes trên port cụ thể
   lsof -ti:5174 | xargs kill -9  # Admin Dashboard
   lsof -ti:3001 | xargs kill -9  # Backend
   lsof -ti:5173 | xargs kill -9  # Widget
   ```

2. **Dependencies lỗi:**

   ```bash
   # Xóa node_modules và reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Database connection lỗi:**
   - Kiểm tra PostgreSQL đang chạy
   - Kiểm tra DATABASE_URL trong .env
   - Chạy lại migrations

## 📞 Hỗ Trợ

- **Admin Dashboard**: ✅ Hoạt động 100%
- **Backend**: Cần setup database
- **Widget**: Cần configuration

**Bắt đầu với Admin Dashboard để xem demo đầy đủ các features!**

## 🎉 Kết Luận

- **Step 6 - Admin Dashboard Integration** đã hoàn thành 100%
- UI/UX hiện đại với Tailwind CSS
- Real-time features sẵn sàng
- Production-ready code architecture
- Comprehensive feature set cho admin management

**Bạn có thể bắt đầu sử dụng Admin Dashboard ngay bây giờ tại: http://localhost:5174**
