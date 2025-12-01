'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Search, Bell, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';
import ManagePlans from '@/components/admin/ManagePlans';
import UserTable from '@/components/admin/UserTable';
import SubscriptionTable from '@/components/admin/SubscriptionTable';
import LookupPanel from '@/components/admin/LookupPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type TabType = 'users' | 'subscriptions' | 'lookup' | 'notifications' | 'plans';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Subscription {
  id: string;
  status: string;
  accessCode: string;
  startDate: string;
  endDate: string;
  timeSlot: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    isCustom?: boolean;
    startDateTime?: string;
    endDateTime?: string;
  };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  timeUnit: string;
  duration: number;
  isCustom?: boolean;
  notes?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchSubscriptions();
    fetchPlans();
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Poll for subscription updates every 60 seconds (1 minute)
    // This ensures expired subscriptions are automatically updated
    const subscriptionInterval = setInterval(() => {
      fetchSubscriptions();
    }, 60000);
    
    return () => {
      clearInterval(notificationInterval);
      clearInterval(subscriptionInterval);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setNotificationLoading(true);
    try {
      const data = await markNotificationAsRead(notificationId);
      if (data.success) {
        toast.success('Notification marked as read');
        fetchNotifications();
      }
    } catch {
      toast.error('Failed to mark notification as read');
    } finally {
      setNotificationLoading(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'EXPIRING_SOON':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'EXPIRED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'PAYMENT_RECEIVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'EXPIRING_SOON':
        return 'default' as const;
      case 'EXPIRED':
        return 'destructive' as const;
      case 'PAYMENT_RECEIVED':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, subscriptions, and plans
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="inline h-4 w-4 mr-2" />
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('lookup')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'lookup'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="inline h-4 w-4 mr-2" />
          Lookup
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="inline h-4 w-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'plans'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="inline h-4 w-4 mr-2" />
          Plans
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <UserTable users={users} onRefresh={fetchUsers} />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionTable subscriptions={subscriptions} onRefresh={fetchSubscriptions} />
      )}

      {activeTab === 'lookup' && (
        <LookupPanel />
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary">{notifications.length} total</Badge>
            </CardTitle>
            <CardDescription>
              View system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.isRead
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Badge variant={getNotificationBadgeVariant(notification.type)}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">
                          {notification.message}
                        </p>
                        {notification.user && (
                          <p className="text-xs text-gray-600">
                            User: {notification.user.name} ({notification.user.email})
                          </p>
                        )}
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={notificationLoading}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'plans' && (
        <ManagePlans plans={plans} onRefresh={fetchPlans} />
      )}
    </div>
  );
}
