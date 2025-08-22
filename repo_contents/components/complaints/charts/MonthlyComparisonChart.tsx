// /components/complaints/charts/MonthlyComparisonChart.tsx


import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Complaint } from '@prisma/client';
import { format, parseISO, subMonths, differenceInMonths, startOfMonth, endOfMonth } from 'date-fns';

interface MonthlyComparisonChartProps {
  complaints: Complaint[];
  monthsToShow?: number;
  title?: string;
  height?: number;
}

export function MonthlyComparisonChart({ 
  complaints, 
  monthsToShow = 6,
  title = "Monthly Complaint Comparison", 
  height = 300 
}: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return [];
    }

    // Get the current month and create an array of the last n months
    const today = new Date();
    const months = Array.from({ length: monthsToShow }, (_, i) => {
      const month = subMonths(today, i);
      return {
        date: month,
        key: format(month, 'yyyy-MM')
      };
    }).reverse();

    // Create data points for each month
    return months.map(({ date, key }) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      // Count complaints created in this month
      const totalCount = complaints.filter(complaint => {
        const createdAt = new Date(complaint.createdAt);
        return createdAt >= start && createdAt <= end;
      }).length;
      
      // Count resolved complaints in this month
      const resolvedCount = complaints.filter(complaint => {
        const resolvedAt = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null;
        return resolvedAt && resolvedAt >= start && resolvedAt <= end;
      }).length;
      
      // Count high priority complaints (priority 1-2)
      const highPriorityCount = complaints.filter(complaint => {
        const createdAt = new Date(complaint.createdAt);
        return createdAt >= start && createdAt <= end && (complaint.priority === 1 || complaint.priority === 2);
      }).length;
      
      return {
        month: format(date, 'MMM yyyy'),
        total: totalCount,
        resolved: resolvedCount,
        highPriority: highPriorityCount
      };
    });
  }, [complaints, monthsToShow]);

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
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Total Complaints" fill="#3b82f6" />
            <Bar dataKey="resolved" name="Resolved" fill="#10b981" />
            <Bar dataKey="highPriority" name="High Priority" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}