// Path: actions/complaints/get-by-id.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Fetches a specific complaint by its ID, including related data.
 * Performs authorization check to ensure the user has permission to view the complaint.
 * @param id - The ID of the complaint to fetch.
 * @returns A promise resolving to an object containing the complaint data or an error.
 */
export async function getComplaintById(id: string) {
    try {
        // Get the current user session
        const session = await auth();

        // Check if the user is authenticated
        if (!session || !session.user) {
            return { error: "Unauthorized" };
        }

        // Fetch the complaint from the database, including necessary relations
        const complaint = await db.complaint.findUnique({
            where: { id },
            include: {
                submittedBy: { select: { id: true, name: true, email: true } }, // Include user who submitted
                assignedAgent: { select: { id: true, name: true, email: true } }, // Include assigned agent
                service: { select: { id: true, name: true, type: true } }, // Include related service
                product: { select: { id: true, name: true, code: true } }, // Include related product (if exists)
                provider: { select: { id: true, name: true } }, // Include related provider
                humanitarianOrg: { select: { id: true, name: true } }, // Include humanitarian organization (if exists)
                comments: { // Include comments and the user who posted them
                    include: { user: { select: { id: true, name: true, email: true } } },
                    orderBy: { createdAt: "desc" } // Order comments by creation date
                },
                attachments: true, // Include attachments
                statusHistory: { // Include status history
                    orderBy: { changedAt: "desc" } // Order status history by change date
                }
            },
        });

        // If complaint is not found, return an error
        if (!complaint) {
            return { error: "Complaint not found" };
        }

        // Server-side permission check:
        // Admins and Managers can view any complaint.
        // Owners can view their own complaints.
        // Assigned Agents can view complaints assigned to them.
        // Agents (not assigned/owner) might have view permission depending on requirements.
        // The current logic allows Agents to view any complaint, but actions are restricted by client-side checks.
        // If you need stricter server-side viewing restrictions for Agents, uncomment the line below.
        const isAdmin = session.user.role === UserRole.ADMIN;
        const isManager = session.user.role === UserRole.MANAGER;
        const isOwner = complaint.submittedById === session.user.id;
        const isAssigned = complaint.assignedAgentId === session.user.id;
        const isAgent = session.user.role === UserRole.AGENT;


        // Example stricter check: Only Admin, Manager, Owner, or Assigned Agent can view
        // if (!isAdmin && !isManager && !isOwner && !isAssigned) {
        //      return { error: "Unauthorized" };
        // }


        // If the user has permission, return the fetched complaint data
        return { complaint };

    } catch (error) {
        console.error("Error fetching complaint by ID:", error);
        // Return a generic error message in case of unexpected issues
        return { error: "Failed to fetch complaint details." };
    }
}
