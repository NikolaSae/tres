// app/(protected)/audit-logs/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { BlacklistAuditLogsClient } from "@/components/audit-logs/BlacklistAuditLogsClient";
import { Loader2, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Audit Logs | Management Dashboard",
  description: "View blacklist audit logs and activity history",
};

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  );
}

export default async function AuditLogsPage() {
  const session = await auth();
  
  // ✅ Auth check
  if (!session || !session.user) {
    redirect("/auth/login");
  }
  
  // ✅ Role check - samo ADMIN
  if (session.user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 max-w-md">
          <ShieldAlert className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to view audit logs. This page is restricted to administrators only.
          </p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold h-10 px-6 text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-lg transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-gray-900 dark:text-gray-100">
            Blacklist Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View all changes made to sender blacklist entries
          </p>
        </div>
      </div>
      
      {/* Content */}
      <Suspense fallback={<LoadingFallback />}>
        <BlacklistAuditLogsClient />
      </Suspense>
    </div>
  );
}