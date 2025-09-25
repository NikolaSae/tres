// app/(protected)/operators/new/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";

import { OperatorForm } from "@/components/operators/OperatorForm";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserRole, getCurrentUser, hasRequiredRole } from "@/lib/auth/auth-utils";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "New Operator",
  description: "Create a new operator in the system.",
};

export default async function NewOperatorPage() {
  console.log("[NEW_OPERATOR_PAGE] Starting page load");
  
  try {
    // Debug: Check multiple ways to get user info
    const userRole = await getUserRole();
    const currentUser = await getCurrentUser();
    const hasAccess = await hasRequiredRole([UserRole.ADMIN, UserRole.MANAGER]);
    
    console.log("[NEW_OPERATOR_PAGE] Access check:", {
      userRole,
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role
      } : null,
      hasAccess,
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER]
    });
    
    // Check access using the helper function
    if (!hasAccess) {
      console.log("[NEW_OPERATOR_PAGE] Access denied, redirecting to operators list");
      redirect("/operators"); // Redirect to operators list instead of dashboard
    }
    
    console.log("[NEW_OPERATOR_PAGE] Access granted, rendering page");
    
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Create New Operator"
          text="Add a new operator to the system"
        >
          <Button asChild variant="outline">
            <Link href="/operators">Cancel</Link>
          </Button>
        </DashboardHeader>
        <div className="grid gap-8">
          <OperatorForm />
        </div>
      </DashboardShell>
    );
    
  } catch (error) {
    console.error("[NEW_OPERATOR_PAGE] Error:", error);
    
    // Show error page instead of redirecting
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Access Error</h2>
          <p className="text-gray-600">There was an error checking your permissions.</p>
          <p className="text-sm text-gray-500">Please try refreshing the page or contact support.</p>
          <Button asChild>
            <Link href="/operators">Back to Operators</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }
}