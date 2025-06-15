// Path: /app/(protected)/services/import/page.tsx
import { Metadata } from "next";
import { ImportForm } from "@/components/services/ImportForm";
import { ParkingServiceProcessorForm } from "@/components/services/ParkingServiceProcessorForm"; // Nova komponenta
import { ProviderProcessorForm } from "@/components/services/ProviderProcessorForm";

export const metadata: Metadata = {
  title: "Import VAS Data | Management Dashboard",
  description: "Import VAS service usage data from a CSV file.",
};

export default function ImportServicesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Postojeći kontejner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import VAS Service Data</h1>
          <p className="text-gray-500">
            Upload a CSV file to import VAS service usage data.
          </p>
        </div>
      </div>
      <ImportForm />

      {/* Novi kontejner za parking_service_processor */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import Parking Service Data</h2>
          <p className="text-gray-500">
            Upload Excel files for parking services. Files will be processed and imported into the database.
          </p>
        </div>
      </div>

      <ProviderProcessorForm />
      {/* Novi kontejner za parking_service_processor */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import VAS Service Data</h2>
          <p className="text-gray-500">
            Upload Excel files for vas services. Files will be processed and imported into the database.
          </p>
        </div>
      </div>
      <ProviderProcessorForm />

    </div>

  );
}
