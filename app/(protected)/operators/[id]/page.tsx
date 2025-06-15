// app/(protected)/operators/[id]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOperatorById } from "@/actions/operators";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { OperatorDetails } from "@/components/operators/OperatorDetails";
import { OperatorContracts } from "@/components/operators/OperatorContracts";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Operator Details",
  description: "View operator details",
};

interface OperatorDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function OperatorDetailsPage({ params }: OperatorDetailsPageProps) {
  const { id } = await params;
  const operator = await getOperatorById(id);

  if (!operator) {
    notFound();
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={operator.name}
        text={`Operator code: ${operator.code}`}
      >
        <div className="flex items-center gap-2">
          <BackButton href="/operators" />
          <Link
            href={`/operators/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit Operator
          </Link>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <OperatorDetails operator={operator} />
        </TabsContent>
        <TabsContent value="contracts">
          <OperatorContracts operatorId={id} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}