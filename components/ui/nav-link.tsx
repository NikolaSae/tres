// components/ui/nav-link.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  variant?: "mint" | "ocean" | "purple" | "emerald";
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  mint: "from-teal-400 to-cyan-500 shadow-teal-400/20 hover:shadow-teal-400/30",
  ocean: "from-[#667eea] to-[#764ba2] shadow-purple-500/20 hover:shadow-purple-500/30",
  purple: "from-purple-600 to-purple-500 shadow-purple-500/20 hover:shadow-purple-500/30",
  emerald: "from-[#11998e] to-[#38ef7d] shadow-emerald-500/20 hover:shadow-emerald-500/30",
};

export const NavLink: React.FC<NavLinkProps> = ({ 
  href, 
  children, 
  isActive = false,
  variant = "mint",
  onClick,
  className
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden",
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-lg h-9",
          "text-white font-medium text-sm",
          "bg-gradient-to-r",
          variantStyles[variant],
          "shadow-md",
          "hover:shadow-lg",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
          "transition-all duration-300 ease-in-out",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-200%]",
          "hover:before:translate-x-[200%]",
          "before:transition-transform before:duration-700",
          isActive && "ring-2 ring-yellow-400/60 shadow-xl",
          className
        )}
      >
        {children}
      </Link>
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
      )}
    </div>
  );
};