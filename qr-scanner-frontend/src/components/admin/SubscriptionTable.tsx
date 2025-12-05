'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import SubscriptionModal from './SubscriptionModal';

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

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onRefresh: () => void;
}

export default function SubscriptionTable({ subscriptions, onRefresh }: SubscriptionTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Sort subscriptions by creation date (newest first)
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Use the pagination hook with sorted subscriptions
  const {
    paginatedItems: paginatedSubscriptions,
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(sortedSubscriptions, { initialItemsPerPage: 10 });

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
  };

  const getStatusBadge = (status: string, isExpired?: boolean) => {
    // Use isExpired as source of truth - if expired, show Expired regardless of DB status
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      case 'IN_GRACE_PERIOD':
        return <Badge variant="secondary">Grace Period</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Subscriptions</h2>
          <p className="text-sm text-gray-600">View all user subscriptions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Access Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {subscriptions.length === 0 ? 'No subscriptions found' : 'No subscriptions on this page'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.user.name}</div>
                      <div className="text-xs text-gray-500">{subscription.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.plan.name}</div>
                      <div className="text-xs text-gray-500">₦{subscription.plan.price}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="font-mono font-bold">{subscription.accessCode}</code>
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status, new Date() > new Date(subscription.endDate))}</TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDateTime(subscription.createdAt)}</div>
                  </TableCell>
                  <TableCell>{formatDateTime(subscription.startDate)}</TableCell>
                  <TableCell>{formatDateTime(subscription.endDate)}</TableCell>
                  <TableCell>
                    {subscription.plan.isCustom ? (
                      <Badge variant="outline">Custom</Badge>
                    ) : (
                      subscription.timeSlot || 'All Day'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(subscription)}
                      className="whitespace-nowrap"
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet List View */}
      <div className="block lg:hidden space-y-4">
        {paginatedSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            {subscriptions.length === 0 ? 'No subscriptions found' : 'No subscriptions on this page'}
          </div>
        ) : (
          paginatedSubscriptions.map((subscription) => (
            <div key={subscription.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-base">{subscription.user.name}</div>
                  <div className="text-xs text-gray-500">{subscription.user.email}</div>
                </div>
                {getStatusBadge(subscription.status, new Date() > new Date(subscription.endDate))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{subscription.plan.name} (₦{subscription.plan.price})</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Code:</span>
                  <code className="font-mono font-bold text-xs">{subscription.accessCode}</code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-xs">{formatDateTime(subscription.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Start:</span>
                  <span className="text-xs">{formatDateTime(subscription.startDate)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">End:</span>
                  <span className="text-xs">{formatDateTime(subscription.endDate)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Slot:</span>
                  <span>
                    {subscription.plan.isCustom ? (
                      <Badge variant="outline">Custom</Badge>
                    ) : (
                      subscription.timeSlot || 'All Day'
                    )}
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(subscription)}
                className="w-full"
              >
                <Eye className="h-3 w-3 mr-2" />
                View Details
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />

      {/* View Details Dialog */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedSubscription(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Subscription Details</h3>
              {getStatusBadge(selectedSubscription.status, new Date() > new Date(selectedSubscription.endDate))}
            </div>
            
            <div className="space-y-4">
              {/* User Information */}
              <div>
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Name:</span>
                    <span className="font-medium break-words text-right sm:text-left">{selectedSubscription.user.name}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Email:</span>
                    <span className="font-medium break-words text-right sm:text-left">{selectedSubscription.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div>
                <h4 className="font-semibold mb-2">Subscription Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Plan:</span>
                    <span className="font-medium break-words text-right sm:text-left">{selectedSubscription.plan.name}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Price:</span>
                    <span className="font-medium">₦{selectedSubscription.plan.price}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Access Code:</span>
                    <span className="font-mono font-bold break-all">{selectedSubscription.accessCode}</span>
                  </div>
                  {selectedSubscription.timeSlot && (
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-600 sm:w-40">Time Slot:</span>
                      <span className="font-medium">{selectedSubscription.timeSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Start Date:</span>
                    <span className="font-medium break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(selectedSubscription.startDate)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">End Date:</span>
                    <span className="font-medium break-words text-right sm:text-left text-xs sm:text-sm">{formatDateTime(selectedSubscription.endDate)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-2">
                    <span className="text-gray-600 sm:w-40">Time Left:</span>
                    <span className={`font-medium break-words text-right sm:text-left ${new Date() > new Date(selectedSubscription.endDate) ? 'text-red-600' : 'text-green-600'}`}>
                      {formatTimeRemaining(selectedSubscription.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-2 p-3 rounded ${new Date() > new Date(selectedSubscription.endDate) ? 'bg-red-50' : 'bg-green-50'}`}>
                {new Date() > new Date(selectedSubscription.endDate) ? (
                  <>
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-red-700">Subscription Expired</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">Subscription Active</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedSubscription(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
