// /app/(protected)/humanitarian-orgs/page.tsx
import { Metadata } from "next";
import { HumanitarianOrgList } from "@/components/humanitarian-orgs/HumanitarianOrgList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Humanitarian Organizations | Management Dashboard",
  description: "View and manage all humanitarian organizations in the system",
};

export default function HumanitarianOrgsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-lg shadow-sm border mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Humanitarian Organizations
          </h1>
          <p className="max-w-2xl">
            View and manage all humanitarian organizations in the system. Track contracts, complaints, and organization details.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/humanitarian-renewals">
            <Button> {/* Removed asChild prop */}
              <RefreshCw className="mr-2 h-4 w-4" />
              Renewals
            </Button>
          </Link>
          <Link href="/humanitarian-orgs/new">
            <Button> {/* Removed asChild prop */}
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization List</CardTitle>
        </CardHeader>
        <CardContent>
          <HumanitarianOrgList />
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg border text-center mt-6">
        <p className="text-sm text-gray-500">
          Need help managing organizations?{" "}
          <Link href="/help/humanitarian-orgs" className="text-blue-600 hover:text-blue-800 underline">
            View documentation
          </Link>{" "}
          or{" "}
          <Link href="/support" className="text-blue-600 hover:text-blue-800 underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}