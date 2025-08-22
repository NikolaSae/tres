// Path: app/(protected)/complaints/[id]/page.tsx

// This is a Server Component, used for fetching data and passing it to Client Components

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation"; // Import notFound
import { auth } from "@/auth"; // Assuming auth is used for session on server
import { getComplaintById } from "@/actions/complaints/get-by-id"; // Import the action to fetch complaint details
import { getAssignableUsers } from "@/actions/users/get-assignable-users"; // Import the action to fetch assignable users
import ComplaintDetailPageClient from "./ComplaintDetailPageClient"; // Import the Client Component


// Define metadata for the page
export const metadata: Metadata = {
  title: "Complaint Details",
  description: "View and manage complaint details",
};

// Fetch data on the server
export default async function ComplaintDetailPageServer({ params }: { params: { id: string } }) {
    // KORIGOVANO: Await params pre pristupa njegovim svojstvima
    const awaitedParams = await params;
    const { id } = awaitedParams;

    // Fetch complaint details
    // Assuming getComplaintById action exists and fetches all necessary relations (comments, history, etc.)
    const complaintResult = await getComplaintById(id);

    // Fetch assignable users
    const assignableUsersResult = await getAssignableUsers();

    // Handle case where complaint is not found or unauthorized
    if (!complaintResult || complaintResult.error || !complaintResult.complaint) {
        // If error is "Unauthorized", you might redirect to login or access denied page
        // For not found, use next/navigation's notFound
        if (complaintResult?.error === "Complaint not found") {
             notFound(); // Show 404 page
        }
        // Handle other potential errors, maybe pass error message to client
        console.error("Failed to fetch complaint or unauthorized:", complaintResult?.error);
        // You could pass a specific error prop to the client component
        // return <ComplaintDetailPageClient error={complaintResult?.error} />;
         notFound(); // Default to 404 for any fetch error for simplicity
    }

    // Handle case where fetching assignable users failed (optional, depending on how critical this data is)
    if (assignableUsersResult?.error) {
        console.error("Failed to fetch assignable users:", assignableUsersResult.error);
        // You might want to show a warning or disable the assign feature on the client
        // For now, we'll proceed with an empty array for assignableUsers
    }


    // Extract complaint data and assignable users data
    const complaint = complaintResult.complaint;
    const assignableUsers = assignableUsersResult?.users || []; // Provide default empty array if fetch failed


    // Pass fetched data to the Client Component
    return (
        // Use Suspense while the Client Component might be loading its own data (e.g., session)
        <Suspense fallback={<div>Loading Complaint Details...</div>}>
             <ComplaintDetailPageClient
                 initialComplaint={complaint}
                 assignableUsers={assignableUsers}
             />
        </Suspense>
    );
}
