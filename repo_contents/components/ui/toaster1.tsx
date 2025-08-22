// Path: components/ui/toaster.tsx
"use client";

// ISPRAVITE OVU PUTANJU da pokazuje na vaš use-toast.tsx fajl
import { useToast } from "@/components/ui/use-toast"; // <-- Ispravite OVDJE putanju!

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"; // Proverite da li putanja do toast.tsx odgovara i OVDE


export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <ToastViewport />
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
    </ToastProvider>
  );
}