// app/auth/reset/page.tsx - Optimizovano
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/reset-form";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resetovanje Lozinke",
  description: "Resetujte vašu lozinku",
};

function ResetFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetForm />
    </Suspense>
  );
}