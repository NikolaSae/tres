// Path: app/(protected)/services/new/page.tsx

import { Metadata } from "next";
// UKLONJENO: Import ComplaintFormWrapper
// import { ComplaintFormWrapper } from "@/components/complaints/ComplaintFormWrapper";
// UVEZENO: Import ServiceForm
import { ServiceForm } from "@/components/services/ServiceForm";
// UKLONJENO: Import getProviders jer ServiceForm ne zahteva listu provajdera
// import { getProviders } from "@/actions/complaints/providers";
// UKLONJENO: Import auth jer se ne koristi direktno u ovoj komponenti
// import { auth } from "@/auth";


export const metadata: Metadata = {
  title: "Create New Service",
  description: "Form to create a new service",
};

// Ova Server Komponenta sada samo renderuje ServiceForm
export default async function NewServicePage() {
  // UKLONJENO: Dohvatanje providersData jer ComplaintFormWrapper više nije ovde
  // const providersData = await getProviders();

  return (
    // Renderujemo ServiceForm komponentu
    // ServiceForm ne zahteva props poput initialData ili serviceId za kreiranje novog servisa
    <ServiceForm />
  );
}
