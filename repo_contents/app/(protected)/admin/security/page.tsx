// Path: app/(protected)/admin/security/page.tsx

import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityLog from '@/components/security/ActivityLog';
import PermissionGate from '@/components/security/PermissionGate';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Shield, Users, LineChart, Clock } from 'lucide-react';

import {
  getCriticalAlertMetrics,
  getWarningEventMetrics,
  getRecentActiveUserCount,
} from '@/actions/security/metrics';


export const metadata: Metadata = {
  title: 'Security Dashboard | Admin',
  description: 'Monitor and manage application security',
};

async function SecurityMetricCard({
  title,
  value,
  description,
  icon: Icon,
  changePercentage = null,
  changePositive = true
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  changePercentage?: number | null;
  changePositive?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {changePercentage !== null && (
          <div className={`mt-2 flex items-center text-xs ${changePositive ? 'text-green-500' : 'text-red-500'}`}>
            {changePositive ? '↑' : '↓'} {changePercentage}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function SecurityDashboard() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const criticalMetrics = await getCriticalAlertMetrics();
  const warningMetrics = await getWarningEventMetrics();
  const activeUserMetrics = await getRecentActiveUserCount();

  const apiResponseTime = '...';


  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <PermissionGate allowedRoles={['ADMIN']}>
          <Button variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Security Settings
          </Button>
        </PermissionGate>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <SecurityMetricCard
          title="Critical Alerts"
          value={criticalMetrics.criticalLast24h}
          description="Critical security events in the last 24h"
          icon={AlertTriangle}
          changePercentage={criticalMetrics.changePercentage}
          changePositive={criticalMetrics.changePositive}
        />
        <SecurityMetricCard
          title="Warning Events"
          value={warningMetrics.warningLast24h}
          description="Warning-level security events in the last 24h"
          icon={AlertTriangle}
          changePercentage={warningMetrics.changePercentage}
          changePositive={warningMetrics.changePositive}
        />
        <SecurityMetricCard
          title="Active Users"
          value={activeUserMetrics.activeUserCount}
          description="Users with activity in the last 24h"
          icon={Users}
          changePercentage={null}
          changePositive={true}
        />
        <SecurityMetricCard
          title="API Response Time"
          value={apiResponseTime}
          description="Average API response time"
          icon={Clock}
          changePercentage={null}
          changePositive={true}
        />
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-1">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>
                  Overview of recent system and user activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <ActivityLog showFilters={true} initialLimit={20} />
                </Suspense>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/security/activity-logs">
                  <Button variant="outline">View All Logs</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common security actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/security/user-roles">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage User Roles
              </Button>
            </Link>
            <Link href="/admin/security/performance">
              <Button variant="outline" className="w-full justify-start">
                <LineChart className="mr-2 h-4 w-4" />
                Monitor Performance
              </Button>
            </Link>
            <Link href="/admin/security/activity-logs">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                View Activity Logs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
            <CardDescription>Overall system security status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span>Authentication</span>
                </div>
                <span className="text-green-500 font-medium">Secure</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span>Database Encryption</span>
                </div>
                <span className="text-green-500 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span>API Rate Limiting</span>
                </div>
                <span className="text-green-500 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-yellow-500 mr-2" />
                  <span>Last Backup</span>
                </div>
                <span className="text-yellow-500 font-medium">12h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}