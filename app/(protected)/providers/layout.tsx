// app/(protected)/providers/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    redirect("/403");
  }

  return <>{children}</>;
}