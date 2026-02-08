// app/(protected)/complaints/[id]/page.tsx

// This is a Server Component, used for fetching data and passing it to Client Components

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getComplaintById } from "@/actions/complaints/get-by-id";
import { getAssignableUsers } from "@/actions/users/get-assignable-users";
import ComplaintDetailPageClient from "./ComplaintDetailPageClient";


// Define metadata for the page
export const metadata: Metadata = {
  title: "Complaint Details",
  description: "View and manage complaint details",
};

interface ComplaintDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Fetch data on the server
export default async function ComplaintDetailPageServer({ params }: ComplaintDetailPageProps) {
    // Await params in Next.js 15+
    const { id } = await params;

    // Fetch complaint details
    const complaintResult = await getComplaintById(id);

    // Fetch assignable users
    const assignableUsersResult = await getAssignableUsers();

    // Handle case where complaint is not found or unauthorized
    if (!complaintResult || complaintResult.error || !complaintResult.complaint) {
        if (complaintResult?.error === "Complaint not found") {
             notFound();
        }
        console.error("Failed to fetch complaint or unauthorized:", complaintResult?.error);
         notFound();
    }

    // Handle case where fetching assignable users failed
    if (assignableUsersResult?.error) {
        console.error("Failed to fetch assignable users:", assignableUsersResult.error);
    }


    // Extract complaint data and assignable users data
    const complaint = complaintResult.complaint;
    const assignableUsers = assignableUsersResult?.users || [];


    // Pass fetched data to the Client Component
    return (
        <Suspense fallback={<div>Loading Complaint Details...</div>}>
             <ComplaintDetailPageClient
                 initialComplaint={complaint}
                 assignableUsers={assignableUsers}
             />
        </Suspense>
    );
}