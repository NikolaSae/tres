////app/(protected)/_components/sidebar.tsx


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  links: { href: string; label: string }[];
}

export const Sidebar = ({ links }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col p-4 space-y-2 min-h-screen w-64 border"> {/* Stilovi za sidebar */}
      {links.map(link => (
        <Button
          key={link.href}
          variant={pathname === link.href ? "default" : "ghost"}
          asChild
        >
          <Link href={link.href}>
            {link.label}
          </Link>
        </Button>
      ))}
    </div>
  );
};