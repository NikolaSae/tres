//app/api/parking-services/[id]/route.ts

import { Metadata } from "next";
import BulkServiceList from "@/components/bulk-services/BulkServiceList";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import BulkServiceFilters from "@/components/bulk-services/BulkServiceFilters";

export const metadata: Metadata = {
  title: "Bulk Services",
  description: "Manage bulk services and SMS agreements",
};

export default async function BulkServicesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Bulk Services"
          description="Manage your bulk SMS services and agreements"
        />
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/bulk-services/import">
              <Plus className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bulk-services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Link>
          </Button>
        </div>
      </div>
      <Separator />
      <BulkServiceFilters />
      <BulkServiceList />
    </div>
  );
}