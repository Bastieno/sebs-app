'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import UserModal from './UserModal';

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

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

export default function UserTable({ users, onRefresh }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Use the pagination hook
  const {
    paginatedItems: paginatedUsers,
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(users, { initialItemsPerPage: 10 });

  const handleAddUser = () => {
    setIsCreating(true);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setIsCreating(false);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(userId);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User deleted successfully');
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch {
      toast.error('Error deleting user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/user-status/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        onRefresh();
      } else {
        toast.error('Failed to update user status');
      }
    } catch {
      toast.error('Error updating user status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-sm text-gray-600">Manage system users</p>
        </div>
        <Button onClick={handleAddUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {users.length === 0 ? 'No users found' : 'No users on this page'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className="focus:outline-none"
                    >
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteLoading === user.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile List View */}
      <div className="block md:hidden space-y-4">
        {paginatedUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            {users.length === 0 ? 'No users found' : 'No users on this page'}
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-base">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <button
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className="focus:outline-none"
                  >
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-xs">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="flex-1"
                >
                  <Pencil className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={deleteLoading === user.id}
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </Button>
              </div>
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

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        isCreating={isCreating}
        onSuccess={onRefresh}
      />
    </div>
  );
}
