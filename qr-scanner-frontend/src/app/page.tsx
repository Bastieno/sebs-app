'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import SubscriptionTable from '@/components/admin/SubscriptionTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

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

type StatusFilter = 'all' | 'active' | 'expired';

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [subscriptions, statusFilter, dateRange]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...subscriptions];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => {
        const isExpired = new Date() > new Date(sub.endDate);
        if (statusFilter === 'active') {
          return !isExpired;
        } else if (statusFilter === 'expired') {
          return isExpired;
        }
        return true;
      });
    }

    // Apply date range filter - show subscriptions that overlap with the selected date range
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      filtered = filtered.filter(sub => {
        const subEndDate = new Date(sub.endDate);
        // Subscription must still be running on or after the "from" date
        return subEndDate >= fromDate;
      });
    }

    if (dateRange?.to) {
      const toDate = dateRange.to;
      const filterEndDate = new Date(toDate);
      filterEndDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sub => {
        const subStartDate = new Date(sub.startDate);
        // Subscription must have started on or before the "to" date
        return subStartDate <= filterEndDate;
      });
    }

    setFilteredSubscriptions(filtered);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateRange(undefined);
  };

  const formatDateRange = () => {
    if (!dateRange?.from && !dateRange?.to) return 'Select date range';
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    if (dateRange?.from) return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    if (dateRange?.to) return `To ${format(dateRange.to, 'MMM d, yyyy')}`;
    return 'Select date range';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Track and manage all subscriptions</p>
      </div>

      {/* Compact Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-4">
            {/* Status Filter */}
            <div className="space-y-2 w-full sm:min-w-[180px] sm:w-auto">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="expired">Expired Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-2 w-full sm:min-w-[280px] sm:w-auto">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-w-none max-h-[85vh] overflow-y-auto" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={isMobile ? 1 : 2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={
                statusFilter === "all" && !dateRange?.from && !dateRange?.to
              }
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>

            {/* Filter Summary */}
            <div className="w-full sm:w-auto sm:ml-auto text-sm text-gray-600 text-center sm:text-left">
              Showing{" "}
              <span className="font-semibold">
                {filteredSubscriptions.length}
              </span>{" "}
              of <span className="font-semibold">{subscriptions.length}</span>{" "}
              subscriptions
              {(statusFilter !== "all" || dateRange?.from || dateRange?.to) && (
                <span className="text-blue-600 ml-1">(Filtered)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading subscriptions...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SubscriptionTable
          subscriptions={filteredSubscriptions}
          onRefresh={fetchSubscriptions}
        />
      )}
    </div>
  );
}
