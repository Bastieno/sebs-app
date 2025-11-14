'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, FileText, Search, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'create-user' | 'create-subscription' | 'lookup' | 'notifications'>('create-user');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // User Creation State
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Subscription Creation State
  const [subscriptionData, setSubscriptionData] = useState({
    userId: '',
    planId: '',
    timeSlot: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    adminNotes: ''
  });

  // Access Code Lookup State
  const [accessCode, setAccessCode] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    user: { id: string; name: string; email: string; phone: string };
    subscription: { 
      id: string; 
      status: string; 
      accessCode: string; 
      startDate: string; 
      endDate: string; 
      isExpired: boolean; 
      daysRemaining: number 
    };
    plan: { name: string; price: number };
  } | null>(null);

  // Plans State
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Fetch plans, users, and notifications on component mount
  useEffect(() => {
    fetchPlans();
    fetchUsers();
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/users`, {
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
    } catch (error) {
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User created successfully!', {
          description: `User: ${data.data.name} (${data.data.email})`
        });
        setUserData({ name: '', email: '', phone: '', password: '' });
        fetchUsers();
      } else {
        toast.error('Failed to create user', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error creating user', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(subscriptionData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription created and activated!', {
          description: `Access Code: ${data.data.accessCode}`,
          duration: 10000
        });
        setSubscriptionData({
          userId: '',
          planId: '',
          timeSlot: '',
          startDate: new Date().toISOString().split('T')[0],
          paymentMethod: '',
          adminNotes: ''
        });
      } else {
        toast.error('Failed to create subscription', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error creating subscription', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookupAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLookupResult(null);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/user-by-access-code/${accessCode}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setLookupResult(data.data);
        toast.success('Access code found!');
      } else {
        toast.error('Access code not found', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('Error looking up access code', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users and subscriptions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('create-user')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'create-user'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserPlus className="inline h-4 w-4 mr-2" />
          Create User
        </button>
        <button
          onClick={() => setActiveTab('create-subscription')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'create-subscription'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="inline h-4 w-4 mr-2" />
          Create Subscription
        </button>
        <button
          onClick={() => setActiveTab('lookup')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'lookup'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="inline h-4 w-4 mr-2" />
          Lookup Access Code
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium transition-colors relative ${
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
      </div>

      {/* Create User Form */}
      {activeTab === 'create-user' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+2348012345678"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create Subscription Form */}
      {activeTab === 'create-subscription' && (
        <Card>
          <CardHeader>
            <CardTitle>Create & Activate Subscription</CardTitle>
            <CardDescription>
              Create and activate a subscription in one step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Select User *</Label>
                  <select
                    id="userId"
                    className="w-full px-3 py-2 border rounded-md"
                    value={subscriptionData.userId}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, userId: e.target.value })}
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planId">Select Plan *</Label>
                  <select
                    id="planId"
                    className="w-full px-3 py-2 border rounded-md"
                    value={subscriptionData.planId}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, planId: e.target.value })}
                    required
                  >
                    <option value="">Select a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₦{plan.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={subscriptionData.startDate}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot</Label>
                  <select
                    id="timeSlot"
                    className="w-full px-3 py-2 border rounded-md"
                    value={subscriptionData.timeSlot}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, timeSlot: e.target.value })}
                  >
                    <option value="">All Day</option>
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    placeholder="e.g., Cash, Transfer"
                    value={subscriptionData.paymentMethod}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, paymentMethod: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Input
                    id="adminNotes"
                    placeholder="Optional notes"
                    value={subscriptionData.adminNotes}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, adminNotes: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create & Activate Subscription'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Access Code Lookup */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lookup by Access Code</CardTitle>
              <CardDescription>
                Enter the 6-digit access code to view user and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookupAccessCode} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Lookup'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lookup Results */}
          {lookupResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Subscription Details
                  <Badge variant={lookupResult.subscription.isExpired ? 'destructive' : 'default'}>
                    {lookupResult.subscription.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Name:</div>
                    <div className="font-medium">{lookupResult.user.name}</div>
                    <div className="text-gray-600">Email:</div>
                    <div className="font-medium">{lookupResult.user.email}</div>
                    <div className="text-gray-600">Phone:</div>
                    <div className="font-medium">{lookupResult.user.phone}</div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <h3 className="font-semibold mb-2">Subscription Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Plan:</div>
                    <div className="font-medium">{lookupResult.plan.name}</div>
                    <div className="text-gray-600">Price:</div>
                    <div className="font-medium">₦{lookupResult.plan.price}</div>
                    <div className="text-gray-600">Access Code:</div>
                    <div className="font-mono font-bold text-lg">{lookupResult.subscription.accessCode}</div>
                    <div className="text-gray-600">Start Date:</div>
                    <div className="font-medium">{new Date(lookupResult.subscription.startDate).toLocaleDateString()}</div>
                    <div className="text-gray-600">End Date:</div>
                    <div className="font-medium">{new Date(lookupResult.subscription.endDate).toLocaleDateString()}</div>
                    <div className="text-gray-600">Days Remaining:</div>
                    <div className={`font-medium ${lookupResult.subscription.daysRemaining <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {lookupResult.subscription.daysRemaining} days
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  {lookupResult.subscription.isExpired ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Subscription Expired</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Subscription Active</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Notifications Tab */}
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
    </div>
  );
}
