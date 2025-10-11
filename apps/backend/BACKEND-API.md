# Backend API Documentation

## 🚀 Step 2 Complete: Backend Development

### ✅ Đã hoàn thành:

1. **🗄️ Database Schema (Prisma)**
   - User management với authentication
   - Website registration và domain validation
   - API key generation với bcrypt hashing
   - Conversation và Message models
   - Proper relations và constraints

2. **🔐 Authentication System**
   - JWT-based authentication
   - User registration và login
   - Password hashing với bcrypt
   - Protected routes với Guards

3. **🔑 API Key Management**
   - Secure API key generation
   - Hash-based storage (không store raw keys)
   - Domain validation cho security
   - API key authentication cho widgets

4. **💬 Real-time Chat System**
   - Socket.IO WebSocket gateway
   - Room-based conversations
   - Real-time message broadcasting
   - Connection authentication

5. **📡 REST API Endpoints**
   - User authentication endpoints
   - Website management
   - API key operations
   - Conversation history

### 🗄️ Database Schema

#### Models:
- **User**: Admin users (id, email, passwordHash)
- **Website**: Registered websites (id, userId, domain, name)
- **ApiKey**: Hashed API keys (id, websiteId, hashedKey, name)
- **Conversation**: Chat sessions (id, websiteId, visitorId, status)
- **Message**: Chat messages (id, conversationId, senderType, content)

### 🔐 Authentication Endpoints

```
POST /auth/register
Body: { email: string, password: string }
Response: { user: User, token: string }

POST /auth/login  
Body: { email: string, password: string }
Response: { user: User, token: string }
```

### 🌐 Website Management

```
POST /websites
Headers: Authorization: Bearer <token>
Body: { name: string, domain: string }
Response: Website

GET /websites
Headers: Authorization: Bearer <token>
Response: Website[]

POST /websites/api-keys
Headers: Authorization: Bearer <token>
Body: { websiteId: string, name?: string }
Response: { id, name, websiteId, createdAt, rawApiKey }

DELETE /websites/api-keys/:id
Headers: Authorization: Bearer <token>
Response: { message: string }
```

### 💬 Chat Endpoints

```
GET /conversations/:id/messages
Response: Message[]

GET /conversations?websiteId=<id>
Headers: Authorization: Bearer <token>
Response: Conversation[]
```

### 🔌 Socket.IO Events

#### Client → Server:
- **createConversation**: Tạo conversation mới
- **joinConversation**: Join vào conversation room
- **sendMessage**: Gửi tin nhắn
- **leaveConversation**: Rời khỏi conversation

#### Server → Client:
- **conversationCreated**: Conversation được tạo
- **conversationHistory**: Lịch sử tin nhắn
- **receiveMessage**: Tin nhắn mới
- **error**: Lỗi xảy ra

### 🛡️ Security Features

1. **API Key Security**:
   - Raw API keys chỉ hiển thị 1 lần khi tạo
   - Store bcrypt hash trong database
   - Domain validation cho mỗi request

2. **JWT Authentication**:
   - Secure token generation
   - Token expiration
   - Protected routes

3. **Input Validation**:
   - class-validator cho DTOs
   - Whitelist input properties
   - Transform và sanitize data

### 🔧 Setup Instructions

1. **Environment Variables** (`.env`):
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chat_widget"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   ```

2. **Database Setup**:
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed database với demo data
   pnpm db:seed
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```

### 🎯 Demo Credentials

**Login:**
- Email: `admin@example.com`
- Password: `password123`

**Test API Key:** `demo-api-key-12345`
**Test Domain:** `localhost:5173`

### 📋 Next Steps

Backend đã sẵn sàng cho **Step 3: Widget Development**!

Sẽ implement:
- ✅ Shadow DOM isolation
- ✅ API key authentication
- ✅ Real-time Socket.IO connection
- ✅ Embeddable widget loader
- ✅ Professional chat UI
