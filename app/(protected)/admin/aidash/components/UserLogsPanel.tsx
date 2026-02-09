// app/(protected)/admin/aidash/components/UserLogsPanel.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchUserLogsByEmail } from '../actions/dashboard';
import type { UserLog } from '@/lib/types/dashboard';

export function UserLogsPanel() {
  const [searchEmail, setSearchEmail] = useState('');
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    setError(null);
    setLogs([]); // reset pre nove pretrage
    
    try {
      const result = await searchUserLogsByEmail(searchEmail);
      
      if (result.error) {
        setError(result.error);
        setLogs([]);
      } else {
        // Konvertuj details: string | null → string (da bi bio kompatibilan sa UserLog)
        const safeLogs = (result.logs || []).map(log => ({
          ...log,
          details: log.details ?? 'Nema dodatnih detalja'  // null → fallback string
        })) as UserLog[];

        setLogs(safeLogs);
      }
    } catch (err) {
      console.error('Pretraga logova greška:', err);
      setError('Greška pri pretrazi logova');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Search className="h-5 w-5" />
          </div>
          Pretraga logova korisnika
        </CardTitle>
        <CardDescription>Pretražite aktivnosti specifičnog korisnika po email adresi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-6">
          <Input
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Unesite email adresu korisnika..."
            className="flex-1 rounded-xl"
            disabled={loading}
            type="email"
          />
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchEmail.trim()}
            className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Pretražujem...' : 'Pretraži'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log, idx) => {
              let toolName = 'Nepoznat';
              let args: any = null;

              try {
                const details = JSON.parse(log.details || '{}');
                toolName = details.toolName || 'Nepoznat';
                args = details.parameters || null;
              } catch (err) {
                console.error('Error parsing log details:', err);
              }

              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{toolName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">
                      {new Date(log.createdAt).toLocaleString('sr-RS')}
                    </span>
                  </div>
                  {args && (
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-auto border">
                      {JSON.stringify(args, null, 2)}
                    </pre>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {log.details && log.details !== 'Nema dodatnih detalja' && (
                      <p className="italic">{log.details}</p>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchEmail ? 'Nema pronađenih logova za ovog korisnika' : 'Unesite email za pretragu'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}