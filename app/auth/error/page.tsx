// app/auth/error/page.tsx
import { ErrorCard } from "@/components/auth/error-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Greška",
  description: "Došlo je do greške prilikom autentifikacije",
};

export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <ErrorCard />
    </div>
  );
}