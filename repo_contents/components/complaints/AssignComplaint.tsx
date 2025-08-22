// Path: components/complaints/AssignComplaint.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Complaint } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { assignComplaint } from "@/actions/complaints/assign"; // Import the assignment action
import { User } from "next-auth"; // Assuming User type from next-auth

// Define a type for the assignable users data
interface AssignableUser {
    id: string;
    name: string | null;
}

interface AssignComplaintProps {
    complaintId: string;
    currentAssignedAgentId: string | null;
    assignableUsers: AssignableUser[]; // List of users who can be assigned
    canAssign: boolean; // Permission flag from parent
    onAssignmentComplete: () => void; // Callback to refresh parent data
}

// Define a unique placeholder value for the "Unassign" option in the Select dropdown
const UNASSIGN_VALUE = "unassign-option";

export function AssignComplaint({
    complaintId,
    currentAssignedAgentId,
    assignableUsers,
    canAssign,
    onAssignmentComplete,
}: AssignComplaintProps) {
    // State to hold the currently selected user ID for assignment
    // Use the unique placeholder value if currentAssignedAgentId is null
    const [selectedUserId, setSelectedUserId] = useState<string>(currentAssignedAgentId || UNASSIGN_VALUE);
    // useTransition hook for managing loading state during assignment
    const [isPending, startTransition] = useTransition();

    // Update selectedUserId state if the currentAssignedAgentId prop changes
    useEffect(() => {
        // Set state to the assigned ID or the placeholder value if null
        setSelectedUserId(currentAssignedAgentId || UNASSIGN_VALUE);
    }, [currentAssignedAgentId]);


    // Handler for the Select component value change
    const handleUserSelect = (value: string) => {
        // Update state with the selected value (either a user ID or the placeholder)
        setSelectedUserId(value);
    };

    // Handler for the Assign button click
    const handleAssign = async () => {
        // Determine the user ID to send to the server action
        // If the selected value is the placeholder, send null to unassign
        const userIdToAssign = selectedUserId === UNASSIGN_VALUE ? null : selectedUserId;

        // Prevent assignment if no user is selected (and it's not an unassign action from a previously assigned state)
        // This check might be redundant if the button is disabled correctly, but good for safety
        if (userIdToAssign === null && currentAssignedAgentId === null) {
             toast.info("No user selected for assignment.");
             return;
        }

        // Start the assignment process within a transition
        startTransition(async () => {
            const result = await assignComplaint({
                complaintId,
                userId: userIdToAssign, // Send null or the selected user ID
            });

            if (result?.error) {
                toast.error(result.error || "Failed to assign complaint.");
                // Revert selection if assignment failed
                setSelectedUserId(currentAssignedAgentId || UNASSIGN_VALUE);
            } else {
                toast.success(`Complaint ${userIdToAssign ? 'assigned' : 'unassigned'} successfully.`);
                // Call the parent's refresh function to update the detail page data
                onAssignmentComplete();
                // The useEffect above will catch the updated assignedAgentId from the refresh
            }
        });
    };

    // Render nothing if the user doesn't have permission to assign
    if (!canAssign) {
        return null;
    }

    // Determine if the Assign button should be disabled
    // Disable if submitting, or if the current selection is the same as the initially assigned agent
    const isAssignButtonDisabled = isPending || selectedUserId === (currentAssignedAgentId || UNASSIGN_VALUE);


    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Assign Complaint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Select dropdown for choosing a user */}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Assign To
                    </label>
                    {/* Use the state value for the Select */}
                    <Select value={selectedUserId} onValueChange={handleUserSelect} disabled={isPending}>
                        <SelectTrigger>
                            {/* Display the selected value or placeholder */}
                            <SelectValue placeholder="Select user to assign" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Option to unassign - use the unique placeholder value */}
                            <SelectItem value={UNASSIGN_VALUE}>Unassign</SelectItem>
                            {/* Map through the list of assignable users */}
                            {assignableUsers.map(user => (
                                // Ensure user ID is not an empty string (should be handled by data fetching)
                                user.id && (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || `User ${user.id}`} {/* Display user name, fallback to ID */}
                                    </SelectItem>
                                )
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Assign button */}
                <Button
                    onClick={handleAssign}
                    disabled={isAssignButtonDisabled} // Use the calculated disabled state
                    className="w-full"
                >
                    {isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                        // Change button text based on selection
                        selectedUserId === UNASSIGN_VALUE ? "Unassign Complaint" : "Assign Complaint"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
