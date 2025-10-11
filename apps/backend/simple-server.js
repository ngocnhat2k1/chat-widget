const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory storage for demo (replace with database in production)
let conversations = [];
let messages = [];
let messageId = 1;
let conversationId = 1;

// Demo API key validation
const DEMO_API_KEY = 'demo-api-key-12345';

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (apiKey !== DEMO_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat Widget Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get conversations
app.get('/api/conversations', validateApiKey, (req, res) => {
  res.json(conversations);
});

// Create conversation
app.post('/api/conversations', validateApiKey, (req, res) => {
  const { visitorId } = req.body;
  
  const conversation = {
    id: `conv-${conversationId++}`,
    visitorId: visitorId || `visitor-${Date.now()}`,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    messages: []
  };
  
  conversations.push(conversation);
  res.json(conversation);
});

// Get conversation messages
app.get('/api/conversations/:id/messages', validateApiKey, (req, res) => {
  const conversationMessages = messages.filter(m => m.conversationId === req.params.id);
  res.json(conversationMessages);
});

// Send message
app.post('/api/conversations/:id/messages', validateApiKey, (req, res) => {
  const { content, senderType = 'VISITOR' } = req.body;
  const conversationId = req.params.id;
  
  const message = {
    id: `msg-${messageId++}`,
    conversationId,
    content,
    senderType,
    createdAt: new Date().toISOString()
  };
  
  messages.push(message);
  
  // Emit to all clients in this conversation
  io.to(conversationId).emit('newMessage', message);
  
  res.json(message);
  
  // Auto-reply from agent (demo feature)
  if (senderType === 'VISITOR') {
    setTimeout(() => {
      const agentReplies = [
        'Chào bạn! Tôi là agent hỗ trợ. Tôi có thể giúp gì cho bạn?',
        'Cảm ơn bạn đã liên hệ. Để tôi kiểm tra thông tin cho bạn.',
        'Tôi hiểu vấn đề của bạn. Hãy để tôi hỗ trợ bạn.',
        'Bạn có thể cung cấp thêm chi tiết không?',
        'Đây là một câu hỏi hay! Tôi sẽ trả lời chi tiết cho bạn.'
      ];
      
      const randomReply = agentReplies[Math.floor(Math.random() * agentReplies.length)];
      
      const agentMessage = {
        id: `msg-${messageId++}`,
        conversationId,
        content: randomReply,
        senderType: 'AGENT',
        createdAt: new Date().toISOString()
      };
      
      messages.push(agentMessage);
      io.to(conversationId).emit('newMessage', agentMessage);
      
    }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Authenticate widget
  socket.on('authenticate', (data) => {
    const { apiKey } = data;
    if (apiKey !== DEMO_API_KEY) {
      socket.emit('authError', { message: 'Invalid API key' });
      return;
    }
    
    socket.emit('authenticated', { message: 'Authentication successful' });
    console.log('✅ Widget authenticated:', socket.id);
  });
  
  // Join conversation room
  socket.on('joinConversation', (data) => {
    const { conversationId } = data;
    socket.join(conversationId);
    console.log(`👥 Socket ${socket.id} joined conversation: ${conversationId}`);
    
    // Send conversation history
    const conversationMessages = messages.filter(m => m.conversationId === conversationId);
    socket.emit('conversationHistory', conversationMessages);
  });
  
  // Handle new messages via socket
  socket.on('sendMessage', (data) => {
    const { conversationId, content, senderType = 'VISITOR' } = data;
    
    const message = {
      id: `msg-${messageId++}`,
      conversationId,
      content,
      senderType,
      createdAt: new Date().toISOString()
    };
    
    messages.push(message);
    
    // Broadcast to all clients in this conversation
    io.to(conversationId).emit('newMessage', message);
    
    console.log('📧 New message:', message);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('🚀 Chat Widget Backend Server Started!');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔑 Demo API Key: ${DEMO_API_KEY}`);
  console.log('📡 Socket.IO server ready for real-time communication');
  console.log(`🌐 CORS enabled for: localhost:3000, localhost:5173, localhost:5174`);
  console.log('');
  console.log('✅ Ready to receive widget connections!');
});
