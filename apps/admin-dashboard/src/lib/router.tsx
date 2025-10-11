import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/router'
import { DashboardLayout } from '../components/dashboard-layout'
import { LoginPage } from '../pages/login'
import { RegisterPage } from '../pages/register'
import { DashboardPage } from '../pages/dashboard'

// Root route
export const rootRoute = createRootRoute({
  component: () => {
    return (
      <div id="app">
        {/* Router outlet will be rendered here */}
      </div>
    )
  },
})

// Auth guard function
const requireAuth = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    throw redirect({ to: '/login' })
  }
}

// Public routes (no auth required)
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem('accessToken')
    if (token) {
      throw redirect({ to: '/dashboard' })
    }
  },
})

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
  beforeLoad: () => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem('accessToken')
    if (token) {
      throw redirect({ to: '/dashboard' })
    }
  },
})

// Protected layout route
export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardLayout,
  beforeLoad: requireAuth,
})

// Dashboard route
export const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
})

// Redirect root to dashboard
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
  component: () => import('../pages/DashboardPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const websitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/websites',
  component: () => import('../pages/WebsitesPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const websiteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/websites/$websiteId',
  component: () => import('../pages/WebsiteDetailPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const conversationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/conversations',
  component: () => import('../pages/ConversationsPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const conversationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/conversations/$conversationId',
  component: () => import('../pages/ConversationDetailPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: () => import('../pages/AnalyticsPage').then(m => m.default),
  beforeLoad: requireAuth,
})

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => import('../pages/SettingsPage').then(m => m.default),
  beforeLoad: requireAuth,
})

// Index route - redirect to dashboard
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (adminAPI.isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  protectedRoute.addChildren([dashboardRoute]),
])

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Default error component
  defaultErrorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error occurred</h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload page
        </button>
      </div>
    </div>
  ),
})
      </div>
    </div>
  ),
  // Default pending component
  defaultPendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    </div>
  ),
})

// Add router to window for debugging
declare global {
  interface Window {
    router: typeof router
  }
}

if (typeof window !== 'undefined') {
  window.router = router
}
