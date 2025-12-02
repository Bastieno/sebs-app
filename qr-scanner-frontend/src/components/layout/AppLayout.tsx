'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Shield,
  Menu,
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  // Don't show sidebar on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: pathname === '/',
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      current: pathname === '/admin',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Mobile menu button */}
        {!sidebarOpen && (
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <Button
              variant="default"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-white border border-gray-200 text-gray-900 shadow-sm hover:bg-gray-50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 h-screen lg:h-screen`}
        >
          <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link
                href="/"
                className="text-lg font-semibold text-gray-900 hover:text-gray-700"
              >
                Seb&apos;s Hub Admin
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Button
                      variant={item.current ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Information & Logout */}
            <div className="p-4 border-t space-y-3">
              {user && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {user.role}
                    </span>
                    <span className="text-xs text-green-600">● Online</span>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 lg:h-screen lg:overflow-hidden">
          <div className="lg:h-full lg:overflow-y-auto">
            <div className="p-4 lg:p-8 pt-16 lg:pt-4 lg:pb-2">{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
