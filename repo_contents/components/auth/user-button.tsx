// Path: /components/auth/user-button.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserButton() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug session information
  useEffect(() => {
    console.log("[USER_BUTTON] ===== SESSION DEBUG =====");
    console.log("[USER_BUTTON] Status:", status);
    console.log("[USER_BUTTON] Session:", session);
    console.log("[USER_BUTTON] User:", session?.user);
    console.log("[USER_BUTTON] Current URL:", window.location.href);
    console.log("[USER_BUTTON] Mounted:", mounted);
    console.log("[USER_BUTTON] ========================");
  }, [session, status, mounted]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <User className="w-4 h-4" />
        <span>Not logged in</span>
      </div>
    );
  }

  const user = session.user;
  const userInitials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            console.log("[USER_BUTTON] Signing out...");
            signOut({ callbackUrl: "/auth/signin" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}