// /components/complaints/charts/ProviderPerformance.tsx


import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Complaint, Provider } from '@prisma/client';

interface ProviderPerformanceProps {
  complaints: (Complaint & {
    provider?: Provider | null;
  })[];
  title?: string;
  height?: number;
  maxProviders?: number;
}

export function ProviderPerformance({ 
  complaints, 
  title = "Provider Performance", 
  height = 400,
  maxProviders = 10
}: ProviderPerformanceProps) {
  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return [];
    }

    // Group complaints by provider
    const providerComplaints: Record<string, {
      providerId: string,
      providerName: string,
      total: number,
      resolved: number,
      pending: number,
      avgResolutionTime: number,
      totalResolutionTime: number,
      resolvedCount: number
    }> = {};

    complaints.forEach(complaint => {
      if (!complaint.provider) return;

      const providerId = complaint.provider.id;
      const providerName = complaint.provider.name;
      
      if (!providerComplaints[providerId]) {
        providerComplaints[providerId] = {
          providerId,
          providerName,
          total: 0,
          resolved: 0,
          pending: 0,
          avgResolutionTime: 0,
          totalResolutionTime: 0,
          resolvedCount: 0
        };
      }
      
      // Increment total
      providerComplaints[providerId].total += 1;
      
      // Check if resolved
      if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
        providerComplaints[providerId].resolved += 1;
        
        // Calculate resolution time if available
        if (complaint.resolvedAt && complaint.createdAt) {
          const createdAt = new Date(complaint.createdAt);
          const resolvedAt = new Date(complaint.resolvedAt);
          const resolutionTime = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // days
          
          providerComplaints[providerId].totalResolutionTime += resolutionTime;
          providerComplaints[providerId].resolvedCount += 1;
        }
      } else if (complaint.status !== 'REJECTED') {
        // Count as pending if not resolved and not rejected
        providerComplaints[providerId].pending += 1;
      }
    });

    // Calculate average resolution time
    Object.values(providerComplaints).forEach(provider => {
      if (provider.resolvedCount > 0) {
        provider.avgResolutionTime = provider.totalResolutionTime / provider.resolvedCount;
      }
    });

    // Sort by total complaints and take top N
    return Object.values(providerComplaints)
      .sort((a, b) => b.total - a.total)
      .slice(0, maxProviders)
      .map(provider => ({
        name: provider.providerName,
        total: provider.total,
        resolved: provider.resolved,
        pending: provider.pending,
        avgResolutionTime: parseFloat(provider.avgResolutionTime.toFixed(1))
      }));
  }, [complaints, maxProviders]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Total Complaints" fill="#3b82f6" />
            <Bar dataKey="resolved" name="Resolved" fill="#10b981" />
            <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}