'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime, formatTimeRemaining } from '@/lib/dateUtils';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  // Use the pagination hook for user subscriptions
  const {
    paginatedItems: paginatedSubscriptions,
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(userSubscriptions, { initialItemsPerPage: 10 });

  const handleSearchByAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLookupResult(null);
    setSearchResults([]);
    setUserSubscriptions([]);
    setSelectedUserId('');

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

  // Debounced search function
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/search-users?name=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        setShowDropdown(data.data.length > 0);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch {
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    if (searchType !== 'userName') return;
    
    // Skip search if we just selected a user
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers(userName);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userName, searchType, searchUsers]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = async (userId: string, userName: string) => {
    skipSearchRef.current = true; // Skip the next search triggered by userName change
    setSelectedUserId(userId);
    setUserName(userName);
    setShowDropdown(false);
    setSearchResults([]); // Clear search results to prevent dropdown from reopening
    setLoading(true);
    setUserSubscriptions([]);

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
              onClick={() => {
                setSearchType('accessCode');
                setSearchResults([]);
                setUserSubscriptions([]);
                setSelectedUserId('');
                setLookupResult(null);
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                searchType === 'accessCode'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Access Code
            </button>
            <button
              onClick={() => {
                setSearchType('userName');
                setLookupResult(null);
                setSearchResults([]);
                setUserSubscriptions([]);
                setSelectedUserId('');
              }}
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

          {/* User Name Search with Autocomplete */}
          {searchType === 'userName' && (
            <div className="space-y-4" ref={dropdownRef}>
              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder="Start typing to search for a user..."
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setUserSubscriptions([]);
                      setSelectedUserId('');
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-90 overflow-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user.id, user.name)}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                          selectedUserId === user.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Name:</span>
                  <span className="font-medium break-words text-right sm:text-left">{lookupResult.user.name}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Email:</span>
                  <span className="font-medium break-words text-right sm:text-left">{lookupResult.user.email}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Phone:</span>
                  <span className="font-medium break-words text-right sm:text-left">{lookupResult.user.phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Subscription Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Plan:</span>
                  <span className="font-medium break-words text-right sm:text-left">{lookupResult.plan.name}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Price:</span>
                  <span className="font-medium">₦{lookupResult.plan.price}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Access Code:</span>
                  <span className="font-mono font-bold break-all">{lookupResult.subscription.accessCode}</span>
                </div>
                {lookupResult.subscription.timeSlot && (
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Time Slot:</span>
                    <span className="font-medium">{lookupResult.subscription.timeSlot}</span>
                  </div>
                )}
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Start Date:</span>
                  <span className="font-medium break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(lookupResult.subscription.startDate)}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">End Date:</span>
                  <span className="font-medium break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(lookupResult.subscription.endDate)}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-2">
                  <span className="text-gray-600 sm:w-40">Time Left:</span>
                  <span className={`font-medium break-words text-right sm:text-left ${lookupResult.subscription.isExpired ? 'text-red-600' : 'text-green-600'}`}>
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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {paginatedSubscriptions.map((sub) => (
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
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-600 sm:w-32">Access Code:</span>
                      <span className="font-mono font-bold break-all">{sub.accessCode}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-600 sm:w-32">Start Date:</span>
                      <span className="break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(sub.startDate)}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-600 sm:w-32">End Date:</span>
                      <span className="break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(sub.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              totalItems={totalItems}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
