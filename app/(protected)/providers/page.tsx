// app/(protected)/providers/page.tsx
import { Metadata } from "next";
import { ProviderList } from "@/components/providers/ProviderList";
import { BlacklistSection } from "@/components/blacklist/BlacklistSection";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Providers | Management Dashboard",
  description: "View and manage all providers and blacklist in the system",
};

// Loading fallback with styled spinner
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border shadow-sm">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-4 border-gray-300 dark:border-gray-600"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-blue-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 animate-pulse shadow-lg shadow-purple-500/50"></div>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">
        Loading data...
      </p>
    </div>
  );
}

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
          <h1 className="text-3xl font-bold tracking-wide text-gray-900 dark:text-gray-100">
            Providers & Security
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage providers and sender blacklist for your system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/providers/new"
            className="relative inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out overflow-hidden h-11 px-6 text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Create Provider
          </a>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl shadow-sm">
          <TabsTrigger 
            value="providers"
            className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700"
          >
            Providers
          </TabsTrigger>
          <TabsTrigger 
            value="blacklist"
            className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700"
          >
            Sender Blacklist
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="mt-6 space-y-4">
          <div className="border-b-2 border-purple-200 dark:border-purple-800 pb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">
              Providers
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage all providers in the system
            </p>
          </div>
          <Suspense fallback={<LoadingFallback />}>
            <ProviderList />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="blacklist" className="mt-6 space-y-4">
          <div className="border-b-2 border-purple-200 dark:border-purple-800 pb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">
              Sender Blacklist
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage blacklisted senders and check for matches in BulkService data
            </p>
          </div>
          <Suspense fallback={<LoadingFallback />}>
            <BlacklistSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}