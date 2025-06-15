// hooks/use-check-blacklisted-senders.ts
"use client";

import { useState, useCallback } from "react";
import { checkBlacklistedSenders } from "@/actions/blacklist/check-blacklisted-senders";
import { toast } from "sonner";

export function useCheckBlacklistedSenders() {
  const [matchedSenders, setMatchedSenders] = useState<any[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const checkSenders = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const result = await checkBlacklistedSenders();
      
      if (result.success) {
        setMatchedSenders(result.matches || []);
        
        // Calculate total matches
        const total = result.matches?.reduce(
          (sum, match) => sum + (match.matchingServices?.length || 0),
          0
        ) || 0;
        
        setTotalMatches(total);
        
        if (total > 0) {
          toast.warning(
            `Found ${total} blacklisted senders in BulkService data`,
            {
              description: `${result.matches.length} unique blacklist entries have matches`,
            }
          );
        } else {
          toast.success("No blacklisted senders found in BulkService data");
        }
      } else {
        toast.error(result.error || "Failed to check blacklisted senders");
      }
    } catch (error) {
      console.error("Error checking blacklisted senders:", error);
      toast.error("An unexpected error occurred while checking blacklisted senders");
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearMatches = useCallback(() => {
    setMatchedSenders([]);
    setTotalMatches(0);
  }, []);

  return {
    matchedSenders,
    totalMatches,
    isChecking,
    checkSenders,
    clearMatches,
  };
}