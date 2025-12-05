'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PlanModal from './PlanModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Plan {
  id: string;
  name: string;
  price: number;
  timeUnit: string;
  duration: number;
  isCustom?: boolean;
  notes?: string;
}

interface ManagePlansProps {
  plans: Plan[];
  onRefresh: () => void;
}

export default function ManagePlans({ plans, onRefresh }: ManagePlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Sort plans: Custom plans first, then system plans
  const sortedPlans = [...plans].sort((a, b) => {
    // Custom plans come first
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    // Within same type, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  const handleAddPlan = () => {
    setIsCreating(true);
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setIsCreating(false);
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this custom plan? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(planId);
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
        toast.error(data.message || 'Failed to delete custom plan');
      }
    } catch {
      toast.error('Error deleting custom plan');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDuration = (timeUnit: string, duration: number) => {
    const unitMap: { [key: string]: string } = {
      MINUTES: duration === 1 ? 'Minute' : 'Minutes',
      HOURS: duration === 1 ? 'Hour' : 'Hours',
      DAYS: duration === 1 ? 'Day' : 'Days',
      WEEK: duration === 1 ? 'Week' : 'Weeks',
      MONTH: duration === 1 ? 'Month' : 'Months',
      YEAR: duration === 1 ? 'Year' : 'Years'
    };
    return `${duration} ${unitMap[timeUnit] || timeUnit}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Plans</h2>
          <p className="text-sm text-gray-600">Manage system and custom plans</p>
        </div>
        <Button onClick={handleAddPlan}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Plan
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              sortedPlans.map((plan) => (
                <TableRow key={plan.id} className={plan.isCustom ? '' : 'bg-gray-50'}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isCustom ? 'default' : 'secondary'}>
                      {plan.isCustom ? 'Custom' : 'System'}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{plan.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatDuration(plan.timeUnit, plan.duration)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.notes ? (
                      <span className="text-xs text-gray-600 italic">{plan.notes}</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.isCustom ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deleteLoading === plan.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Read-only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {sortedPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            No plans found
          </div>
        ) : (
          sortedPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`border rounded-lg p-4 space-y-3 shadow-sm ${
                plan.isCustom ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base truncate">{plan.name}</div>
                  <div className="text-sm text-gray-600 mt-1">₦{plan.price.toLocaleString()}</div>
                </div>
                <Badge variant={plan.isCustom ? 'default' : 'secondary'}>
                  {plan.isCustom ? 'Custom' : 'System'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Duration:</span>
                  <Badge variant="outline">
                    {formatDuration(plan.timeUnit, plan.duration)}
                  </Badge>
                </div>
                
                {plan.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 text-xs block mb-1">Notes:</span>
                    <span className="text-xs text-gray-600 italic">{plan.notes}</span>
                  </div>
                )}
              </div>
              
              {plan.isCustom ? (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1"
                  >
                    <Pencil className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deleteLoading === plan.id}
                    className="flex-1"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-gray-400 border-t">
                  Read-only system plan
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <PlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        isCreating={isCreating}
        onSuccess={onRefresh}
      />
    </div>
  );
}
