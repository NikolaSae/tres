///components/bulk-services/BulkServiceStats.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkServiceStatsProps {
  bulkServices: Array<{
    id: string;
    provider_name: string;
    agreement_name: string;
    service_name: string;
    step_name: string;
    sender_name: string;
    requests: number;
    message_parts: number;
    createdAt: Date;
  }>;
}

export function BulkServiceStats({ bulkServices }: BulkServiceStatsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  // Calculate totals
  const totalRequests = bulkServices.reduce((sum, service) => sum + service.requests, 0);
  const totalMessageParts = bulkServices.reduce((sum, service) => sum + service.message_parts, 0);
  const uniqueProviders = new Set(bulkServices.map(s => s.provider_name)).size;
  const uniqueServices = new Set(bulkServices.map(s => s.service_name)).size;
  
  // Prepare data for provider distribution chart
  const providerData = bulkServices.reduce((acc, curr) => {
    const existingProvider = acc.find(item => item.name === curr.provider_name);
    if (existingProvider) {
      existingProvider.requests += curr.requests;
      existingProvider.messages += curr.message_parts;
    } else {
      acc.push({
        name: curr.provider_name,
        requests: curr.requests,
        messages: curr.message_parts
      });
    }
    return acc;
  }, [] as Array<{ name: string; requests: number; messages: number }>);
  
  // Sort by largest request volume
  providerData.sort((a, b) => b.requests - a.requests);
  
  // Top 5 providers for pie chart, combine others
  const topProviders = providerData.slice(0, 5);
  const otherProviders = providerData.slice(5);
  
  const pieData = [
    ...topProviders,
    ...otherProviders.length > 0 
      ? [{
        name: 'Others',
        requests: otherProviders.reduce((sum, p) => sum + p.requests, 0),
        messages: otherProviders.reduce((sum, p) => sum + p.messages, 0)
      }]
      : []
  ];
  
  // Service data for bar chart
  const serviceData = bulkServices.reduce((acc, curr) => {
    const existingService = acc.find(item => item.name === curr.service_name);
    if (existingService) {
      existingService.requests += curr.requests;
      existingService.messages += curr.message_parts;
    } else {
      acc.push({
        name: curr.service_name,
        requests: curr.requests,
        messages: curr.message_parts
      });
    }
    return acc;
  }, [] as Array<{ name: string; requests: number; messages: number }>);
  
  // Sort and slice for top services
  serviceData.sort((a, b) => b.requests - a.requests);
  const topServices = serviceData.slice(0, 8);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bulk Service Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Message Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessageParts.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProviders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueServices}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Provider Distribution</TabsTrigger>
          <TabsTrigger value="services">Top Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Requests by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="requests"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services by Request Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topServices}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                    />
                    <Legend />
                    <Bar dataKey="requests" name="Requests" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BulkServiceStats;