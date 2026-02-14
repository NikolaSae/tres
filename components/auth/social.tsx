// components/auth/social.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  
  const onClick = async (provider: "google" | "github") => {
    try {
      if (provider === "google") {
        setIsGoogleLoading(true);
      } else {
        setIsGithubLoading(true);
      }
      
      await signIn(provider, {
        callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
      });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`Greška pri ${provider === "google" ? "Google" : "GitHub"} prijavljivanju`);
      
      if (provider === "google") {
        setIsGoogleLoading(false);
      } else {
        setIsGithubLoading(false);
      }
    }
  };
  
  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
        disabled={isGoogleLoading || isGithubLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FcGoogle className="h-5 w-5" />
        )}
      </Button>
      
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("github")}
        disabled={isGoogleLoading || isGithubLoading}
      >
        {isGithubLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FaGithub className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};