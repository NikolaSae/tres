////app/(protected)/admin/security/user-roles/page.tsx


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import  UserRoleManagement  from "@/components/security/UserRoleManagement";
import  RolePermissions  from "@/components/security/RolePermissions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import  ActivityLog  from "@/components/security/ActivityLog";

export default async function UserRolesPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Role Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions across the system
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="users">User Roles</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Role Management</CardTitle>
              <CardDescription>
                View and update user roles for all system accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Configure permissions for each user role in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolePermissions />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Change Activity</CardTitle>
              <CardDescription>
                Audit log of all role and permission changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityLog entityType="userRole" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}