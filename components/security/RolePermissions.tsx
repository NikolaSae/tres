// components/security/RolePermissions.tsx
"use client";

import React, { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Package,
  Car,
  Building2,
  TrendingUp,
  ClipboardList,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  roles: {
    ADMIN: boolean;
    MANAGER: boolean;
    AGENT: boolean;
    USER: boolean;
  };
}

interface PermissionCategory {
  category: string;
  description: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

// Initial permission configuration
const initialPermissions: PermissionCategory[] = [
  {
    category: "User Management",
    description: "Manage users and their roles",
    icon: <Users className="h-5 w-5" />,
    permissions: [
      {
        id: "users_view",
        name: "View Users",
        description: "View list of all users",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
      {
        id: "users_edit_roles",
        name: "Edit User Roles",
        description: "Change user roles and permissions",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
      {
        id: "users_delete",
        name: "Delete Users",
        description: "Delete user accounts",
        icon: <Trash2 className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Providers",
    description: "Manage service providers",
    icon: <Building2 className="h-5 w-5" />,
    permissions: [
      {
        id: "providers_view",
        name: "View Providers",
        description: "View provider listings",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: true }
      },
      {
        id: "providers_create_edit",
        name: "Create/Edit Providers",
        description: "Add and modify providers",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
      {
        id: "providers_delete",
        name: "Delete Providers",
        description: "Remove providers from system",
        icon: <Trash2 className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Contracts",
    description: "Manage contracts and agreements",
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      {
        id: "contracts_view",
        name: "View Contracts",
        description: "View contract details",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: true }
      },
      {
        id: "contracts_create_edit",
        name: "Create/Edit Contracts",
        description: "Create and modify contracts",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "contracts_delete",
        name: "Delete Contracts",
        description: "Delete contracts",
        icon: <Trash2 className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
      {
        id: "contracts_approve",
        name: "Approve Contracts",
        description: "Approve contract changes",
        icon: <CheckCircle2 className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Services",
    description: "Manage services and bulk operations",
    icon: <Package className="h-5 w-5" />,
    permissions: [
      {
        id: "services_view",
        name: "View Services",
        description: "View all services",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: true }
      },
      {
        id: "services_create_edit",
        name: "Create/Edit Services",
        description: "Add and modify services",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "services_bulk",
        name: "Bulk Operations",
        description: "Import/export bulk services",
        icon: <Package className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
    ]
  },
  {
    category: "Parking Services",
    description: "Manage parking services",
    icon: <Car className="h-5 w-5" />,
    permissions: [
      {
        id: "parking_view",
        name: "View Parking",
        description: "View parking services",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: true }
      },
      {
        id: "parking_manage",
        name: "Manage Parking",
        description: "Create and edit parking services",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
    ]
  },
  {
    category: "Complaints",
    description: "Handle customer complaints",
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: [
      {
        id: "complaints_view",
        name: "View Complaints",
        description: "View all complaints",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "complaints_manage",
        name: "Manage Complaints",
        description: "Handle and resolve complaints",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "complaints_delete",
        name: "Delete Complaints",
        description: "Delete complaints",
        icon: <Trash2 className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
      {
        id: "complaints_admin",
        name: "Admin Panel",
        description: "Access complaint admin features",
        icon: <ShieldCheck className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Analytics",
    description: "View analytics and reports",
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      {
        id: "analytics_view",
        name: "View Analytics",
        description: "Access analytics dashboards",
        icon: <TrendingUp className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
      {
        id: "analytics_export",
        name: "Export Reports",
        description: "Export analytics data",
        icon: <ClipboardList className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Reports",
    description: "Generate and manage reports",
    icon: <ClipboardList className="h-5 w-5" />,
    permissions: [
      {
        id: "reports_view",
        name: "View Reports",
        description: "View generated reports",
        icon: <Eye className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "reports_generate",
        name: "Generate Reports",
        description: "Create new reports",
        icon: <Edit className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: true, USER: false }
      },
      {
        id: "reports_schedule",
        name: "Schedule Reports",
        description: "Set up automated reports",
        icon: <Settings className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: true, AGENT: false, USER: false }
      },
    ]
  },
  {
    category: "Admin",
    description: "Administrative functions",
    icon: <Shield className="h-5 w-5" />,
    permissions: [
      {
        id: "admin_security",
        name: "Security Settings",
        description: "Manage security settings",
        icon: <ShieldCheck className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
      {
        id: "admin_activity_logs",
        name: "Activity Logs",
        description: "View system activity logs",
        icon: <ClipboardList className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
      {
        id: "admin_system_settings",
        name: "System Settings",
        description: "Configure system settings",
        icon: <Settings className="h-4 w-4" />,
        roles: { ADMIN: true, MANAGER: false, AGENT: false, USER: false }
      },
    ]
  },
];

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

export default function RolePermissions() {
  const roles: UserRole[] = ['ADMIN', 'MANAGER', 'AGENT', 'USER'];
  const [permissions, setPermissions] = useState<PermissionCategory[]>(initialPermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (categoryIndex: number, permissionIndex: number, role: UserRole) => {
    const newPermissions = [...permissions];
    newPermissions[categoryIndex].permissions[permissionIndex].roles[role] = 
      !newPermissions[categoryIndex].permissions[permissionIndex].roles[role];
    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: Implement actual save to backend
    console.log('Saving permissions:', permissions);
    toast.success('Permission changes saved successfully!');
    setHasChanges(false);
  };

  const handleReset = () => {
    setPermissions(initialPermissions);
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Permission Configuration</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Changes to permissions will affect all users with the selected roles. Make sure you understand the implications before saving.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              You have unsaved changes
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Discard Changes
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Hierarchy</CardTitle>
          <CardDescription>
            Click checkboxes below to enable/disable permissions for each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div key={role} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge className={`${roleColors[role]} text-white`}>
                  {roleLabels[role]}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {role === 'ADMIN' && 'Full system access'}
                  {role === 'MANAGER' && 'Advanced operations'}
                  {role === 'AGENT' && 'Day-to-day operations'}
                  {role === 'USER' && 'Basic read access'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Categories */}
      <div className="space-y-4">
        {permissions.map((category, categoryIndex) => (
          <Card key={category.category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {category.icon}
                <div>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.permissions.map((permission, permissionIndex) => (
                  <div 
                    key={permission.id}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{permission.icon}</div>
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-end">
                      {roles.map((role) => (
                        <div key={role} className="flex flex-col items-center gap-2">
                          <Checkbox
                            checked={permission.roles[role]}
                            onCheckedChange={() => togglePermission(categoryIndex, permissionIndex, role)}
                            id={`${permission.id}-${role}`}
                          />
                          <label 
                            htmlFor={`${permission.id}-${role}`}
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Permission Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-blue-900 dark:text-blue-100">
            <strong>ADMIN:</strong> Has full access to all features including user management, system settings, and security configurations.
          </p>
          <p className="text-blue-900 dark:text-blue-100">
            <strong>MANAGER:</strong> Can manage providers, contracts, services, and access analytics. Cannot modify user roles or system security.
          </p>
          <p className="text-blue-900 dark:text-blue-100">
            <strong>AGENT:</strong> Can handle day-to-day operations including contracts, services, complaints, and reports. Limited administrative access.
          </p>
          <p className="text-blue-900 dark:text-blue-100">
            <strong>USER:</strong> Has basic read-only access to view providers, contracts, and services. Cannot create or modify data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}