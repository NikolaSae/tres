// /app/(protected)/humanitarian-orgs/new/page.tsx
import { Metadata } from "next";
import { HumanitarianOrgForm } from "@/components/humanitarian-orgs/HumanitarianOrgForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Create New Humanitarian Organization | Management Dashboard",
  description: "Create a new humanitarian organization in the system",
};

export default function NewHumanitarianOrgPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/humanitarian-orgs">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Humanitarian Organization
            </h1>
            <p className="text-gray-600">
              Add a new humanitarian organization to the system
            </p>
          </div>
        </div>
      </div>

      <Card className>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <HumanitarianOrgForm />
        </CardContent>
      </Card>
    </div>
  );
}