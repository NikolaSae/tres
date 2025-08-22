//app/(protected)/bulk-services/[id]/page.tsx


import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BulkServiceDetails from "@/components/bulk-services/BulkServiceDetails";
import BulkServiceStats from "@/components/bulk-services/BulkServiceStats";
import { getBulkServiceById } from "@/actions/bulk-services/getBulkServiceById";

export const metadata: Metadata = {
  title: "Bulk Service Details",
  description: "View bulk service details",
};

export default async function BulkServiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const bulkService = await getBulkServiceById(params.id);

  if (!bulkService) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/bulk-services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Heading
            title="Bulk Service Details"
            description={`Viewing details for ${bulkService.agreement_name}`}
          />
        </div>
        <Button asChild>
          <Link href={`/bulk-services/${params.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BulkServiceDetails bulkService={bulkService} />
        <BulkServiceStats bulkService={bulkService} />
      </div>
    </div>
  );
}