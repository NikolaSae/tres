// components/auth/refresh-session-button.tsx
"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function RefreshSessionButton() {
  const { update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await update(); // ✅ Ovo triggeruje jwt callback sa trigger: "update"
      toast.success("Sesija osvežena!", {
        description: "Vaša rola i podaci su ažurirani"
      });
      
      // Opciono: Reload page da bi se navbar osvežio
      window.location.reload();
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Greška pri osvežavanju sesije");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Button 
      onClick={handleRefresh} 
      variant="outline" 
      size="sm"
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? "Osvežavam..." : "Osveži sesiju"}
    </Button>
  );
}