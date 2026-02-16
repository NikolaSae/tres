// app/auth/new-password/page.tsx - Optimizovano
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nova Lozinka",
  description: "Resetujte svoju lozinku",
};

function PasswordResetFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<PasswordResetFallback />}>
      <NewPasswordForm />
    </Suspense>
  );
}