// app/(protected)/profile/page.tsx
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, format } from "date-fns";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Key,
  Smartphone,
  Bell,
  Settings,
  LogOut
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your profile and account information",
};

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Fetch detailed user data with counts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          servicesCreated: true,
          createdContracts: true,
          modifiedContracts: true,
          submittedComplaints: true,
          assignedComplaints: true,
          comments: true,
          activities: true,
          notifications: true,
          uploadedAttachments: true,
        }
      },
      notificationPreferences: true,
      // Get recent activity
      activities: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      // Get recent notifications
      notifications: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    redirect("/auth/login");
  }

  const userInitials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AGENT': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('CREATE')) return <FileText className="w-4 h-4" />;
    if (action.includes('UPDATE')) return <Settings className="w-4 h-4" />;
    if (action.includes('DELETE')) return <XCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'ERROR': return 'text-orange-600 bg-orange-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role}
              </Badge>
              {user.isActive ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(user.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Email Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Verified</span>
                        <span className="text-xs text-muted-foreground">
                          on {format(new Date(user.emailVerified), 'MMM d, yyyy')}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-600 font-medium">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Quick Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{user._count.createdContracts}</p>
                    <p className="text-xs text-muted-foreground">Contracts Created</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{user._count.submittedComplaints}</p>
                    <p className="text-xs text-muted-foreground">Complaints Submitted</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{user._count.assignedComplaints}</p>
                    <p className="text-xs text-muted-foreground">Complaints Assigned</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{user._count.comments}</p>
                    <p className="text-xs text-muted-foreground">Comments Made</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Your latest 5 notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {user.notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {user.notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg border ${notification.isRead ? 'bg-background' : 'bg-primary/5 border-primary/20'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.isRead ? 'bg-muted' : 'bg-primary'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="ghost" className="w-full mt-4">
                <Link href="/notifications">View All Notifications</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-xs text-muted-foreground">
                        {user.password ? 'Password set' : 'No password (OAuth only)'}
                      </p>
                    </div>
                  </div>
                  {user.password ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">
                        {user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  {user.isTwoFactorEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">OAuth Account</p>
                      <p className="text-xs text-muted-foreground">
                        {user.isOAuth ? 'Connected via OAuth' : 'Email/Password account'}
                      </p>
                    </div>
                  </div>
                  {user.isOAuth ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">OAuth</Badge>
                  ) : (
                    <Badge variant="outline">Standard</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Change Settings
                  </Link>
                </Button>
                {!user.isTwoFactorEnabled && (
                  <Button variant="outline" className="w-full justify-start text-yellow-600">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </Button>
                )}
                <Button variant="destructive" className="w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {user.activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {user.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{activity.action}</p>
                          <Badge variant="outline" className="text-xs">
                            {activity.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.entityType}
                          {activity.entityId && ` • ID: ${activity.entityId}`}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Services Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user._count.servicesCreated}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contracts Modified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user._count.modifiedContracts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Attachments Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user._count.uploadedAttachments}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Activity Log Entries</span>
                  <span className="text-2xl font-bold">{user._count.activities}</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Total Notifications</span>
                  <span className="text-2xl font-bold">{user._count.notifications}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}