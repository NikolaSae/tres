// components/ui/polished-link-button.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ButtonVariant } from "./polished-button";

const variantStyles: Record<ButtonVariant, string> = {
  ocean: "from-[#667eea] to-[#764ba2] shadow-purple-500/20 hover:shadow-purple-500/30",
  emerald: "from-[#11998e] to-[#38ef7d] shadow-emerald-500/20 hover:shadow-emerald-500/30",
  sunset: "from-[#f093fb] to-[#f5576c] shadow-pink-500/20 hover:shadow-pink-500/30",
  "deep-ocean": "from-blue-900 via-blue-800 to-blue-600 shadow-blue-600/20 hover:shadow-blue-600/30",
  golden: "from-[#f7971e] to-[#ffd200] shadow-yellow-500/20 hover:shadow-yellow-500/30",
  chrome: "from-gray-400 to-gray-700 shadow-gray-600/20 hover:shadow-gray-600/30",
  purple: "from-purple-600 to-purple-500 shadow-purple-500/20 hover:shadow-purple-500/30",
  mint: "from-teal-400 to-cyan-500 shadow-teal-400/20 hover:shadow-teal-400/30",
  lime: "from-lime-400 via-lime-500 to-lime-300 shadow-lime-400/20 hover:shadow-lime-400/30",
  lavender: "from-gray-400 via-purple-400 to-purple-500 shadow-purple-400/20 hover:shadow-purple-400/30",
  fire: "from-orange-600 via-red-500 to-orange-400 shadow-orange-500/20 hover:shadow-orange-500/30",
  forest: "from-[#134e5e] to-[#71b280] shadow-green-600/20 hover:shadow-green-600/30",
};

interface PolishedLinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  isActive?: boolean;
  className?: string;
}

export const PolishedLinkButton: React.FC<PolishedLinkButtonProps> = ({
  href,
  children,
  variant = "mint",
  isActive = false,
  className,
}) => {
  return (
    <Link
      href={href}
      className={cn(
        // Base styles
        "relative overflow-hidden",
        "inline-flex items-center justify-center gap-2",
        "px-4 py-2 rounded-lg",
        "text-white font-medium text-sm",
        "bg-gradient-to-r",
        variantStyles[variant],
        "shadow-md",
        "hover:shadow-lg",
        "hover:-translate-y-0.5",
        "active:translate-y-0",
        "transition-all duration-300 ease-in-out",
        // Shine effect
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-200%]",
        "hover:before:translate-x-[200%]",
        "before:transition-transform before:duration-700",
        // Active state
        isActive && "ring-2 ring-white/30",
        className
      )}
    >
      {children}
    </Link>
  );
};