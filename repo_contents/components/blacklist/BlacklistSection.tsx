//components/blacklist/BlacklistSection.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Shield, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SenderBlacklistTable } from "./SenderBlacklistTable";
import { BlacklistFiltersComponent } from "./BlacklistFilters";
import { useSenderBlacklist } from "@/hooks/use-sender-blacklist";
import CreateBlacklistEntryDialog from "./CreateBlacklistEntryDialog"; // Fixed import
import { useCheckBlacklistedSenders } from "@/hooks/use-check-blacklisted-senders";

export function BlacklistSection() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { 
    entries, 
    totalCount, 
    isLoading, 
    filters, 
    pagination, 
    handleFilterChange, 
    handlePageChange, 
    handleRefresh
  } = useSenderBlacklist();

  // Hook for checking blacklisted senders in BulkService
  const { 
    matchedSenders, 
    totalMatches, 
    isChecking, 
    checkSenders 
  } = useCheckBlacklistedSenders();

  // Transform matchedSenders into provider mapping
  const matchedProviders = useMemo(() => {
    const providersMap: Record<string, string[]> = {};
    
    if (!matchedSenders) return providersMap;
    
    matchedSenders.forEach(match => {
      const senderName = match.blacklistEntry.senderName;
      if (!senderName) return;
      
      // Extract unique provider names
      const providerNames = Array.from(
        new Set(
          match.matchingServices.map(
            service => service.provider?.name || 'Unknown'
          )
        )
      );
      
      providersMap[senderName] = providerNames;
    });
    
    return providersMap;
  }, [matchedSenders]);

  // Add safety checks for entries
  const activeEntries = entries?.filter(entry => entry.isActive) || [];
  const inactiveEntries = entries?.filter(entry => !entry.isActive) || [];

  const handleNavigateToAuditLogs = () => {
    router.push('/audit-logs');
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blacklist Entries</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Entries</CardTitle>
            <Badge variant="default" className="text-xs">{activeEntries.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEntries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Entries</CardTitle>
            <Badge variant="secondary" className="text-xs">{inactiveEntries.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{inactiveEntries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detected Matches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalMatches || 0}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkSenders}
              disabled={isChecking}
              className="mt-2"
            >
              {isChecking ? "Checking..." : "Check Matches"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blacklist Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sender Blacklist
              </CardTitle>
              <CardDescription>
                Manage blacklisted senders. Active entries will be checked against BulkService data.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleNavigateToAuditLogs}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Audit Logs
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh} // Use the handleRefresh from hook
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Blacklist Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <BlacklistFiltersComponent
            initialFilters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Table */}
          <SenderBlacklistTable
            entries={entries}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRefresh={handleRefresh} // Pass it down to table
            matchedProviders={matchedProviders}
          />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateBlacklistEntryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          handleRefresh();
        }}
      />
    </div>
  );
}