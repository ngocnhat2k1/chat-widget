import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { socketService } from "../lib/socket";
import {
  LayoutDashboard,
  Globe,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Websites", href: "/websites", icon: Globe },
  { name: "Conversations", href: "/conversations", icon: MessageCircle },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings/workspace", icon: Settings },
];

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<number>(0);
  const { user, logout } = useAuth();
  const { currentWorkspaceId, isLoading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();

  // Connect (and reconnect) the realtime socket to the active workspace.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !currentWorkspaceId) return;

    socketService.connect(token, currentWorkspaceId);

    const handleNewMessage = () => {
      setNotifications((prev) => prev + 1);
      toast.success("New message received!");
    };

    const handleNewConversation = () => {
      setNotifications((prev) => prev + 1);
      toast.success("New conversation started!");
    };

    socketService.onMessageNotification(handleNewMessage);
    socketService.onNewConversation(handleNewConversation);

    return () => {
      socketService.offMessageNotification(handleNewMessage);
      socketService.offNewConversation(handleNewConversation);
      socketService.disconnect();
    };
  }, [currentWorkspaceId]);

  const handleLogout = async () => {
    await logout();
    socketService.disconnect();
    navigate({ to: "/login" });
  };

  const clearNotifications = () => {
    setNotifications(0);
  };

  // Scoped pages query by the active workspace (via the X-Workspace-Id header).
  // Hold rendering until a workspace is selected so those requests aren't fired
  // without scope (which the backend rejects with 403).
  if (workspaceLoading || !currentWorkspaceId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center text-gray-500">
          <Building2 className="h-5 w-5 mr-2 animate-pulse" />
          Đang tải workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <nav
          className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto transition ease-in-out duration-300 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                ChatWidget
              </span>
            </div>
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <SidebarNavigation clearNotifications={clearNotifications} />
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <nav className="flex flex-col flex-1 bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                ChatWidget
              </span>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <SidebarNavigation clearNotifications={clearNotifications} />
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top nav */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {user?.email}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Workspace switcher */}
              <WorkspaceSwitcher />

              {/* Notifications */}
              <button
                onClick={clearNotifications}
                className="relative p-1 bg-gray-50 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Bell className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications > 9 ? "9+" : notifications}
                  </span>
                )}
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (!currentWorkspace) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center max-w-[200px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
        <span className="truncate">{currentWorkspace.name}</span>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Workspaces
            </p>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  switchWorkspace(ws.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex flex-col items-start min-w-0">
                  <span className="truncate w-full text-left">{ws.name}</span>
                  <span className="text-xs text-gray-400">{ws.role}</span>
                </span>
                {ws.id === currentWorkspace.id && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1">
              <Link
                to="/settings/workspace"
                onClick={() => setOpen(false)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2 text-gray-400" />
                Workspace settings
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarNavigation({
  clearNotifications,
}: {
  clearNotifications: () => void;
}) {
  return (
    <nav className="px-2 space-y-1">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={clearNotifications}
          className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          activeProps={{
            className:
              "bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md",
          }}
        >
          <item.icon className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6" />
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
