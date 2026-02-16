// components/ui/toast.tsx
import * as React from "react"

export type ToastActionElement = React.ReactElement<any>

export interface ToastProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
}

// Ovo je placeholder - verovatno imaš pravu Toast komponentu negde
export const Toast = ({ children, ...props }: ToastProps & { children?: React.ReactNode }) => {
  return <div {...props}>{children}</div>
}