///app/(protected)/audit-logs/page.tsx

import { getBlacklistLogs } from "@/actions/blacklist/get-blacklist-logs";
import { BlackLogTable } from "@/components/security/BlackLogTable";
import { auth } from "@/auth";

export default async function AuditLogsPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    return (
      <div className="w-[90vw] mx-auto min-h-[90vh] flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Unauthorized</h2>
          <p>You must be signed in to view this page.</p>
        </div>
      </div>
    );
  }
  
  // Only allow admins to view audit logs
  if (session.user.role !== "ADMIN") {
    return (
      <div className="w-[90vw] mx-auto min-h-[90vh] flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to view audit logs.</p>
        </div>
      </div>
    );
  }
  
  const logs = await getBlacklistLogs();
  
  return (
    <div className="w-[90vw] mx-auto min-h-[90vh] flex flex-col py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Blacklist Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          View all changes made to sender blacklist entries
        </p>
      </div>
      
      <div className="flex-grow overflow-auto">
        <BlackLogTable logs={logs} />
      </div>
    </div>
  );
}