'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Plan {
  id: string;
  name: string;
  price: number;
  timeStart?: string;
  timeEnd?: string;
  startDateTime?: string;
  endDateTime?: string;
  isCustom?: boolean;
  notes?: string;
  durationType?: string;
}

interface ManagePlansProps {
  plans: Plan[];
  onRefresh: () => void;
}

export default function ManagePlans({ plans, onRefresh }: ManagePlansProps) {
  const [loading, setLoading] = useState(false);
  const [customPlanData, setCustomPlanData] = useState({
    name: '',
    price: '',
    startDateTime: '',
    endDateTime: '',
    notes: ''
  });
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleCreateCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/plans/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(customPlanData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Custom plan created successfully');
        setCustomPlanData({ name: '', price: '', startDateTime: '', endDateTime: '', notes: '' });
        onRefresh();
      } else {
        toast.error(`Failed to create custom plan: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error creating custom plan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/plans/custom/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: editingPlan.name,
          price: editingPlan.price,
          startDateTime: editingPlan.startDateTime,
          endDateTime: editingPlan.endDateTime,
          notes: editingPlan.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Custom plan updated successfully');
        setEditingPlan(null);
        onRefresh();
      } else {
        toast.error(`Failed to update custom plan: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error updating custom plan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this custom plan?')) return;
    
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/plans/custom/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Custom plan deleted successfully');
        onRefresh();
      } else {
        toast.error(`Failed to delete custom plan: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Please check your connection';
      toast.error(`Error deleting custom plan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const customPlans = plans.filter(plan => plan.isCustom);
  const systemPlans = plans.filter(plan => !plan.isCustom);

  return (
    <div className="space-y-6">
      {/* Create Custom Plan Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Custom Plan
          </CardTitle>
          <CardDescription>
            Create a new custom plan with specific time slots and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCustomPlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  placeholder="e.g., Special Evening Plan"
                  value={customPlanData.name}
                  onChange={(e) => setCustomPlanData({ ...customPlanData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 2000"
                  value={customPlanData.price}
                  onChange={(e) => setCustomPlanData({ ...customPlanData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDateTime">Start Date & Time *</Label>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  value={customPlanData.startDateTime}
                  onChange={(e) => setCustomPlanData({ ...customPlanData, startDateTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDateTime">End Date & Time *</Label>
                <Input
                  id="endDateTime"
                  type="datetime-local"
                  value={customPlanData.endDateTime}
                  onChange={(e) => setCustomPlanData({ ...customPlanData, endDateTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Available on weekends only"
                  value={customPlanData.notes}
                  onChange={(e) => setCustomPlanData({ ...customPlanData, notes: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Custom Plan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Custom Plans List */}
      {customPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Plans</CardTitle>
            <CardDescription>
              Manage your custom plans - edit or delete as needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-4 flex items-start justify-between"
                >
                  {editingPlan?.id === plan.id ? (
                    <form onSubmit={handleUpdateCustomPlan} className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Plan Name</Label>
                          <Input
                            value={editingPlan.name}
                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Price (₦)</Label>
                          <Input
                            type="number"
                            value={editingPlan.price}
                            onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Start Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={editingPlan.startDateTime || ''}
                            onChange={(e) => setEditingPlan({ ...editingPlan, startDateTime: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>End Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={editingPlan.endDateTime || ''}
                            onChange={(e) => setEditingPlan({ ...editingPlan, endDateTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Notes</Label>
                          <Input
                            value={editingPlan.notes || ''}
                            onChange={(e) => setEditingPlan({ ...editingPlan, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading}>
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPlan(null)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <Badge variant="secondary">Custom</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Price: ₦{plan.price}</p>
                          {plan.startDateTime && plan.endDateTime && (
                            <p>Period: {new Date(plan.startDateTime).toLocaleString()} - {new Date(plan.endDateTime).toLocaleString()}</p>
                          )}
                          {plan.notes && <p className="text-xs italic">Note: {plan.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Format datetime values for datetime-local input (YYYY-MM-DDTHH:mm)
                            const formattedPlan = {
                              ...plan,
                              startDateTime: plan.startDateTime 
                                ? new Date(plan.startDateTime).toISOString().slice(0, 16)
                                : '',
                              endDateTime: plan.endDateTime
                                ? new Date(plan.endDateTime).toISOString().slice(0, 16)
                                : ''
                            };
                            setEditingPlan(formattedPlan);
                          }}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCustomPlan(plan.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Plans List (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle>System Plans</CardTitle>
          <CardDescription>
            Default plans (cannot be edited or deleted)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemPlans.map((plan) => (
              <div
                key={plan.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <Badge>System</Badge>
                  {plan.durationType && (
                    <Badge variant="outline">{plan.durationType}</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Price: ₦{plan.price}</p>
                  {plan.timeStart && plan.timeEnd && (
                    <p>Time: {plan.timeStart} - {plan.timeEnd}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
