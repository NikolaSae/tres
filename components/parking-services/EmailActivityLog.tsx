"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EmailActivityLog({ serviceId }: { serviceId: string }) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`/api/parking-services/activity?serviceId=${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    };
    fetchLogs();
  }, [serviceId]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>📨 Email Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">No emails sent yet.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="border-b pb-2">
                <div className="font-medium">{log.description}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
