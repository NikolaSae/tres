"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";

export const Newbar = () => {
  const pathname = usePathname();
  return (
    <nav className="bg-secondary flex justify-between items-center p-4 rounded-xl w-[600px] shadow-sm">
      <div className="flex gap-x-2">
        <Button
          variant={pathname === "/dashboard/vas-servisi" ? "default" : "outline"}
          asChild
        >
          <Link href="/dashboard/vas-servisi">Vas-servisi</Link>
        </Button>
        <Button
          variant={pathname === "/dashboard/humanitarni" ? "default" : "outline"}
          asChild
        >
          <Link href="/dashboard/humanitarni">humanitarni</Link>
        </Button>
        <Button variant={pathname === "/dashboard/statistika" ? "default" : "outline"} asChild>
          <Link href="/dashboard/statistika">statistika</Link>
        </Button>
        <Button
          variant={pathname === "/dashboard/import" ? "default" : "outline"}
          asChild
        >
          <Link href="/dashboard/import">import</Link>
        </Button>
      </div>

      <UserButton />
    </nav>
  );
};
