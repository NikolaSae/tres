// app/(protected)/providers/page.tsx
import { Metadata } from "next";
import { ProviderList } from "@/components/providers/ProviderList";
import { BlacklistSection } from "@/components/blacklist/BlacklistSection";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Providers | Management Dashboard",
  description: "View and manage all providers and blacklist in the system",
};

export default async function ProvidersPage() {
  const session = await auth();
  
  if (!session) {
    return <div>Unauthenticated</div>;
  }

  const userRole = session.user?.role as UserRole;
  
  if (![UserRole.ADMIN, UserRole.MANAGER].includes(userRole)) {
    return <div>Unauthorized</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Providers & Security</h1>
          <p className="text-gray-500">
            Manage providers and sender blacklist for your system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/providers/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            Create Provider
          </a>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="blacklist">Sender Blacklist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="mt-6 space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Providers</h2>
            <p className="text-sm text-gray-500">View and manage all providers in the system</p>
          </div>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ProviderList />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="blacklist" className="mt-6 space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Sender Blacklist</h2>
            <p className="text-sm text-gray-500">Manage blacklisted senders and check for matches in BulkService data</p>
          </div>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <BlacklistSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}