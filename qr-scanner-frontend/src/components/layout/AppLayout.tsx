'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ScanLine,
  History,
  Users,
  Menu,
  X,
  Settings
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: pathname === '/',
    },
    {
      name: 'QR Scanner',
      href: '/scanner',
      icon: ScanLine,
      current: pathname === '/scanner',
    },
    {
      name: 'Access Logs',
      href: '/access-logs',
      icon: History,
      current: pathname === '/access-logs',
    },
    {
      name: 'Capacity Monitor',
      href: '/capacity',
      icon: Users,
      current: pathname === '/capacity',
    },
    {
      name: 'Admin Scanner',
      href: '/scanner/admin',
      icon: Settings,
      current: pathname === '/scanner/admin',
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
                Seb&apos;s Hub Scanner
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

            {/* Status Information */}
            <div className="p-4 border-t">
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Mode:</span>
                  <span className="text-blue-600 font-medium">Scanner Ready</span>
                </div>
              </div>
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
