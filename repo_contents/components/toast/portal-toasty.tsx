// Path: components/toast/portal-toasty.tsx
'use client';

import { useToast } from './toast-context';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export function PortalToasty() {
  const { toasts, removeToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Make sure the portal returns a single element
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`py-2 px-4 rounded-md shadow-md ${
            toast.isError
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          } flex items-center justify-between`}
          role="alert"
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}