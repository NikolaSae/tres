///app/(protected)/reports/generate/page.tsx

import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExportOptions, ExportFormat } from "@/components/reports/ExportOptions";

export const metadata: Metadata = {
  title: "Generate Report | Dashboard",
  description: "Create custom reports with various data sets and formats",
};

export default async function GenerateReportPage() {
  // Export handler functions would be implemented here
  const handleFinancialExport = async (format: ExportFormat) => {
    // Implement financial report export logic
    console.log(`Exporting financial report as ${format}`);
  };

  const handleServicesExport = async (format: ExportFormat) => {
    // Implement services report export logic
    console.log(`Exporting services report as ${format}`);
  };

  const handleComplaintsExport = async (format: ExportFormat) => {
    // Implement complaints report export logic
    console.log(`Exporting complaints report as ${format}`);
  };

  const handleContractsExport = async (format: ExportFormat) => {
    // Implement contracts report export logic
    console.log(`Exporting contracts report as ${format}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Report</h1>
          <p className="text-muted-foreground">
            Create a custom report with specific data filters and export options
          </p>
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Report</h2>
            <p className="text-muted-foreground mb-6">
              Generate detailed financial reports with customizable metrics and date ranges
            </p>
            
            <div className="space-y-6">
              {/* Financial report configuration form would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields for financial report configuration */}
              </div>
              
              <ExportOptions 
                onExport={handleFinancialExport}
                allowedFormats={["excel", "pdf", "csv"]}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Service Report</h2>
            <p className="text-muted-foreground mb-6">
              Generate reports on service performance metrics across different categories
            </p>
            
            <div className="space-y-6">
              {/* Services report configuration form would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields for services report configuration */}
              </div>
              
              <ExportOptions 
                onExport={handleServicesExport}
                allowedFormats={["excel", "pdf", "csv"]}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="complaints" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Complaints Report</h2>
            <p className="text-muted-foreground mb-6">
              Generate reports on complaint trends, resolution times, and customer satisfaction
            </p>
            
            <div className="space-y-6">
              {/* Complaints report configuration form would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields for complaints report configuration */}
              </div>
              
              <ExportOptions 
                onExport={handleComplaintsExport}
                allowedFormats={["excel", "pdf", "csv"]}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contracts Report</h2>
            <p className="text-muted-foreground mb-6">
              Generate reports on contract status, expiration dates, and renewal tracking
            </p>
            
            <div className="space-y-6">
              {/* Contracts report configuration form would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields for contracts report configuration */}
              </div>
              
              <ExportOptions 
                onExport={handleContractsExport}
                allowedFormats={["excel", "pdf", "csv"]}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}