//app/(protected)/bulk-services/page.tsx

"use client";

import { Separator } from "@/components/ui/separator";
import { BulkServiceFilters } from "@/components/bulk-services/BulkServiceFilters";
import BulkServiceList from "@/components/bulk-services/BulkServiceList";
import { useState } from "react";

export default function BulkServicesPage() {
  // Define empty arrays for the required props
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bulk Services</h1>
        {/* Add any action buttons here if needed */}
      </div>
      <Separator />
      <BulkServiceFilters providers={providers} services={services} />
      <BulkServiceList />
    </div>
  );
}