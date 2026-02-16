// app/auth/new-verification/page.tsx - Optimizovano
import { Suspense } from "react";
import { NewVerifictionForm } from "@/components/auth/new-verification-form";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikacija Email-a",
  description: "Verifikujte vaš email nalog",
};

function VerificationFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function NewVerificationPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <NewVerifictionForm />
    </Suspense>
  );
}