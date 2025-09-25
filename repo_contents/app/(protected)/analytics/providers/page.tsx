///app/(protected)/analytics/providers/page.tsx


import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataFilters } from "@/components/analytics/DataFilters";
import { AnomalyDetection } from "@/components/analytics/AnomalyDetection";
import ServicePerformance from "@/components/analytics/ServicePerformance";

export const metadata: Metadata = {
  title: "Provider Analytics | Dashboard",
  description: "Analysis and performance metrics for service providers",
};

export default async function ProviderAnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Analytics</h1>
          <p className="text-muted-foreground">
            Monitor provider performance, revenue generation, and service quality metrics
          </p>
        </div>
      </div>

      <DataFilters 
        defaultDateRange="last90days"
        filterOptions={[
          {
            id: "serviceType",
            name: "Service Type",
            options: ["All", "VAS", "BULK"],
          },
          {
            id: "status",
            name: "Contract Status",
            options: ["All", "Active", "Expired", "Pending"],
          },
        ]}
      />

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="complaints">Complaint Rate</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <ServicePerformance providerView={true} />
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Provider Revenue Analysis</h2>
            {/* Revenue charts and analysis will be rendered here */}
          </Card>
        </TabsContent>
        
        <TabsContent value="complaints" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Provider Complaint Analysis</h2>
            {/* Complaint rate charts will be rendered here */}
          </Card>
        </TabsContent>
        
        <TabsContent value="anomalies" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Provider Performance Anomalies</h2>
            <AnomalyDetection 
              dataType="providers"
              description="Unusual patterns in provider performance or revenue generation"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}