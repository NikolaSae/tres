// /app/(protected)/providers/new/page.tsx
import { Metadata } from "next";
import { ProviderForm } from "@/components/providers/ProviderForm"; // Uvoz ProviderForm

export const metadata: Metadata = {
  title: "Create New Provider | Management Dashboard",
  description: "Create a new provider in the system",
};

// Server Komponenta za stranicu kreiranja novog provajdera
export default function NewProviderPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Provider</h1>
        <p className="text-gray-500">
          Add a new provider to the system
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ProviderForm />
      </div>

    </div>
  );
}