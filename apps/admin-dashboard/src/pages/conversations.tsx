import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useConversations, useUpdateConversation } from '../hooks/api';
import { socketService } from '../lib/socket';
import { 
  MessageCircle, 
  User, 
  Clock, 
  Filter, 
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');

  const { 
    data: conversationsData, 
    isLoading, 
    error,
    refetch 
  } = useConversations({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    websiteId: selectedWebsite || undefined,
  });

  const updateConversationMutation = useUpdateConversation();

  // Real-time updates
  useEffect(() => {
    const handleNewConversation = () => {
      refetch();
    };

    const handleNewMessage = () => {
      refetch();
    };

    socketService.onNewConversation(handleNewConversation);
    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewConversation(handleNewConversation);
      socketService.offNewMessage(handleNewMessage);
    };
  }, [refetch]);

  const handleStatusChange = async (conversationId: string, status: 'ACTIVE' | 'CLOSED') => {
    try {
      await updateConversationMutation.mutateAsync({
        id: conversationId,
        data: { status },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversationsData?.conversations?.filter(conversation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.website.name.toLowerCase().includes(searchLower) ||
      conversation.website.domain.toLowerCase().includes(searchLower) ||
      conversation.visitorId.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
          Error loading conversations. Please try again later.
        </div>
      </div>
    );
  }

  const statusCounts = {
    ALL: conversationsData?.total || 0,
    ACTIVE: conversationsData?.conversations?.filter(c => c.status === 'ACTIVE').length || 0,
    CLOSED: conversationsData?.conversations?.filter(c => c.status === 'CLOSED').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as 'ALL' | 'ACTIVE' | 'CLOSED')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              statusFilter === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500">
              {status === 'ALL' ? 'Total' : status.charAt(0) + status.slice(1).toLowerCase()} Conversations
            </div>
          </button>
        ))}
      </div>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      conversation.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        conversation.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Visitor: {conversation.visitorId.slice(0, 8)}...
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          conversation.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {conversation.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-500">
                          {conversation.website.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {conversation._count?.messages || 0} messages
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleStatusChange(
                        conversation.id, 
                        conversation.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
                      )}
                      className={`p-2 rounded-full ${
                        conversation.status === 'ACTIVE'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={conversation.status === 'ACTIVE' ? 'Close conversation' : 'Reopen conversation'}
                    >
                      {conversation.status === 'ACTIVE' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>

                    {/* View Details */}
                    <Link
                      to="/conversations/$conversationId"
                      params={{ conversationId: conversation.id }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="View conversation"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Last message preview */}
                {conversation.messages && conversation.messages.length > 0 && (
                  <div className="mt-3 pl-14">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {conversation.messages[0].senderType === 'VISITOR' ? 'Visitor' : 'Agent'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(conversation.messages[0].createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {conversation.messages[0].content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'No conversations match your search.' 
              : 'Conversations will appear here when visitors start chatting on your websites.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {conversationsData && conversationsData.total > conversationsData.limit && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{Math.min(conversationsData.limit, conversationsData.total)}</span> of{' '}
                <span className="font-medium">{conversationsData.total}</span> results
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
