'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface LookupResult {
  user: { 
    id: string; 
    name: string; 
    email: string; 
    phone: string 
  };
  subscription: {
    id: string;
    status: string;
    accessCode: string;
    startDate: string;
    endDate: string;
    timeSlot: string | null;
    createdAt: string;
    isExpired: boolean;
    daysRemaining: number;
  };
  plan: {
    name: string;
    price: number;
    isCustom?: boolean;
    startDateTime?: string;
    endDateTime?: string;
  };
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserSubscription {
  id: string;
  status: string;
  accessCode: string;
  startDate: string;
  endDate: string;
  isExpired: boolean;
  plan: {
    id: string;
    name: string;
    price: number;
    isCustom?: boolean;
  };
}

export default function LookupPanel() {
  const [searchType, setSearchType] = useState<'accessCode' | 'userName'>('accessCode');
  const [accessCode, setAccessCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);

  const handleSearchByAccessCode = async (e: React.FormEvent) => {
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
        toast.error(data.message || 'Access code not found');
      }
    } catch {
      toast.error('Error looking up access code');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUserByName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearchResults([]);
    setUserSubscriptions([]);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/search-users?name=${encodeURIComponent(userName)}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        if (data.data.length === 0) {
          toast.info('No users found with that name');
        }
      } else {
        toast.error('Error searching users');
      }
    } catch {
      toast.error('Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUserSubscriptions(data.data.subscriptions);
        if (data.data.subscriptions.length === 0) {
          toast.info('This user has no subscriptions');
        }
      } else {
        toast.error('Error fetching user subscriptions');
      }
    } catch {
      toast.error('Error fetching user subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (years > 0) parts.push(`${years}yr`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(':') : 'Less than a minute';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>Search by access code or user name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSearchType('accessCode')}
              className={`px-4 py-2 font-medium transition-colors ${
                searchType === 'accessCode'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Access Code
            </button>
            <button
              onClick={() => setSearchType('userName')}
              className={`px-4 py-2 font-medium transition-colors ${
                searchType === 'userName'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By User Name
            </button>
          </div>

          {/* Access Code Search */}
          {searchType === 'accessCode' && (
            <form onSubmit={handleSearchByAccessCode} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Lookup'}
                </Button>
              </div>
            </form>
          )}

          {/* User Name Search */}
          {searchType === 'userName' && (
            <form onSubmit={handleSearchUserByName} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Select a user:</Label>
                  <div className="border rounded-md divide-y">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user.id)}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                          selectedUserId === user.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {/* Access Code Lookup Result */}
      {lookupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Subscription Details
              {/* Use real-time calculation for status badge */}
              <Badge variant={new Date() > new Date(lookupResult.subscription.endDate) ? 'destructive' : 'default'}>
                {new Date() > new Date(lookupResult.subscription.endDate) ? 'EXPIRED' : lookupResult.subscription.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-40">Name:</span>
                  <span className="font-medium">{lookupResult.user.name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">Email:</span>
                  <span className="font-medium">{lookupResult.user.email}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">Phone:</span>
                  <span className="font-medium">{lookupResult.user.phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Subscription Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-40">Plan:</span>
                  <span className="font-medium">{lookupResult.plan.name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">Price:</span>
                  <span className="font-medium">₦{lookupResult.plan.price}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">Access Code:</span>
                  <span className="font-mono font-bold">{lookupResult.subscription.accessCode}</span>
                </div>
                {lookupResult.subscription.timeSlot && (
                  <div className="flex">
                    <span className="text-gray-600 w-40">Time Slot:</span>
                    <span className="font-medium">{lookupResult.subscription.timeSlot}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="text-gray-600 w-40">Start Date & Time:</span>
                  <span className="font-medium">{formatDateTime(lookupResult.subscription.startDate)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">End Date & Time:</span>
                  <span className="font-medium">{formatDateTime(lookupResult.subscription.endDate)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">Time Remaining:</span>
                  <span className={`font-medium ${lookupResult.subscription.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {formatTimeRemaining(lookupResult.subscription.endDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {/* Use real-time calculation instead of backend isExpired field */}
              {new Date() > new Date(lookupResult.subscription.endDate) ? (
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

      {/* User Subscriptions List */}
      {userSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Subscriptions</CardTitle>
            <CardDescription>All subscriptions for selected user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userSubscriptions.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{sub.plan.name}</div>
                    <div className="text-sm text-gray-500">₦{sub.plan.price}</div>
                  </div>
                  {/* Use real-time calculation for status badge */}
                  <Badge variant={new Date() > new Date(sub.endDate) ? 'destructive' : 'default'}>
                    {new Date() > new Date(sub.endDate) ? 'EXPIRED' : sub.status}
                  </Badge>
                </div>
                  <div className="text-sm space-y-1">
                    <div className="flex">
                      <span className="text-gray-600 w-32">Access Code:</span>
                      <span className="font-mono font-bold">{sub.accessCode}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-32">Start Date & Time:</span>
                      <span>{formatDateTime(sub.startDate)}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-32">End Date & Time:</span>
                      <span>{formatDateTime(sub.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
