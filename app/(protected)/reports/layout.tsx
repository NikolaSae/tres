// app/(protected)/reports/layout.tsx
import { connection } from 'next/server';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const allowedRoles = ["ADMIN", "MANAGER", "AGENT"];
  if (!allowedRoles.includes(session.user.role as string)) {
    redirect("/403");
  }

  return <>{children}</>;
}