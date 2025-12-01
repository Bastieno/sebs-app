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
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isCreating: boolean;
  onSuccess: () => void;
}

export default function UserModal({ isOpen, onClose, user, isCreating, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !isCreating) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
    }
  }, [user, isCreating, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (isCreating) {
        // Create new user
        const response = await fetch(`${API_URL}/api/admin/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          toast.success('User created successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(data.message || 'Failed to create user');
        }
      } else if (user) {
        // Update existing user
        const response = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          })
        });

        const data = await response.json();

        if (data.success) {
          toast.success('User updated successfully');
          onSuccess();
          onClose();
        } else {
          toast.error(data.message || 'Failed to update user');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Add a new user to the system"
              : "Update user information"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+2348012345678"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          {isCreating && (
            <div className="space-y-2">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank for auto-generated password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isCreating
                ? "Create User"
                : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
