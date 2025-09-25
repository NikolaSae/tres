// /app/(protected)/services/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ServiceList } from "@/components/services/ServiceList";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSpreadsheet } from "lucide-react";

export const metadata: Metadata = {
  title: "Services List | Management Dashboard",
  description: "View and manage all services with advanced filtering and search capabilities.",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header sekcija */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-lg shadow-sm border">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Services Management
            </h1>
            <p className="max-w-2xl">
              Manage your organization's services across all categories. Use filters to quickly find specific services by type, status, or search terms.
            </p>
            <div className="flex items-center gap-4 text-sm mt-2">
              <span className="flex items-center gap-1 text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                VAS Services
              </span>
              <span className="flex items-center gap-1 text-purple-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Bulk Services
              </span>
              <span className="flex items-center gap-1 text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Humanitarian
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Parking
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="outline" asChild className="order-2 sm:order-1">
              <Link href="/services/import" className="flex items-center justify-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Services
              </Link>
            </Button>
            
            <Button asChild className="order-1 sm:order-2">
              <Link href="/services/new" className="flex items-center justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Service
              </Link>
            </Button>
          </div>
        </div>

        {/* ServiceList komponenta koja sadrži ServiceFilters */}
        <ServiceList />

        {/* Footer info - opciono */}
        <div className="p-4 rounded-lg border text-center">
          <p className="text-sm text-gray-500">
            Need help managing services? Check out our{" "}
            <Link href="/help/services" className="text-blue-600 hover:text-blue-800 underline">
              documentation
            </Link>{" "}
            or{" "}
            <Link href="/support" className="text-blue-600 hover:text-blue-800 underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}