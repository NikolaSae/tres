  // components/complaints/AmountSummary.tsx

  import { useMemo } from 'react';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { DollarSign, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
  import { Complaint } from '@prisma/client';
  import { formatCurrency } from '@/utils/format';

  interface AmountSummaryProps {
    complaints: Complaint[];
    timeframe?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  }

  export function AmountSummary({ complaints, timeframe = 'monthly' }: AmountSummaryProps) {
    const summary = useMemo(() => {
      if (!complaints || complaints.length === 0) {
        return {
          totalImpact: 0,
          resolvedImpact: 0,
          pendingImpact: 0,
          averageImpact: 0,
        };
      }

      const totalImpact = complaints.reduce((sum, complaint) => 
        sum + (complaint.financialImpact || 0), 0);
      
      const resolvedComplaints = complaints.filter(
        c => c.status === 'RESOLVED' || c.status === 'CLOSED'
      );
      const resolvedImpact = resolvedComplaints.reduce((sum, complaint) => 
        sum + (complaint.financialImpact || 0), 0);
      
      const pendingComplaints = complaints.filter(
        c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED'
      );
      const pendingImpact = pendingComplaints.reduce((sum, complaint) => 
        sum + (complaint.financialImpact || 0), 0);
      
      const averageImpact = complaints.length > 0 ? totalImpact / complaints.length : 0;

      return {
        totalImpact,
        resolvedImpact,
        pendingImpact,
        averageImpact,
      };
    }, [complaints]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Financial Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalImpact)}</div>
            <p className="text-xs text-muted-foreground">
              From {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.resolvedImpact)}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.resolvedImpact / summary.totalImpact) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Impact</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingImpact)}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.pendingImpact / summary.totalImpact) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Impact</CardTitle>
            <BarChart2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageImpact)}</div>
            <p className="text-xs text-muted-foreground">
              Per complaint ({timeframe})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }