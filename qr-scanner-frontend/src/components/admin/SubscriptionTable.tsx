'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus } from 'lucide-react';
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

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
  };

  const getStatusBadge = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscriptions</h2>
          <p className="text-sm text-gray-600">View all user subscriptions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Access Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
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
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>{formatDate(subscription.endDate)}</TableCell>
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
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />

      {/* View Details Dialog - TODO: implement if needed */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Subscription Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="text-gray-600 w-40">User:</span>
                <span className="font-medium">{selectedSubscription.user.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Plan:</span>
                <span className="font-medium">{selectedSubscription.plan.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Access Code:</span>
                <span className="font-mono font-bold">{selectedSubscription.accessCode}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Status:</span>
                {getStatusBadge(selectedSubscription.status)}
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
