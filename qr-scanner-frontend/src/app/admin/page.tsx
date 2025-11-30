'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, FileText, Search, CheckCircle, AlertCircle, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';
import ManagePlans from '@/components/admin/ManagePlans';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'create-user' | 'create-subscription' | 'lookup' | 'notifications' | 'manage-plans'>('create-user');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // User Creation State
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: ''
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
      timeSlot: string | null;
      createdAt: string;
      isExpired: boolean; 
      daysRemaining: number 
    };
    plan: { 
      name: string; 
      price: number; 
      isCustom?: boolean;
      startDateTime?: string;
      endDateTime?: string;
    };
  } | null>(null);

  // Helper function to get expected start/end times based on timeSlot
  const getExpectedTimes = (timeSlot: string | null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    switch (timeSlot) {
      case 'MORNING':
        return {
          start: new Date(year, month, day, 8, 0, 0, 0),
          end: new Date(year, month, day, 12, 0, 0, 0)
        };
      case 'AFTERNOON':
        return {
          start: new Date(year, month, day, 12, 0, 0, 0),
          end: new Date(year, month, day, 17, 0, 0, 0)
        };
      case 'NIGHT':
        return {
          start: new Date(year, month, day, 17, 0, 0, 0),
          end: new Date(year, month, day, 23, 59, 59, 999)
        };
      default:
        // All day
        return {
          start: new Date(year, month, day, 0, 0, 0, 0),
          end: new Date(year, month, day, 23, 59, 59, 999)
        };
    }
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
    parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
    parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(' ');
  };

  // Helper function to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Plans State
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number; isCustom?: boolean }>>([]);
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
      const response = await fetch(`${API_URL}/api/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

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
      console.log("adminToken", adminToken);
      const response = await fetch(`${API_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      console.log('Create User Response:', data);

      if (data.success) {
        toast.success(`User created: ${data.data.name} (${data.data.email})`);
        setUserData({ name: '', email: '', phone: '' });
        fetchUsers();
      } else {
        toast.error(`Failed to create user: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error creating user: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(subscriptionData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Subscription created! Access Code: ${data.data.accessCode}`, {
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
        toast.error(`Failed to create subscription: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error creating subscription: ${errorMsg}`);
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
      const response = await fetch(`${API_URL}/api/admin/user-by-access-code/${accessCode}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setLookupResult(data.data);
        toast.success('Access code found!');
      } else {
        toast.error(`Access code not found: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error looking up access code: ${errorMsg}`);
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
        <button
          onClick={() => setActiveTab('manage-plans')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'manage-plans'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="inline h-4 w-4 mr-2" />
          Manage Plans
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
                {/* Only show time slot for system plans */}
                {(() => {
                  const selectedPlan = plans.find(p => p.id === subscriptionData.planId);
                  const isCustomPlan = selectedPlan?.isCustom || false;
                  
                  if (!isCustomPlan && subscriptionData.planId) {
                    return (
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
                    );
                  }
                  return null;
                })()}
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
        <div className="space-y-4 max-w-[1100px]">
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
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Name:</span>
                      <span className="font-medium">{lookupResult.user.name}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Email:</span>
                      <span className="font-medium">{lookupResult.user.email}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Phone:</span>
                      <span className="font-medium">{lookupResult.user.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <h3 className="font-semibold mb-2">Subscription Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Plan:</span>
                      <span className="font-medium">{lookupResult.plan.name}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Price:</span>
                      <span className="font-medium">₦{lookupResult.plan.price}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Access Code:</span>
                      <span className="font-mono font-bold text-lg">{lookupResult.subscription.accessCode}</span>
                    </div>
                    {/* Time information display - different for custom vs system plans */}
                    {lookupResult.plan.isCustom ? (
                      // Custom plan - show datetime range
                      <>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Access Period:</span>
                          <span className="font-medium">
                            {lookupResult.plan.startDateTime && lookupResult.plan.endDateTime
                              ? `${new Date(lookupResult.plan.startDateTime).toLocaleString()} - ${new Date(lookupResult.plan.endDateTime).toLocaleString()}`
                              : 'Custom Schedule'}
                          </span>
                        </div>
                        {lookupResult.plan.endDateTime && (
                          <div className="flex">
                            <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Time Remaining:</span>
                            <span className={`font-medium ${lookupResult.subscription.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                              {formatTimeRemaining(new Date(lookupResult.plan.endDateTime))}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      // System plan - show time slot and daily times
                      <>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Time Slot:</span>
                          <span className="font-medium">{lookupResult.subscription.timeSlot || 'All Day'}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Expected Start Time:</span>
                          <span className="font-medium">{formatTime(getExpectedTimes(lookupResult.subscription.timeSlot).start)}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Actual Start Time:</span>
                          <span className="font-medium">{new Date(lookupResult.subscription.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">End Time:</span>
                          <span className="font-medium">{formatTime(getExpectedTimes(lookupResult.subscription.timeSlot).end)}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-48 sm:w-64 flex-shrink-0">Time Remaining:</span>
                          <span className={`font-medium ${lookupResult.subscription.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                            {formatTimeRemaining(getExpectedTimes(lookupResult.subscription.timeSlot).end)}
                          </span>
                        </div>
                      </>
                    )}
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

      {/* Manage Plans Tab */}
      {activeTab === 'manage-plans' && (
        <ManagePlans plans={plans} onRefresh={fetchPlans} />
      )}
    </div>
  );
}
