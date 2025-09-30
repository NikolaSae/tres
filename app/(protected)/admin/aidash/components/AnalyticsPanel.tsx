// app/(protected)/admin/aidash/components/AnalyticsPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Zap, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsPanelProps {
  topTools: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    toolName: string;
    timestamp: string;
    count: number;
  }>;
}

export function AnalyticsPanel({ topTools, recentActivity }: AnalyticsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Tools */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            Najpopularniji tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topTools.length > 0 ? (
              topTools.map((tool, idx) => (
                <motion.div 
                  key={`topTool-${tool.name}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{tool.name}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white dark:bg-gray-800 shadow-sm">
                    {tool.count} korišćenja
                  </Badge>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nema podataka o tools-ima</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Activity className="h-5 w-5" />
            </div>
            Nedavne aktivnosti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <motion.div
                  key={`activity-${activity.userId}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-xl border bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {activity.toolName} ({activity.count} upita)
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.userName} - {new Date(activity.timestamp).toLocaleString('sr-RS')}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Uspešno
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">Nema nedavnih aktivnosti</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}