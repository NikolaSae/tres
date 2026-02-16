///components/contracts/charts/ExpiryTimelineChart.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractType } from "@prisma/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { format } from "date-fns";

interface ContractInfo {
  id: string;
  contractNumber: string;
  organizationName: string;
  type: ContractType;
  endDate: Date;
  status: string;
  value?: number;
  hasRenewal: boolean;
}

interface ExpiryData {
  month: string;
  date: Date;
  provider: number;
  humanitarian: number;
  parking: number;
  total: number;
  contracts: ContractInfo[];
}

interface ExpiryTimelineChartProps {
  data: any[]; // Accept raw contract data
  title?: string;
  showLegend?: boolean;
  height?: number;
}

export function ExpiryTimelineChart({ 
  data: rawData = [],
  title = "Vremenski tok isteka ugovora",
  showLegend = true,
  height = 350
}: ExpiryTimelineChartProps) {
  
  // Transform contract data into ExpiryData format
  const data: ExpiryData[] = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Group contracts by month
    const monthMap = new Map<string, ExpiryData>();
    
    rawData.forEach((contract: any) => {
      const endDate = new Date(contract.endDate);
      const monthKey = format(endDate, 'MMM yyyy');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthKey,
          date: endDate,
          provider: 0,
          humanitarian: 0,
          parking: 0,
          total: 0,
          contracts: []
        });
      }
      
      const monthData = monthMap.get(monthKey)!;
      
      // Increment count based on contract type
      if (contract.type === 'PROVIDER') {
        monthData.provider++;
      } else if (contract.type === 'HUMANITARIAN') {
        monthData.humanitarian++;
      } else if (contract.type === 'PARKING') {
        monthData.parking++;
      }
      
      monthData.total++;
      monthData.contracts.push({
        id: contract.id,
        contractNumber: contract.contractNumber,
        organizationName: contract.provider?.name || contract.humanitarianOrg?.name || contract.parkingService?.name || 'N/A',
        type: contract.type,
        endDate: endDate,
        status: contract.status,
        value: 0,
        hasRenewal: false
      });
    });
    
    // Convert map to array and sort by date
    return Array.from(monthMap.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
  }, [rawData]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = data.find(item => item.month === label);
    if (!dataPoint) return null;

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg max-w-sm">
        <div className="border-b pb-2 mb-3">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            {format(new Date(dataPoint.date), "MMMM yyyy")}
          </p>
        </div>
        
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div 
              key={`tooltip-item-${index}`} 
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {entry.value}
              </span>
            </div>
          ))}
          
          <div className="pt-2 mt-2 border-t border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-900">
                Ukupno
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {dataPoint.total}
              </span>
            </div>
          </div>
        </div>

        {/* Show contract details if there are few contracts */}
        {dataPoint.contracts.length > 0 && dataPoint.contracts.length <= 5 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Ugovori:</p>
            <div className="space-y-1">
              {dataPoint.contracts.map((contract) => (
                <div key={contract.id} className="text-xs text-gray-600">
                  <span className="font-medium">{contract.contractNumber}</span>
                  {" - "}
                  <span>{contract.organizationName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get color for contract type
  const getContractTypeColor = (type: string) => {
    const colors = {
      provider: "#3b82f6",    // blue-500
      humanitarian: "#10b981", // emerald-500  
      parking: "#f59e0b",     // amber-500
    };
    return colors[type as keyof typeof colors] || "#6b7280"; // gray-500
  };

  // Contract type labels
  const getContractTypeLabel = (type: string) => {
    const labels = {
      provider: "Pružalac usluga",
      humanitarian: "Humanitarna pomoć", 
      parking: "Parking servis",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Transform data for chart (ensure all values are numbers)
  const chartData = data.map(item => ({
    ...item,
    provider: Number(item.provider) || 0,
    humanitarian: Number(item.humanitarian) || 0,
    parking: Number(item.parking) || 0,
    total: Number(item.total) || 0,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">Nema podataka za prikaz</p>
              <p className="text-sm text-gray-500">
                Timeline podaci će biti prikazani kada se učitaju ugovori
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9" 
                opacity={0.7}
              />
              <XAxis 
                dataKey="month" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tickMargin={10}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                  iconType="rect"
                />
              )}
              <Bar 
                dataKey="provider" 
                name={getContractTypeLabel("provider")}
                stackId="contracts" 
                fill={getContractTypeColor("provider")}
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="humanitarian" 
                name={getContractTypeLabel("humanitarian")}
                stackId="contracts" 
                fill={getContractTypeColor("humanitarian")}
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="parking" 
                name={getContractTypeLabel("parking")}
                stackId="contracts" 
                fill={getContractTypeColor("parking")}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}