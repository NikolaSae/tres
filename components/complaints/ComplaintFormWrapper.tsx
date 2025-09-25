// Path: components/complaints/ComplaintFormWrapper.tsx
// components/complaints/ComplaintFormWrapper.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { createComplaint } from "@/actions/complaints/create";
import { ComplaintFormData } from "@/schemas/complaint";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { type getProviders } from "@/actions/complaints/providers";
import { signOut } from "next-auth/react";

// Add these types to match the updated props
interface ComplaintFormWrapperProps {
    providersData: Awaited<ReturnType<typeof getProviders>>;
    humanitarianOrgsData: { id: string; name: string }[];
    parkingServicesData: { id: string; name: string }[];
    onCancel?: () => void;
}

export function ComplaintFormWrapper({ 
    providersData,
    humanitarianOrgsData,
    parkingServicesData,
    onCancel 
}: ComplaintFormWrapperProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleFormSubmit = async (data: ComplaintFormData) => {
        startTransition(async () => {
            const result = await createComplaint(data);

            console.log("Result from createComplaint action:", result);

            if (result?.error) {
                toast.error(result.error || "Failed to create complaint");
                
                // Handle session-related errors
                if (result.error.includes("session") || result.error.includes("sign in")) {
                    toast.info("Redirecting to login...");
                    await signOut({ redirect: false });
                    router.push("/auth/login");
                }
            } else if (result?.complaint?.id) {
                toast.success("Complaint created successfully");
                router.push(`/complaints/${result.complaint.id}`);
            } else if (result?.success) {
                toast.success(result.message || "Complaint created successfully");
                router.push("/complaints");
            } else {
                toast.info("Complaint submission finished, but no specific result was returned.");
            }
        });
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="p-0 h-auto"
                    disabled={isPending}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Create New Complaint</h1>
            </div>
            <ComplaintForm
                onSubmit={handleFormSubmit}
                isSubmitting={isPending}
                providersData={providersData}
                humanitarianOrgsData={humanitarianOrgsData}
                parkingServicesData={parkingServicesData}
                onCancel={handleCancel}
            />
        </div>
    );
}