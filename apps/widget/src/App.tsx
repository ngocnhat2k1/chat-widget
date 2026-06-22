import { useState, useEffect, useRef, type CSSProperties } from "react";
import { ChatAPI, Message, Conversation } from "./api";
import { WidgetConfig } from "./config";

interface Props {
  config: WidgetConfig;
}

export default function ChatWidget({ config }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Placeholder for an "agent is typing" indicator. The backend doesn't emit
  // agent-typing to the widget yet, so this stays false (the setter is omitted).
  const [visitorTypingActive] = useState(false);
  const [messagesRead, setMessagesRead] = useState(false);

  // Visitor info form
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");

  const demoMode = config.demoMode ?? false;

  const chatAPI = useRef<ChatAPI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize chat API
  useEffect(() => {
    chatAPI.current = new ChatAPI(config.apiKey, config.domain);

    return () => {
      chatAPI.current?.disconnect();
    };
  }, [config.apiKey, config.domain]);

  // When widget opens, decide flow
  useEffect(() => {
    if (!isOpen || isConnected || isConnecting) return;

    if (demoMode) {
      enableDemoMode();
      return;
    }

    const storedId = chatAPI.current?.getStoredConversationId();
    if (storedId) {
      // Returning visitor: skip info form, reconnect directly
      connectToChat(undefined, undefined, storedId);
    } else {
      // New visitor: show info form first
      setShowInfoForm(true);
    }
  }, [isOpen, isConnected, isConnecting, demoMode]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, visitorTypingActive]);

  const handleInfoFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setShowInfoForm(false);
    connectToChat(visitorName.trim(), visitorEmail.trim() || undefined);
  };

  const enableDemoMode = () => {
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);

      const demoConversation: Conversation = {
        id: "demo-conversation",
        visitorId: "demo-visitor",
        websiteId: "demo-website",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversation(demoConversation);

      const welcomeMessage: Message = {
        id: "welcome-msg",
        conversationId: "demo-conversation",
        content:
          config.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn?",
        senderType: "AGENT",
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }, 1000);
  };

  const connectToChat = async (
    name?: string,
    email?: string,
    existingConversationId?: string
  ) => {
    if (!chatAPI.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      await chatAPI.current.connect();
      setIsConnected(true);

      chatAPI.current.onMessage((message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      chatAPI.current.onConversationHistory(({ messages: history }) => {
        setMessages(history);
      });

      chatAPI.current.onMessagesRead(() => {
        setMessagesRead(true);
      });

      if (existingConversationId) {
        // Returning visitor: join existing conversation
        const partial: Conversation = {
          id: existingConversationId,
          websiteId: "",
          visitorId: "",
          status: "ACTIVE",
          createdAt: "",
          updatedAt: "",
        };
        setConversation(partial);
        chatAPI.current.joinConversation(existingConversationId);
      } else {
        // New visitor: create conversation with info
        const newConversation = await chatAPI.current.createConversation(
          config.welcomeMessage,
          name,
          email
        );
        chatAPI.current.setStoredConversationId(newConversation.id);
        setConversation(newConversation);
        chatAPI.current.joinConversation(newConversation.id);
      }
    } catch (err) {
      console.error("Failed to connect to chat:", err);
      setError("Không thể kết nối tới server chat. Vui lòng thử lại sau.");
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      if (demoMode) {
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          conversationId: conversation.id,
          content: messageContent,
          senderType: "VISITOR",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        setTimeout(
          () => {
            const responses = [
              "Cảm ơn bạn đã liên hệ! Tôi sẽ hỗ trợ bạn ngay.",
              "Để tôi kiểm tra thông tin cho bạn...",
              "Bạn có thể cung cấp thêm chi tiết không?",
              "Tôi hiểu vấn đề của bạn. Hãy để tôi giúp bạn.",
              "Đây là một câu hỏi hay! Tôi sẽ trả lời chi tiết.",
            ];
            const randomResponse =
              responses[Math.floor(Math.random() * responses.length)];

            const agentMessage: Message = {
              id: `agent-msg-${Date.now()}`,
              conversationId: conversation.id,
              content: randomResponse,
              senderType: "AGENT",
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, agentMessage]);
          },
          1000 + Math.random() * 2000
        );
      } else {
        if (chatAPI.current) {
          chatAPI.current.sendMessage(conversation.id, messageContent);
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !conversation) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB.");
      return;
    }

    setIsLoading(true);
    try {
      if (demoMode || !chatAPI.current) {
        // Demo mode: preview locally without hitting the backend.
        const localUrl = URL.createObjectURL(file);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            conversationId: conversation.id,
            content: "",
            senderType: "VISITOR",
            attachmentUrl: localUrl,
            attachmentType: file.type,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        const uploaded = await chatAPI.current.uploadImage(file);
        chatAPI.current.sendMessage(conversation.id, "", uploaded);
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      setError("Không tải được ảnh. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (chatAPI.current && conversation && !demoMode && e.target.value.trim()) {
      chatAPI.current.sendTyping(conversation.id);

      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        // typing stops after 3s of no input - no explicit stop event needed
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (error) setError(null);
  };

  const widgetPosition =
    config.position === "bottom-left" ? "left-4" : "right-4";
  const primaryColor = config.primaryColor || "#2563eb";

  return (
    <div
      className={`fixed bottom-4 ${widgetPosition} z-50 font-sans`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
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
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-400" : "bg-gray-400"}`}
                ></div>
                {isConnecting
                  ? "Đang kết nối..."
                  : isConnected
                    ? "Trực tuyến"
                    : "Ngoại tuyến"}
              </div>
            </div>
            <button
              onClick={toggleWidget}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Visitor Info Form */}
          {showInfoForm && !isConnecting && (
            <div className="flex-1 p-5 flex flex-col justify-center bg-gray-50">
              <div className="text-center mb-5">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: primaryColor }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  Bắt đầu trò chuyện
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cho chúng tôi biết thông tin của bạn
                </p>
              </div>
              <form onSubmit={handleInfoFormSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Họ và tên *"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ "--tw-ring-color": primaryColor } as CSSProperties}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="Email (tuỳ chọn)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!visitorName.trim()}
                  className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  Bắt đầu chat
                </button>
              </form>
            </div>
          )}

          {/* Messages Area */}
          {!showInfoForm && (
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                  <button
                    onClick={() => connectToChat()}
                    className="ml-2 underline hover:no-underline"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {isConnecting && (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-b-2"
                    style={{ borderColor: primaryColor }}
                  ></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Đang kết nối...
                  </span>
                </div>
              )}

              {messages.length === 0 && isConnected && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn
                </div>
              )}

              {messages.map((message, index) => {
                const isVisitor = message.senderType === "VISITOR";
                const isLast = index === messages.length - 1;

                return (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${isVisitor ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex flex-col items-end">
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          isVisitor
                            ? "text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                        style={{
                          backgroundColor: isVisitor ? primaryColor : undefined,
                        }}
                      >
                        {message.attachmentUrl && (
                          <a
                            href={message.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={message.attachmentUrl}
                              alt="attachment"
                              className="rounded-md max-h-40 w-auto mb-1"
                            />
                          </a>
                        )}
                        {message.content}
                        <div
                          className={`text-xs mt-1 ${
                            isVisitor ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      {/* Read receipt for visitor messages */}
                      {isVisitor && isLast && (
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center">
                          {messagesRead ? (
                            <span title="Đã xem">✓✓</span>
                          ) : (
                            <span title="Đã gửi">✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Agent typing indicator */}
              {visitorTypingActive && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          {!showInfoForm && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isConnected || isLoading}
                  title="Gửi ảnh"
                  className="px-2 py-2 rounded-lg text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
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
                    "Gửi"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
