// components/complaints/NotificationBanner.tsx


import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStatusLabel } from '@/utils/complaint-status';
import { ComplaintStatus } from '@prisma/client';

interface NotificationProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

export function NotificationBanner({ 
  title, 
  message, 
  type = 'info',
  autoClose = true,
  duration = 5000,
  onClose
}: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoClose) {
      timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const alertVariant = type === 'info' ? 'default' : type;

  return (
    <Alert variant={alertVariant} className="mb-4">
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start">
          {getIcon()}
          <div className="ml-3">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="-mt-1 -mr-2" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

// Specialized notification for complaint status changes
export function ComplaintStatusNotification({ 
  complaintId, 
  complaintTitle,
  previousStatus,
  newStatus,
  onClose 
}: {
  complaintId: string;
  complaintTitle: string;
  previousStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  onClose?: () => void;
}) {
  const getNotificationType = (status: ComplaintStatus) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'info';
    }
  };

  const title = `Complaint Status Updated`;
  const message = previousStatus 
    ? `Complaint "${complaintTitle}" has been updated from ${getStatusLabel(previousStatus)} to ${getStatusLabel(newStatus)}`
    : `Complaint "${complaintTitle}" is now ${getStatusLabel(newStatus)}`;

  return (
    <NotificationBanner
      title={title}
      message={message}
      type={getNotificationType(newStatus)}
      onClose={onClose}
    />
  );
}