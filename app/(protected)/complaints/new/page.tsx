// Path: app/(protected)/complaints/new/page.tsx

import { Metadata } from "next";
import { getProviders } from "@/actions/complaints/providers";
import { ComplaintFormWrapper } from "@/components/complaints/ComplaintFormWrapper";
// Import the functions to get humanitarian orgs and parking services data
import { getHumanitarianOrgs } from "@/actions/complaints/humanitarian";
import { getParkingServices } from "@/actions/complaints/parking";

export const metadata: Metadata = {
  title: "Submit New Complaint",
  description: "Form to submit a new complaint",
};

export default async function NewComplaintPage() {
  // Fetch all required data in parallel for better performance
  const [providersData, humanitarianOrgsData, parkingServicesData] = await Promise.all([
    getProviders(),
    getHumanitarianOrgs(),
    getParkingServices()
  ]);

  // Log loaded data for debugging
  console.log(`Loaded providers: ${providersData.length}`);
  console.log(`Loaded humanitarian orgs: ${humanitarianOrgsData.length}`);
  console.log(`Loaded parking services: ${parkingServicesData.length}`);

  return (
    <ComplaintFormWrapper 
      providersData={providersData}
      humanitarianOrgsData={humanitarianOrgsData}
      parkingServicesData={parkingServicesData}
    />
  );
}