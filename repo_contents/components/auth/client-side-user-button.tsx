// Path: /components/auth/client-side-user-button.tsx
"use client";

import { UserButton } from './user-button';
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientSideUserButton() {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("[CLIENT_SIDE_USER_BUTTON] Component mounted");
    console.log("[CLIENT_SIDE_USER_BUTTON] Session status:", status);
  }, [status]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <Skeleton className="w-8 h-8 rounded-full" />;
  }

  return <UserButton />;
}