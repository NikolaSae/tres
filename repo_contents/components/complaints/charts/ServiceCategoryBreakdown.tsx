// /components/complaints/charts/ServiceCategoryBreakdown.tsx



import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Complaint, Service, ServiceType } from '@prisma/client';

interface ServiceCategoryBreakdownProps {
  complaints: (Complaint & {
    service?: Service | null;
  })[];
  title?: string;
  height?: number;
}

export function ServiceCategoryBreakdown({ 
  complaints, 
  title = "Complaints by Service Category", 
  height = 300 
}: ServiceCategoryBreakdownProps) {
  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return [];
    }

    // Group complaints by service type
    const serviceTypes: Record<string, number> = {
      VAS: 0,
      BULK: 0,
      HUMANITARIAN: 0,
      PARKING: 0,
      UNKNOWN: 0
    };

    complaints.forEach(complaint => {
      if (complaint.service) {
        serviceTypes[complaint.service.type] += 1;
      } else {
        serviceTypes.UNKNOWN += 1;
      }
    });

    // Convert to chart data format and filter out zeros
    return Object.entries(serviceTypes)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / complaints.length) * 100
      }));
  }, [complaints]);

  // Service type colors
  const typeColors = {
    VAS: '#3b82f6', // blue-500
    BULK: '#8b5cf6', // violet-500
    HUMANITARIAN: '#10b981', // emerald-500
    PARKING: '#f59e0b', // amber-500
    UNKNOWN: '#6b7280', // gray-500
  };

  const renderLabel = ({ type, percentage }: { type: string; percentage: number }) => {
    return percentage > 5 ? `${type}: ${percentage.toFixed(0)}%` : '';
  };

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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="type"
              label={renderLabel}
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={typeColors[entry.type as keyof typeof typeColors]} 
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} complaints (${props.payload.percentage.toFixed(1)}%)`, 
                name
              ]} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}