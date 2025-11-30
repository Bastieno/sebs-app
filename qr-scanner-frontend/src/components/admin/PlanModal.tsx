'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Plan {
  id: string;
  name: string;
  price: number;
  timeUnit: string;
  duration: number;
  notes?: string;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  isCreating: boolean;
  onSuccess: () => void;
}

export default function PlanModal({ isOpen, onClose, plan, isCreating, onSuccess }: PlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    timeUnit: 'HOURS',
    duration: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan && !isCreating) {
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        timeUnit: plan.timeUnit,
        duration: plan.duration.toString(),
        notes: plan.notes || ''
      });
    } else {
      setFormData({
        name: '',
        price: '',
        timeUnit: 'HOURS',
        duration: '',
        notes: ''
      });
    }
  }, [plan, isCreating, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (isCreating) {
        // Create new custom plan
        const response = await fetch(`${API_URL}/api/plans/custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Custom plan created successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(data.message || 'Failed to create custom plan');
        }
      } else if (plan) {
        // Update existing custom plan
        const response = await fetch(`${API_URL}/api/plans/custom/${plan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Custom plan updated successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(data.message || 'Failed to update custom plan');
        }
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Create Custom Plan' : 'Edit Custom Plan'}</DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Create a new custom plan with specific time slots and pricing' 
              : 'Update custom plan details'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Special Evening Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 2000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeUnit">Time Unit *</Label>
              <select
                id="timeUnit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.timeUnit}
                onChange={(e) => setFormData({ ...formData, timeUnit: e.target.value })}
                required
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
                <option value="YEAR">Year</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="e.g., 4"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Available on weekends only"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isCreating ? 'Create Plan' : 'Update Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
