// components/analytics/ContractAnalytics.tsx

'use client';

import { useContractAnalytics } from '@/hooks/use-contract-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ContractAnalytics() {
  const { analytics, isLoading, error } = useContractAnalytics();

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div>Error loading analytics: {error.message}</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.activeContracts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.expiringContracts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalContracts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional analytics sections */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.contractsByType.map((item) => (
              <div key={item.type} className="flex justify-between">
                <span>{item.type}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}