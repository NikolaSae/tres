// app/auth/layout.tsx
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "Autentifikacija",
    template: "%s | Fin-App-Hub",
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Ako je već ulogovan — nema smisla da vidi login/register
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}