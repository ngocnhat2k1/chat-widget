import React, { useState } from 'react'
import SidebarLayout from '../components/SidebarLayout'
import { useWebsites, useCreateWebsite, useDeleteWebsite, useApiKeys, useCreateApiKey } from '../lib/hooks'
import { 
  Plus, 
  Globe, 
  Copy, 
  Trash2, 
  Eye,
  EyeOff,
  Key,
  Calendar,
  Users,
  MessageSquare,
  ExternalLink
} from 'lucide-react'

interface CreateWebsiteModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateWebsiteModal({ isOpen, onClose }: CreateWebsiteModalProps) {
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  
  const createWebsiteMutation = useCreateWebsite()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createWebsiteMutation.mutateAsync({ domain, name })
      setDomain('')
      setName('')
      onClose()
    } catch (error) {
      // Error handled by hook
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Thêm Website Mới
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Tên Website
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ví dụ: Website của tôi"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                        Domain
                      </label>
                      <input
                        type="text"
                        id="domain"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createWebsiteMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {createWebsiteMutation.isPending ? 'Đang tạo...' : 'Tạo Website'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface WebsiteCardProps {
  website: any
  onDelete: (id: string) => void
}

function WebsiteCard({ website, onDelete }: WebsiteCardProps) {
  const [showApiKeys, setShowApiKeys] = useState(false)
  const { data: apiKeys } = useApiKeys(website.id)
  const createApiKeyMutation = useCreateApiKey()

  const handleCreateApiKey = async () => {
    try {
      await createApiKeyMutation.mutateAsync({
        websiteId: website.id,
        name: `API Key ${new Date().toLocaleDateString('vi-VN')}`
      })
    } catch (error) {
      // Error handled by hook
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You would show a toast here
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
            <p className="text-sm text-gray-500">{website.domain}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(`https://${website.domain}`, '_blank')}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(website.id)}
            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{website._count?.conversations || 0}</p>
          <p className="text-xs text-gray-500">Cuộc trò chuyện</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{website._count?.apiKeys || 0}</p>
          <p className="text-xs text-gray-500">API Keys</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-green-600">Hoạt động</p>
          <p className="text-xs text-gray-500">Trạng thái</p>
        </div>
      </div>

      {/* API Keys section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Key className="w-4 h-4 mr-2" />
            API Keys ({apiKeys?.length || 0})
            {showApiKeys ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
          </button>
          
          <button
            onClick={handleCreateApiKey}
            disabled={createApiKeyMutation.isPending}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded flex items-center disabled:opacity-50"
          >
            <Plus className="w-3 h-3 mr-1" />
            Tạo mới
          </button>
        </div>

        {showApiKeys && (
          <div className="space-y-2">
            {apiKeys?.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div>
                  <p className="text-xs font-medium text-gray-900">{apiKey.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">
                    Tạo: {new Date(apiKey.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(apiKey.key || apiKey.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </button>
              </div>
            ))}
            {(!apiKeys || apiKeys.length === 0) && (
              <p className="text-xs text-gray-500 text-center py-2">Chưa có API key nào</p>
            )}
          </div>
        )}
      </div>

      {/* Created date */}
      <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-xs text-gray-500">
          Tạo ngày {new Date(website.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  )
}

export default function WebsitesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const { data: websites, isLoading } = useWebsites()
  const deleteWebsiteMutation = useDeleteWebsite()

  const handleDeleteWebsite = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa website này? Tất cả dữ liệu liên quan sẽ bị mất.')) {
      try {
        await deleteWebsiteMutation.mutateAsync(id)
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Websites</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Websites</h1>
            <p className="text-gray-600 mt-1">
              Quản lý các website và chat widget của bạn
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Website
          </button>
        </div>

        {/* Websites grid */}
        {websites && websites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                onDelete={handleDeleteWebsite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có website nào</h3>
            <p className="text-gray-500 mb-6">
              Hãy thêm website đầu tiên để bắt đầu sử dụng chat widget
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Website Đầu Tiên
            </button>
          </div>
        )}

        {/* Create website modal */}
        <CreateWebsiteModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </SidebarLayout>
  )
}
