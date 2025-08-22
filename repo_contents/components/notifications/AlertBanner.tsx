// /components/notifications/AlertBanner.tsx
import { useState, useEffect } from 'react';
import { XCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertBannerProps {
  message: string;
  type?: AlertType;
  showIcon?: boolean;
  dismissible?: boolean;
  duration?: number | null; // null means it won't auto-dismiss
  className?: string;
  onDismiss?: () => void;
}

export const AlertBanner = ({
  message,
  type = 'info',
  showIcon = true,
  dismissible = true,
  duration = 5000, // 5 seconds by default
  className = '',
  onDismiss
}: AlertBannerProps) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (duration !== null && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, visible, onDismiss]);
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };
  
  if (!visible) return null;
  
  const typeStyles = {
    success: 'bg-green-50 border-green-500 text-green-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    error: 'bg-red-50 border-red-500 text-red-700'
  };
  
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />
  };
  
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-4 mb-4 rounded border',
        typeStyles[type],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            {iconMap[type]}
          </div>
        )}
        <div className="text-sm font-medium">{message}</div>
      </div>
      
      {dismissible && (
        <button
          type="button"
          className={cn(
            'ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8',
            type === 'success' && 'bg-green-50 text-green-500 hover:bg-green-100',
            type === 'info' && 'bg-blue-50 text-blue-500 hover:bg-blue-100',
            type === 'warning' && 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100',
            type === 'error' && 'bg-red-50 text-red-500 hover:bg-red-100'
          )}
          aria-label="Close"
          onClick={handleDismiss}
        >
          <span className="sr-only">Close</span>
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Alert context for global alert management
import { createContext, useContext, ReactNode } from 'react';

type AlertOptions = {
  type?: AlertType;
  duration?: number | null;
  dismissible?: boolean;
};

type AlertContextType = {
  showAlert: (message: string, options?: AlertOptions) => void;
  hideAlert: () => void;
};

export const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {}
});

export const useAlert = () => useContext(AlertContext);

type AlertProviderProps = {
  children: ReactNode;
};

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alert, setAlert] = useState<{
    message: string;
    type: AlertType;
    visible: boolean;
    duration: number | null;
    dismissible: boolean;
  } | null>(null);
  
  const showAlert = (
    message: string, 
    options: AlertOptions = {}
  ) => {
    setAlert({
      message,
      type: options.type || 'info',
      visible: true,
      duration: options.duration !== undefined ? options.duration : 5000,
      dismissible: options.dismissible !== undefined ? options.dismissible : true
    });
  };
  
  const hideAlert = () => {
    setAlert(null);
  };
  
  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {alert && alert.visible && (
        <div className="fixed top-4 right-4 left-4 z-50 md:left-auto md:right-4 md:w-96">
          <AlertBanner
            message={alert.message}
            type={alert.type}
            dismissible={alert.dismissible}
            duration={alert.duration}
            onDismiss={hideAlert}
          />
        </div>
      )}
      {children}
    </AlertContext.Provider>
  );
};