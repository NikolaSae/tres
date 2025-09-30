// app/(protected)/admin/aidash/components/ToolsPanel.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ToolUsage } from '@/lib/types/dashboard';

interface ToolsPanelProps {
  tools: ToolUsage[];
}

export function ToolsPanel({ tools }: ToolsPanelProps) {
  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
            <Settings className="h-5 w-5" />
          </div>
          Dostupni MCP Tools
        </CardTitle>
        <CardDescription>Pregled svih alata koje AI može koristiti za rad sa bazom</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, idx) => (
            <motion.div 
              key={`tool-${tool.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="border rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="font-medium">{tool.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ukupno korišćenja:</p>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  {tool.count}
                </Badge>
              </div>
              {tool.lastUsed && (
                <p className="text-xs text-muted-foreground mt-2">
                  Poslednje: {new Date(tool.lastUsed).toLocaleString('sr-RS')}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}