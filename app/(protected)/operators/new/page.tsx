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

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

export default async function NewOperatorPage() {
  try {
    const hasAccess = await hasRequiredRole([UserRole.ADMIN, UserRole.MANAGER]);
    
    if (!hasAccess) {
      redirect("/operators");
    }
    
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