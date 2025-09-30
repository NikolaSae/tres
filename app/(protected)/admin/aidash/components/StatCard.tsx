import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Database, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value?: number;
  subtitle?: string;
  icon: 'MessageCircle' | 'Database' | 'Users' | 'AlertCircle';
  color?: 'default' | 'success' | 'warning' | 'error';
}

const iconMap = { MessageCircle, Database, Users, AlertCircle };
const colorClasses = {
  default: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  success: 'text-green-600 bg-green-50 dark:bg-green-950',
  warning: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  error: 'text-red-600 bg-red-50 dark:bg-red-950'
};

export function StatCard({ title, value = 0, subtitle, icon, color='default' }: StatCardProps) {
  const Icon = iconMap[icon];
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
      <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value?.toLocaleString() || 0}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
