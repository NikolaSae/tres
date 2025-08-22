// /components/complaints/reports/ExcelExport.tsx


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { exportComplaints } from '@/actions/complaints/export';

interface ExcelExportProps {
  onExportStart?: () => void;
  onExportComplete?: (url: string) => void;
  onExportError?: (error: string) => void;
}

export function ExcelExport({ 
  onExportStart, 
  onExportComplete,
  onExportError 
}: ExcelExportProps) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'filtered'>('filtered');
  const [includeOptions, setIncludeOptions] = useState({
    comments: true,
    statusHistory: true,
    attachments: true
  });
  const [dateRange, setDateRange] = useState<'all' | '30' | '90' | '180' | '365'>('30');

  const handleExport = async () => {
    try {
      setLoading(true);
      if (onExportStart) onExportStart();

      const result = await exportComplaints({
        type: exportType,
        dateRange: dateRange === 'all' ? undefined : parseInt(dateRange),
        includeComments: includeOptions.comments,
        includeStatusHistory: includeOptions.statusHistory,
        includeAttachments: includeOptions.attachments
      });

      if (result.error) {
        if (onExportError) onExportError(result.error);
      } else if (result.fileUrl) {
        // Handle successful export
        if (onExportComplete) onExportComplete(result.fileUrl);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = result.fileUrl;
        link.setAttribute('download', result.fileName || 'complaints-export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Export error:', error);
      if (onExportError) onExportError('An unexpected error occurred during export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Complaints</CardTitle>
        <CardDescription>
          Generate an Excel report of complaints data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <Select
              value={exportType}
              onValueChange={(value: 'all' | 'filtered') => setExportType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filtered">Current Filtered View</SelectItem>
                <SelectItem value="all">All Complaints</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={dateRange}
              onValueChange={(value: 'all' | '30' | '90' | '180' | '365') => setDateRange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="180">Last 180 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="comments" 
                checked={includeOptions.comments}
                onCheckedChange={(checked) => 
                  setIncludeOptions({...includeOptions, comments: !!checked})
                }
              />
              <Label htmlFor="comments" className="font-normal">Comments</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="statusHistory" 
                checked={includeOptions.statusHistory}
                onCheckedChange={(checked) => 
                  setIncludeOptions({...includeOptions, statusHistory: !!checked})
                }
              />
              <Label htmlFor="statusHistory" className="font-normal">Status History</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="attachments" 
                checked={includeOptions.attachments}
                onCheckedChange={(checked) => 
                  setIncludeOptions({...includeOptions, attachments: !!checked})
                }
              />
              <Label htmlFor="attachments" className="font-normal">Attachments List</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleExport} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Report...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" /> Export to Excel
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}