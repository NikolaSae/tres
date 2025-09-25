///components/analytics/AnomalyDetection.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  LineChart as LineChartIcon,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

// Types for anomalies
type AnomalyCategory = 'financial' | 'sales' | 'complaints' | 'providers';

interface Anomaly {
  id: string;
  category: AnomalyCategory;
  metric: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  value: number;
  expectedValue: number;
  deviation: number;
  historical?: { date: string; value: number }[];
}

// Mock data - would be replaced with API calls in a real implementation
const mockAnomalies: Anomaly[] = [
  {
    id: "a1",
    category: "financial",
    metric: "Revenue Collection Rate",
    description: "Revenue collection rate significantly below average for VAS services",
    severity: "high",
    detectedAt: "2025-04-28T10:30:00Z",
    value: 68.4,
    expectedValue: 85.2,
    deviation: -19.7,
    historical: [
      { date: "2025-04-01", value: 84.5 },
      { date: "2025-04-07", value: 83.7 },
      { date: "2025-04-14", value: 80.2 },
      { date: "2025-04-21", value: 76.8 },
      { date: "2025-04-28", value: 68.4 },
    ]
  },
  {
    id: "a2",
    category: "sales",
    metric: "Transaction Volume",
    description: "Sudden spike in transaction volume for bulk services",
    severity: "medium",
    detectedAt: "2025-04-29T08:15:00Z",
    value: 15743,
    expectedValue: 12500,
    deviation: 25.9,
    historical: [
      { date: "2025-04-01", value: 12300 },
      { date: "2025-04-07", value: 12450 },
      { date: "2025-04-14", value: 12380 },
      { date: "2025-04-21", value: 12800 },
      { date: "2025-04-28", value: 15743 },
    ]
  },
  {
    id: "a3",
    category: "complaints",
    metric: "Resolution Time",
    description: "Increasing trend in complaint resolution time for Provider A",
    severity: "high",
    detectedAt: "2025-04-27T14:20:00Z",
    value: 86.4,
    expectedValue: 48.0,
    deviation: 80,
    historical: [
      { date: "2025-04-01", value: 47.2 },
      { date: "2025-04-07", value: 52.5 },
      { date: "2025-04-14", value: 61.8 },
      { date: "2025-04-21", value: 74.6 },
      { date: "2025-04-28", value: 86.4 },
    ]
  },
  {
    id: "a4",
    category: "providers",
    metric: "Service Availability",
    description: "Provider B showing unusual downtime patterns",
    severity: "critical",
    detectedAt: "2025-04-30T09:10:00Z",
    value: 88.5,
    expectedValue: 99.9,
    deviation: -11.4,
    historical: [
      { date: "2025-04-01", value: 99.8 },
      { date: "2025-04-07", value: 99.9 },
      { date: "2025-04-14", value: 99.7 },
      { date: "2025-04-21", value: 94.2 },
      { date: "2025-04-28", value: 88.5 },
    ]
  },
  {
    id: "a5",
    category: "financial",
    metric: "Write-off Rate",
    description: "Higher than normal write-off rate for humanitarian services",
    severity: "medium",
    detectedAt: "2025-04-26T16:45:00Z",
    value: 3.8,
    expectedValue: 1.5,
    deviation: 153.3,
    historical: [
      { date: "2025-04-01", value: 1.6 },
      { date: "2025-04-07", value: 1.7 },
      { date: "2025-04-14", value: 2.1 },
      { date: "2025-04-21", value: 2.9 },
      { date: "2025-04-28", value: 3.8 },
    ]
  }
];

const getSeverityColor = (severity: Anomaly['severity']) => {
  switch(severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getCategoryIcon = (category: AnomalyCategory) => {
  switch(category) {
    case 'financial': return <PieChart className="h-4 w-4" />;
    case 'sales': return <BarChart3 className="h-4 w-4" />;
    case 'complaints': return <AlertCircle className="h-4 w-4" />;
    case 'providers': return <LineChartIcon className="h-4 w-4" />;
    default: return null;
  }
};

const getDeviationIcon = (deviation: number) => {
  if (deviation > 0) {
    return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  } else {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
};

export function AnomalyDetection() {
  const [selectedCategory, setSelectedCategory] = useState<AnomalyCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  // Simulate API loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnomalies(mockAnomalies);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredAnomalies = selectedCategory === 'all'
    ? anomalies
    : anomalies.filter(anomaly => anomaly.category === selectedCategory);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Anomaly Detection
        </CardTitle>
        <CardDescription>
          System detected unusual patterns requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="all" 
          onValueChange={(value) => setSelectedCategory(value as AnomalyCategory | 'all')}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAnomalies.length > 0 ? filteredAnomalies.map(anomaly => (
                  <Card 
                    key={anomaly.id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setSelectedAnomaly(anomaly)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(anomaly.category)}
                          <span className="font-medium">{anomaly.metric}</span>
                        </div>
                        <Badge className={`${getSeverityColor(anomaly.severity)} text-white`}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-muted-foreground mb-3">{anomaly.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          {getDeviationIcon(anomaly.deviation)}
                          <span>{Math.abs(anomaly.deviation).toFixed(1)}% deviation</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(anomaly.detectedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full flex items-center justify-center h-32 text-muted-foreground">
                    No anomalies detected in this category
                  </div>
                )}
              </div>

              {selectedAnomaly && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedAnomaly.category)}
                      {selectedAnomaly.metric} Detail
                    </CardTitle>
                    <Badge className={`${getSeverityColor(selectedAnomaly.severity)} text-white`}>
                      {selectedAnomaly.severity}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{selectedAnomaly.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Current Value</p>
                        <p className="text-2xl font-bold">{selectedAnomaly.value}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Expected Value</p>
                        <p className="text-2xl font-bold">{selectedAnomaly.expectedValue}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Deviation</p>
                        <div className="flex items-center">
                          {getDeviationIcon(selectedAnomaly.deviation)}
                          <p className="text-2xl font-bold ml-1">
                            {Math.abs(selectedAnomaly.deviation).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedAnomaly.historical && (
                      <div className="h-64 w-full">
                        <p className="text-sm font-medium mb-2">Historical Trend</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={selectedAnomaly.historical} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => [value, selectedAnomaly.metric]} 
                              labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#4f46e5" 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}