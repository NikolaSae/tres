// app/(protected)/_components/SessionWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { ReactNode } from "react";

interface SessionWrapperProps {
  children: ReactNode;
  session: Session | null;
}

export function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={300}
      refetchOnWindowFocus={false}
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}