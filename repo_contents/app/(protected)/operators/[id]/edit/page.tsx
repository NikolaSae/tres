// app/(protected)/operators/[id]/edit/page.tsx

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOperatorById } from "@/actions/operators";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { OperatorForm } from "@/components/operators/OperatorForm";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getUserRole } from "@/lib/auth/auth-utils";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Edit Operator",
  description: "Edit operator details",
};

interface EditOperatorPageProps {
  params: {
    id: string;
  };
}

export default async function EditOperatorPage({ params }: EditOperatorPageProps) {
  const { id } = await params;
  const userRole = await getUserRole();
  
  // Only ADMIN and MANAGER can edit operators
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    redirect("/dashboard");
  }
  
  const operator = await getOperatorById(id);

  if (!operator) {
    notFound();
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Edit Operator"
        text={`Modify details for ${operator.name}`}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/operators/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
        </div>
      </DashboardHeader>
      <div className="grid gap-8">
        <OperatorForm operator={operator} />
      </div>
    </DashboardShell>
  );
}