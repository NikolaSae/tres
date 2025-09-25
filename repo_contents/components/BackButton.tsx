// Path: components/BackButton.tsx
"use client"; // Ova komponenta koristi hook useRouter, pa mora biti Client Component

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Pretpostavljamo da koristite shadcn/ui Button
import { ArrowLeft } from "lucide-react"; // Pretpostavljamo da koristite lucide-react za ikone
import React from "react";

interface BackButtonProps {
  /** Optional text to display next to the arrow icon. */
  text?: string;
  /** Optional variant for the button (e.g., "ghost", "outline"). */
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  /** Optional size for the button (e.g., "default", "sm", "lg", "icon"). */
  size?: "default" | "sm" | "lg" | "icon";
  /** Optional className for custom styling. */
  className?: string;
  /** Optional handler for click event, overrides default back behavior if provided. */
  onClick?: () => void;
  /** Whether the button should be disabled. */
  disabled?: boolean;
}

/**
 * A reusable button component that navigates back in the browser history.
 * Uses shadcn/ui Button and lucide-react ArrowLeft icon.
 */
export function BackButton({
  text,
  variant = "ghost", // Podrazumevano je ghost varijanta
  size = "default",
  className,
  onClick,
  disabled = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onClick) {
      onClick(); // Ako je onClick prop prosleđen, pozovi njega
    } else {
      router.back(); // Inače, koristi router.back() za navigaciju unazad
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBackClick}
      disabled={disabled}
      className={className}
    >
      <ArrowLeft className={text ? "mr-2 h-4 w-4" : "h-4 w-4"} /> {/* Dodaj marginu ako ima teksta */}
      {text}
    </Button>
  );
}
