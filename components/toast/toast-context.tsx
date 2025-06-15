// Path: components/toast/toast-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

type ToastType = {
  message: string;
  isError: boolean;
  id: number;
};

type ToastContextType = {
  toasts: ToastType[];
  showToastMessage: (message: string, isError: boolean) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [nextId, setNextId] = useState(1);

  const showToastMessage = (message: string, isError: boolean) => {
    const id = nextId;
    setNextId(id + 1);
    setToasts((prev) => [...prev, { message, isError, id }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Create a single value object to avoid re-renders
  const contextValue = {
    toasts,
    showToastMessage,
    removeToast,
  };

  // Wrap in a Fragment or a single div to ensure a single root element
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};