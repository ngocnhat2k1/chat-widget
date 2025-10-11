import React, { useState, useEffect, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import { useConversation, useMessages, useCreateMessage, useUpdateConversation } from '../hooks/api';
import { socketService } from '../lib/socket';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Bot, 
  Clock, 
  Globe,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from '@tanstack/react-router';

interface MessageFormData {
  content: string;
}

export function ConversationDetailPage() {
  const { conversationId } = useParams({ from: '/conversations/$conversationId' });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: messagesData, refetch: refetchMessages } = useMessages(conversationId);
  const createMessageMutation = useCreateMessage();
  const updateConversationMutation = useUpdateConversation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  // Real-time message updates
  useEffect(() => {
    if (!conversationId) return;

    // Join the conversation room
    socketService.joinConversation(conversationId);

    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        refetchMessages();
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId, refetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const onSendMessage = async (data: MessageFormData) => {
    if (!conversationId || !data.content.trim()) return;

    try {
      await createMessageMutation.mutateAsync({
        conversationId,
        data: {
          content: data.content.trim(),
          senderType: 'AGENT',
          senderName: 'Admin',
        },
      });
      reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStatusChange = async (status: 'ACTIVE' | 'CLOSED') => {
    if (!conversationId) return;

    try {
      await updateConversationMutation.mutateAsync({
        id: conversationId,
        data: { status },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (conversationLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Conversation not found</h3>
          <p className="mt-1 text-sm text-gray-500">The conversation you're looking for doesn't exist.</p>
          <Link
            to="/conversations"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conversations
          </Link>
        </div>
      </div>
    );
  }

  const messages = messagesData?.messages || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/conversations"
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                conversation.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <User className={`h-5 w-5 ${
                  conversation.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  Visitor: {conversation.visitorId.slice(0, 8)}...
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {conversation.website.name}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(new Date(conversation.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    conversation.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {conversation.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange(
                conversation.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
              )}
              className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium ${
                conversation.status === 'ACTIVE'
                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                  : 'text-green-700 bg-green-100 hover:bg-green-200'
              }`}
            >
              {conversation.status === 'ACTIVE' ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reopen
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === 'AGENT' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'AGENT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.senderType === 'AGENT' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.senderType === 'AGENT' ? 'Admin' : 'Visitor'}
                    </span>
                    <span className={`text-xs ${
                      message.senderType === 'AGENT' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Visitor is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {conversation.status === 'ACTIVE' && (
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit(onSendMessage)} className="flex space-x-4">
            <div className="flex-1">
              <input
                {...register('content', { required: 'Message is required' })}
                type="text"
                placeholder="Type your message..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                autoComplete="off"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={createMessageMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {conversation.status === 'CLOSED' && (
        <div className="bg-gray-100 border-t border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600">
            This conversation is closed. 
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              Reopen to continue chatting
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
