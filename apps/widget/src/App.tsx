import { useState, useEffect, useRef } from 'react'
import { ChatAPI, Message, Conversation } from './api'
import { WidgetConfig } from './config'

interface Props {
  config: WidgetConfig
}

export default function ChatWidget({ config }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const demoMode = config.demoMode ?? false

  const chatAPI = useRef<ChatAPI | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat API
  useEffect(() => {
    chatAPI.current = new ChatAPI(config.apiKey, config.domain)
    
    return () => {
      chatAPI.current?.disconnect()
    }
  }, [config.apiKey, config.domain])

  // Connect to chat server when widget opens or enable demo mode
  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting) {
      if (demoMode) {
        enableDemoMode()
      } else {
        connectToChat()
      }
    }
  }, [isOpen, isConnected, isConnecting, demoMode])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const enableDemoMode = () => {
    setIsConnecting(true)
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true)
      setIsConnecting(false)
      
      // Create demo conversation
      const demoConversation: Conversation = {
        id: 'demo-conversation',
        visitorId: 'demo-visitor',
        websiteId: 'demo-website',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setConversation(demoConversation)
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-msg',
        conversationId: 'demo-conversation',
        content: config.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?',
        senderType: 'AGENT',
        createdAt: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }, 1000)
  }

  const connectToChat = async () => {
    if (!chatAPI.current) return

    setIsConnecting(true)
    setError(null)

    try {
      await chatAPI.current.connect()
      setIsConnected(true)

      // Set up message listeners
      chatAPI.current.onMessage((message: Message) => {
        setMessages(prev => [...prev, message])
      })

      chatAPI.current.onConversationHistory(({ messages: historyMessages }) => {
        setMessages(historyMessages)
      })

      // Create or get existing conversation
      if (!conversation) {
        const newConversation = await chatAPI.current.createConversation(config.welcomeMessage)
        setConversation(newConversation)
        chatAPI.current.joinConversation(newConversation.id)
      }
    } catch (error) {
      console.error('Failed to connect to chat:', error)
      setError('Không thể kết nối tới server chat. Vui lòng thử lại sau.')
    } finally {
      setIsConnecting(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsLoading(true)

    try {
      if (demoMode) {
        // Demo mode: Add user message immediately
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          conversationId: conversation.id,
          content: messageContent,
          senderType: 'VISITOR',
          createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, userMessage])

        // Simulate agent response after delay
        setTimeout(() => {
          const responses = [
            'Cảm ơn bạn đã liên hệ! Tôi sẽ hỗ trợ bạn ngay.',
            'Để tôi kiểm tra thông tin cho bạn...',
            'Bạn có thể cung cấp thêm chi tiết không?',
            'Tôi hiểu vấn đề của bạn. Hãy để tôi giúp bạn.',
            'Đây là một câu hỏi hay! Tôi sẽ trả lời chi tiết.',
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          
          const agentMessage: Message = {
            id: `agent-msg-${Date.now()}`,
            conversationId: conversation.id,
            content: randomResponse,
            senderType: 'AGENT',
            createdAt: new Date().toISOString()
          }
          setMessages(prev => [...prev, agentMessage])
        }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
      } else {
        // Real mode: Send to API
        if (chatAPI.current) {
          chatAPI.current.sendMessage(conversation.id, messageContent)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleWidget = () => {
    setIsOpen(!isOpen)
    if (error) setError(null)
  }

  // Widget styles based on configuration
  const widgetPosition = config.position === 'bottom-left' ? 'left-4' : 'right-4'
  const primaryColor = config.primaryColor || '#2563eb'

  return (
    <div 
      className={`fixed bottom-4 ${widgetPosition} z-50 font-sans`}
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Chat Toggle Button */}
      <button
        onClick={toggleWidget}
        className="shadow-lg hover:shadow-xl transition-all duration-200 w-14 h-14 rounded-full text-white flex items-center justify-center relative"
        style={{ backgroundColor: primaryColor }}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div 
            className="text-white p-4 flex justify-between items-center"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              <h3 className="font-semibold text-sm">Chat Support</h3>
              <div className="flex items-center text-xs opacity-90">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                {isConnecting ? 'Đang kết nối...' : isConnected ? 'Trực tuyến' : 'Ngoại tuyến'}
              </div>
            </div>
            <button
              onClick={toggleWidget}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
                <button 
                  onClick={connectToChat}
                  className="ml-2 underline hover:no-underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {isConnecting && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: primaryColor }}></div>
                <span className="ml-2 text-sm text-gray-600">Đang kết nối...</span>
              </div>
            )}

            {messages.length === 0 && isConnected && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 flex ${
                  message.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.senderType === 'VISITOR'
                      ? 'text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: message.senderType === 'VISITOR' ? primaryColor : undefined
                  }}
                >
                  {message.content}
                  <div className={`text-xs mt-1 ${
                    message.senderType === 'VISITOR' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={!isConnected || isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm disabled:opacity-50"
                style={{ accentColor: primaryColor }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected || isLoading}
                className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
