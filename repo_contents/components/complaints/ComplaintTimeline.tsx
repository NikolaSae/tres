// components/complaints/ComplaintTimeline.tsx

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ComplaintStatusHistory, User } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ISPRAVLJENO: Promenjen uvoz imena funkcije
import { getStatusColorClass, getStatusLabel } from '@/utils/complaint-status';
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';

interface ComplaintTimelineProps {
  statusHistory: (ComplaintStatusHistory & {
    changedBy?: Pick<User, 'id' | 'name' | 'email'>;
  })[];
}

export function ComplaintTimeline({ statusHistory }: ComplaintTimelineProps) {
  const sortedHistory = useMemo(() => {
    return [...statusHistory].sort((a, b) =>
      new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );
  }, [statusHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Complaint Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {sortedHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No status changes yet</p>
        ) : (
          <div className="relative pl-6 border-l border-border">
            {sortedHistory.map((entry, index) => (
              <div key={entry.id} className="mb-6 relative">
                <div className="absolute -left-[25px] mt-1">
                  {getStatusIcon(entry.newStatus)}
                </div>
                <div className="ml-4">
                  <div className="font-medium">
                    {entry.previousStatus && (
                      <span className="text-sm">
                        {/* ISPRAVLJENO: Promenjeno getStatusColor u getStatusColorClass */}
                        <span className={`${getStatusColorClass(entry.previousStatus)}`}>
                          {getStatusLabel(entry.previousStatus)}
                        </span>
                        <ArrowRight className="inline mx-1 h-3 w-3" />
                      </span>
                    )}
                    {/* ISPRAVLJENO: Promenjeno getStatusColor u getStatusColorClass */}
                    <span className={`${getStatusColorClass(entry.newStatus)}`}>
                      {getStatusLabel(entry.newStatus)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.changedAt), 'PPP p')}
                    {entry.changedBy && (
                      <span> by {entry.changedBy.name || entry.changedBy.email}</span>
                    )}
                  </p>

                  {entry.notes && (
                    <p className="mt-1 text-sm">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
