// Path: components/complaints/AssignComplaint.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { assignComplaint } from "@/actions/complaints/assign";

// Define a type for the assignable users data - export it so it can be used in parent components
export interface AssignableUser {
    id: string;
    name: string | null;
}

interface AssignComplaintProps {
    complaintId: string;
    currentAssignedAgentId: string | null;
    assignableUsers?: AssignableUser[]; // Make it optional to handle undefined
    canAssign: boolean;
    onAssignmentComplete: () => void;
}

// Define a unique placeholder value for the "Unassign" option in the Select dropdown
const UNASSIGN_VALUE = "unassign-option";

export function AssignComplaint({
    complaintId,
    currentAssignedAgentId,
    assignableUsers = [], // Default to empty array if undefined
    canAssign,
    onAssignmentComplete,
}: AssignComplaintProps) {
    const [selectedUserId, setSelectedUserId] = useState<string>(currentAssignedAgentId || UNASSIGN_VALUE);
    const [isPending, startTransition] = useTransition();

    // Update selectedUserId state if the currentAssignedAgentId prop changes
    useEffect(() => {
        setSelectedUserId(currentAssignedAgentId || UNASSIGN_VALUE);
    }, [currentAssignedAgentId]);

    // Handler for the Select component value change
    const handleUserSelect = (value: string) => {
        setSelectedUserId(value);
    };

    // Handler for the Assign button click
    const handleAssign = async () => {
        const userIdToAssign = selectedUserId === UNASSIGN_VALUE ? null : selectedUserId;

        if (userIdToAssign === null && currentAssignedAgentId === null) {
             toast.info("No user selected for assignment.");
             return;
        }

        startTransition(async () => {
            const result = await assignComplaint({
                complaintId,
                userId: userIdToAssign,
            });

            if (result?.error) {
                toast.error(result.error || "Failed to assign complaint.");
                setSelectedUserId(currentAssignedAgentId || UNASSIGN_VALUE);
            } else {
                toast.success(`Complaint ${userIdToAssign ? 'assigned' : 'unassigned'} successfully.`);
                onAssignmentComplete();
            }
        });
    };

    // Render nothing if the user doesn't have permission to assign
    if (!canAssign) {
        return null;
    }

    // Determine if the Assign button should be disabled
    const isAssignButtonDisabled = isPending || selectedUserId === (currentAssignedAgentId || UNASSIGN_VALUE);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Assign Complaint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Assign To
                    </label>
                    <Select value={selectedUserId} onValueChange={handleUserSelect} disabled={isPending}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select user to assign" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={UNASSIGN_VALUE}>Unassign</SelectItem>
                            {assignableUsers.map(user => (
                                user.id && (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || `User ${user.id}`}
                                    </SelectItem>
                                )
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleAssign}
                    disabled={isAssignButtonDisabled}
                    className="w-full"
                >
                    {isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                        selectedUserId === UNASSIGN_VALUE ? "Unassign Complaint" : "Assign Complaint"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}