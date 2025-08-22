// app/(protected)/dashboard/page.tsx
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserRole } from "@/lib/auth/auth-utils";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Main dashboard for the application.",
};

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/login");
  }

  const userRole = await getUserRole();
  
  console.log("[DASHBOARD] User accessing dashboard:", {
    email: session.user?.email,
    role: userRole,
    sessionRole: (session.user as any)?.role
  });

  // Check if user has admin/manager permissions
  const hasAdminAccess = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome to your dashboard"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Complaints Card */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage customer complaints and feedback
            </p>
            <Button asChild className="w-full">
              <Link href="/complaints">View Complaints</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Contracts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage contracts and agreements
            </p>
            <Button asChild className="w-full">
              <Link href="/contracts">View Contracts</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Operators Card */}
        <Card>
          <CardHeader>
            <CardTitle>Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage system operators
            </p>
            <Button asChild className="w-full">
              <Link href="/operators">View Operators</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Admin Only Cards */}
        {hasAdminAccess && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Create New Operator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Add new operators to the system
                </p>
                <Button asChild className="w-full">
                  <Link href="/operators/new">Create Operator</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create New Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create new contracts and agreements
                </p>
                <Button asChild className="w-full">
                  <Link href="/contracts/new">Create Contract</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage your account settings
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-600">
                {JSON.stringify({
                  userEmail: session.user?.email,
                  userRole,
                  sessionRole: (session.user as any)?.role,
                  hasAdminAccess
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}