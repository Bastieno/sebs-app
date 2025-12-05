'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  isCustom?: boolean;
  planType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TEAM' | 'CUSTOM' | null;
  defaultTimeSlot?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ALL' | null;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  // Helper function to get local datetime string for datetime-local input
  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    timeSlot: '',
    startDate: getLocalDateTimeString(), // Format: YYYY-MM-DDTHH:mm in local time
    paymentMethod: '',
    adminNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPlans();
      // Update start date to current date and time when modal opens
      setFormData(prev => ({
        ...prev,
        startDate: getLocalDateTimeString()
      }));
    }
  }, [isOpen]);

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
        // Filter to only show users with role "USER"
        const regularUsers = data.data.filter((user: User) => user.role === 'USER');
        setUsers(regularUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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

  // Helper function to validate DAILY plans based on current time
  const validateDailyPlanTime = (plan: Plan | undefined, startDate: string): { valid: boolean; message?: string } => {
    if (!plan || plan.planType !== 'DAILY' || !plan.defaultTimeSlot) {
      return { valid: true };
    }

    const selectedDate = new Date(startDate);
    const selectedHour = selectedDate.getHours();

    const TIME_WINDOWS = {
      MORNING: { start: 8, end: 12, text: '8:00 AM - 11:59 AM' },
      AFTERNOON: { start: 12, end: 17, text: '12:00 PM - 4:59 PM' },
      NIGHT: { start: 18, end: 6, text: '6:00 PM - 5:59 AM' }
    };

    const timeWindow = TIME_WINDOWS[plan.defaultTimeSlot as keyof typeof TIME_WINDOWS];
    if (!timeWindow) return { valid: true };

    let isValidTime = false;
    
    if (plan.defaultTimeSlot === 'NIGHT') {
      // Night spans across midnight (6pm - 6am)
      isValidTime = selectedHour >= timeWindow.start || selectedHour < timeWindow.end;
    } else {
      // Morning and Afternoon
      isValidTime = selectedHour >= timeWindow.start && selectedHour < timeWindow.end;
    }

    if (!isValidTime) {
      return {
        valid: false,
        message: `${plan.name} can only be created during ${timeWindow.text}. Please use a Custom Plan for different times.`
      };
    }

    return { valid: true };
  };

  // Get time slot info for display
  const getTimeSlotInfo = (plan: Plan | undefined): { slot: string; display: string; canEdit: boolean } => {
    if (!plan) {
      return { slot: '', display: 'Anytime', canEdit: true };
    }

    // Custom plans allow manual selection
    if (plan.isCustom) {
      return { 
        slot: formData.timeSlot || 'ALL', 
        display: formData.timeSlot || 'Anytime',
        canEdit: true 
      };
    }

    // Standard Monthly plan allows time slot selection
    if (plan.name === 'Standard Monthly') {
      return {
        slot: formData.timeSlot || 'ALL',
        display: formData.timeSlot || 'Anytime',
        canEdit: true
      };
    }

    // System plans auto-assign based on defaultTimeSlot
    if (plan.defaultTimeSlot) {
      const slotNames: Record<string, string> = {
        MORNING: 'Morning (8am-12pm)',
        AFTERNOON: 'Afternoon (12pm-5pm)',
        NIGHT: 'Night (6pm-6am)',
        ALL: 'Anytime'
      };
      return { 
        slot: plan.defaultTimeSlot, 
        display: slotNames[plan.defaultTimeSlot] || plan.defaultTimeSlot,
        canEdit: false 
      };
    }

    return { slot: 'ALL', display: 'Anytime', canEdit: false };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate DAILY plans against time windows
    const validation = validateDailyPlanTime(selectedPlan, formData.startDate);
    if (!validation.valid) {
      setValidationError(validation.message || 'Invalid time for this plan');
      return;
    }

    // Clear validation error if previously set
    setValidationError('');
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Subscription created! Access Code: ${data.data.accessCode}`, {
          duration: 10000
        });
        onSuccess();
        onClose();
        setFormData({
          userId: '',
          planId: '',
          timeSlot: '',
          startDate: getLocalDateTimeString(),
          paymentMethod: '',
          adminNotes: ''
        });
      } else {
        setValidationError(data.message || 'Failed to create subscription');
      }
    } catch {
      setValidationError('An error occurred while creating the subscription');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);
  const timeSlotInfo = getTimeSlotInfo(selectedPlan);

  // Filter users based on search input
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Get selected user for display
  const selectedUser = users.find(u => u.id === formData.userId);

  // Filter plans based on search input
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(planSearch.toLowerCase()) ||
    plan.price.toString().includes(planSearch)
  );

  // Clear validation error when plan changes
  useEffect(() => {
    setValidationError('');
  }, [formData.planId, formData.startDate]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setFormData({ ...formData, userId: user.id });
    setUserSearch(user.name);
    setShowUserDropdown(false);
  };

  // Handle plan selection
  const handlePlanSelect = (plan: Plan) => {
    setFormData({ ...formData, planId: plan.id });
    setPlanSearch(plan.name);
    setShowPlanDropdown(false);
  };

  // Reset search fields when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserSearch('');
      setShowUserDropdown(false);
      setPlanSearch('');
      setShowPlanDropdown(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Subscription</DialogTitle>
          <DialogDescription>
            Create and activate a new subscription
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <div className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                <div>
                  <p className="font-medium">Time Window Restriction</p>
                  <p className="text-sm mt-1">{validationError}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="userId">Select User *</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch || (selectedUser ? selectedUser.name : '')}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setShowUserDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, userId: '' });
                  }
                }}
                onFocus={() => setShowUserDropdown(true)}
                required
                autoComplete="off"
              />
              {showUserDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="planId">Select Plan *</Label>
              <Input
                id="planId"
                type="text"
                placeholder="Search plans by name or price..."
                value={planSearch || (selectedPlan ? selectedPlan.name : '')}
                onChange={(e) => {
                  setPlanSearch(e.target.value);
                  setShowPlanDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, planId: '' });
                  }
                }}
                onFocus={() => setShowPlanDropdown(true)}
                required
                autoComplete="off"
              />
              {showPlanDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredPlans.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No plans found
                    </div>
                  ) : (
                    filteredPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => handlePlanSelect(plan)}
                      >
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-gray-500">₦{plan.price.toLocaleString()}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              {selectedPlan?.planType === 'DAILY' && selectedPlan.defaultTimeSlot && (
                <p className="text-xs text-muted-foreground mt-1">
                  ⓘ This plan can only be created during its time window
                </p>
              )}
            </div>
            {formData.planId && timeSlotInfo.canEdit && (
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot</Label>
                <select
                  id="timeSlot"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                >
                  <option value="">Anytime</option>
                  <option value="MORNING">Morning (8am-12pm)</option>
                  <option value="AFTERNOON">Afternoon (12pm-5pm)</option>
                  <option value="NIGHT">Night (6pm-6am)</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                placeholder="e.g., Cash, Transfer"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Input
                id="adminNotes"
                placeholder="Optional notes"
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Subscription'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
