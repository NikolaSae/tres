//components/reports/ExcelGenerator.tsx


"use client";

import { useState } from "react";
import { Calendar, FileSpreadsheet, Filter, Settings, Loader2 } from "lucide-react"; // Added Loader2 for the button spinner
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// Assuming DatePicker is a component you have elsewhere, potentially using react-day-picker inside
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner"; // Assuming sonner for toasts
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils"; // Added cn for potential classname utilities

export interface ExcelColumn {
  id: string;
  name: string;
  selected: boolean;
}

export interface ExcelGeneratorProps {
  title: string;
  description?: string;
  columns: ExcelColumn[];
  templates?: { id: string; name: string }[];
  onGenerate: (options: ExcelGeneratorOptions) => Promise<void>;
  entityType: 'financial' | 'sales' | 'complaints' | 'contracts' | 'providers' | 'services';
}

export interface ExcelGeneratorOptions {
  columns: string[];
  dateRange?: { start?: Date; end?: Date };
  templateId?: string;
  includeCharts?: boolean;
  groupBy?: string;
}

export function ExcelGenerator({
  title,
  description,
  columns,
  templates = [],
  onGenerate,
  entityType,
}: ExcelGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  // Initialize selectedColumns based on the provided columns prop
  const [selectedColumns, setSelectedColumns] = useState<ExcelColumn[]>(columns.map(col => ({...col})));
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    templates.length > 0 ? templates[0].id : undefined // Select the first template by default if available
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined); // Default to undefined or 'none'
  const [activeTab, setActiveTab] = useState("columns");

    const groupByOptions = [
    { value: "none", label: "No Grouping" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

    // Additional grouping options based on entity type
  const entityGroupOptions = {
    financial: [
      { value: "service", label: "By Service" },
      { value: "provider", label: "By Provider" },
    ],
    sales: [
      { value: "service", label: "By Service" },
      { value: "provider", label: "By Provider" },
      { value: "product", label: "By Product" },
    ],
    complaints: [
      { value: "status", label: "By Status" },
      { value: "priority", label: "By Priority" },
      { value: "service", label: "By Service" },
      { value: "provider", label: "By Provider" },
    ],
    contracts: [
      { value: "status", label: "By Status" },
      { value: "type", label: "By Type" },
      { value: "provider", label: "By Provider" },
    ],
    providers: [
      { value: "status", label: "By Status" },
      { value: "service", label: "By Service" },
    ],
    services: [
      { value: "type", label: "By Type" },
      { value: "provider", label: "By Provider" },
    ],
  };

    const combinedGroupOptions = [
    ...groupByOptions,
    ...(entityGroupOptions[entityType] || []),
  ];

    const handleSelectAllColumns = () => {
    setSelectedColumns(
      selectedColumns.map((col) => ({ ...col, selected: true }))
    );
  };

    const handleSelectNoColumns = () => {
    setSelectedColumns(
      selectedColumns.map((col) => ({ ...col, selected: false }))
    );
  };

    const handleColumnToggle = (id: string) => {
    setSelectedColumns(
      selectedColumns.map((col) =>
        col.id === id ? { ...col, selected: !col.selected } : col
      )
    );
  };

    const handleGenerateExcel = async () => {
    const selectedColumnIds = selectedColumns
      .filter((col) => col.selected)
      .map((col) => col.id);

        if (selectedColumnIds.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

        setIsGenerating(true);

        try {
      await onGenerate({
        columns: selectedColumnIds,
        dateRange: { start: startDate, end: endDate },
        templateId: selectedTemplate,
        includeCharts,
        groupBy: groupBy === "none" || groupBy === undefined ? undefined : groupBy, // Pass undefined if 'none' or not set
      });

            // Depending on the implementation of onGenerate, you might receive
            // a download URL here and trigger the download.
            // toast success message moved to finally block or inside try if download is handled here

    } catch (error) {
      console.error("Failed to generate Excel:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setIsGenerating(false);
       // Show success toast after successful generation and potential download
      if (!error) { // Only show success if no error occurred
         toast.success("Excel report generation initiated."); // Or "Report downloaded successfully"
      }
    }
  };

    return (
    <Card className={cn("w-full", className)}> {/* Added className prop support */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {/* Added Separator for visual separation */}
      {/* <Separator /> */} {/* Use a Separator if desired */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6"> {/* Added padding to TabsList container */}
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Columns
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Options
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-6 px-6"> {/* Added padding */}
          <TabsContent value="columns" className="mt-0">
            <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2 sm:gap-0"> {/* Improved layout for smaller screens */}
              <p className="text-sm text-muted-foreground">
                Select columns to include in the report
              </p>
              <div className="flex gap-2 shrink-0"> {/* Prevent buttons from shrinking */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllColumns}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNoColumns}
                >
                  Select None
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Completed mapping and rendering of columns */}
                {selectedColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={column.selected}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                    />
                    <Label
                      htmlFor={`column-${column.id}`}
                      className="font-normal text-sm cursor-pointer" // Added cursor-pointer for better UX
                    >
                      {column.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="filters" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Completed DatePicker structure */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker
                  id="start-date"
                  date={startDate}
                  setDate={setStartDate}
                  placeholder="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker
                  id="end-date"
                  date={endDate}
                  setDate={setEndDate}
                  placeholder="Select end date"
                  fromDate={startDate} // Ensure end date is after start date
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="mt-0">
            <div className="space-y-6">
              {/* Completed Template selection */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Completed Group By selection */}
              <div className="space-y-2">
                <Label htmlFor="groupBy">Group By</Label>
                <Select
                  value={groupBy}
                  onValueChange={setGroupBy}
                  // defaultValue="none" // Use controlled value instead of defaultValue
                >
                  <SelectTrigger id="groupBy">
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    {combinedGroupOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Completed Include Charts checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={includeCharts}
                  onCheckedChange={(checkedState) => setIncludeCharts(!!checkedState)} // Ensure boolean
                />
                <Label htmlFor="charts" className="font-normal text-sm cursor-pointer"> {/* Added cursor-pointer */}
                  Include charts and visualizations
                </Label>
              </div>
            </div>
          </TabsContent>
        </CardContent>

      {/* Added Separator before footer */}
      {/* <Separator /> */} {/* Use a Separator if desired */}

      <CardFooter className="pt-4 px-6 pb-6"> {/* Adjusted padding */}
        {/* Completed Generate Button with loading state */}
        <Button
          className="w-full"
          onClick={handleGenerateExcel}
          disabled={isGenerating || selectedColumns.filter(col => col.selected).length === 0} // Disable if no columns selected
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGenerating ? 'Generating...' : 'Generate Excel Report'}
        </Button>
      </CardFooter>
    </Card>
  );
}