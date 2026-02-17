// components/security/UserRoleManagement.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getAllUsers, 
  updateUserRole, 
  toggleUserStatus,
  bulkUpdateUserRoles,
  getRoleStatistics,
  sendPasswordReset
} from '@/actions/users/user-role-management';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  RefreshCw,
  Key,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: Date | null;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

interface RoleStats {
  total: number;
  byRole: Record<UserRole, number>;
  activeUsers: number;
  verifiedUsers: number;
}

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500',
  MANAGER: 'bg-blue-500',
  AGENT: 'bg-green-500',
  USER: 'bg-gray-500',
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  USER: 'User',
};

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<UserRole | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.error) {
      toast.error(result.error);
    } else if (result.users) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getRoleStatistics();
    if (!result.error) {
      setStats(result as RoleStats);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(user => 
        statusFilter === 'ACTIVE' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setProcessingUserId(userId);
    const result = await updateUserRole(userId, newRole);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      
      // Update local state instead of reloading
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );
      
      // Update stats only
      await loadStats();
    }
    setProcessingUserId(null);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    console.log('handleStatusToggle called with:', { userId, currentStatus, newStatus: !currentStatus });
    setProcessingUserId(userId);
    
    try {
      const result = await toggleUserStatus(userId, !currentStatus);
      console.log('Result from toggleUserStatus:', result);
      
      if (result?.error) {
        console.log('Has error:', result.error);
        toast.error(result.error);
      } else if (result?.success) {
        console.log('Has success:', result.success, 'Message:', result.message);
        toast.success(result.message || 'User status updated successfully');
        
        // Update local state instead of reloading everything
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isActive: !currentStatus }
              : user
          )
        );
        
        // Update stats only (lightweight)
        await loadStats();
      } else {
        // Fallback if result structure is unexpected
        console.error('Unexpected result structure:', result);
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Exception in handleStatusToggle:', error);
      toast.error('An error occurred while updating user status');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkRole || selectedUsers.size === 0) return;

    const result = await bulkUpdateUserRoles(Array.from(selectedUsers), bulkRole);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      
      // Update local state for all selected users
      setUsers(prevUsers => 
        prevUsers.map(user => 
          selectedUsers.has(user.id)
            ? { ...user, role: bulkRole }
            : user
        )
      );
      
      setSelectedUsers(new Set());
      setBulkRole(null);
      setShowBulkDialog(false);
      
      // Update stats only
      await loadStats();
    }
  };

  const handlePasswordReset = async (userId: string, userEmail: string, isOAuth: boolean) => {
    if (isOAuth) {
      toast.error("Cannot reset password for OAuth users");
      return;
    }

    setProcessingUserId(userId);
    const result = await sendPasswordReset(userId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      // Show reset link in development
      if (result.resetLink) {
        toast.info(`Reset link: ${result.resetLink}`, { duration: 10000 });
      }
    }
    setProcessingUserId(null);
  };

  const toggleSelectAll = (checked: boolean) => {
    console.log('Toggle Select All:', checked, 'Filtered users:', filteredUsers.length);
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const toggleSelectUser = (userId: string, checked: boolean | 'indeterminate') => {
    console.log('Toggle Select User:', userId, 'Checked:', checked);
    const newSelected = new Set(selectedUsers);
    if (checked === true) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    console.log('New selected:', newSelected);
    setSelectedUsers(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Users</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <UserCheck className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Verified</p>
                <p className="text-3xl font-bold">{stats.verifiedUsers}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Admins</p>
                <p className="text-3xl font-bold">{stats.byRole.ADMIN || 0}</p>
              </div>
              <Shield className="h-10 w-10 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'ALL')}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button onClick={() => setShowBulkDialog(true)} variant="default">
              Bulk Update Role
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => toggleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      disabled={processingUserId === user.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">
                          <Badge className={roleColors.ADMIN}>Admin</Badge>
                        </SelectItem>
                        <SelectItem value="MANAGER">
                          <Badge className={roleColors.MANAGER}>Manager</Badge>
                        </SelectItem>
                        <SelectItem value="AGENT">
                          <Badge className={roleColors.AGENT}>Agent</Badge>
                        </SelectItem>
                        <SelectItem value="USER">
                          <Badge className={roleColors.USER}>User</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isTwoFactorEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(user.lastLogin), 'MMM d, HH:mm')}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.isOAuth && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePasswordReset(user.id, user.email, user.isOAuth)}
                          disabled={processingUserId === user.id}
                          title="Send password reset email"
                        >
                          {processingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-1" />
                              Reset
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "default"}
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        disabled={processingUserId === user.id}
                      >
                        {processingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update User Roles</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-role">New Role</Label>
            <Select 
              value={bulkRole || undefined} 
              onValueChange={(value) => setBulkRole(value as UserRole)}
            >
              <SelectTrigger id="bulk-role" className="mt-2">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBulkDialog(false);
                setBulkRole(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate} 
              disabled={!bulkRole}
            >
              Update {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}