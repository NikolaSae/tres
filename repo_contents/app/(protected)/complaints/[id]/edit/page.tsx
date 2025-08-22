// app/(protected)/complaints/[id]/edit/page.tsx


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import { getComplaintById } from "@/lib/actions/complaints";
import { updateComplaint } from "@/actions/complaints/update";
import { Complaint } from "@/lib/types/interfaces";
import { Loader2 } from "lucide-react";

export default function EditComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const id = params?.id as string;
        if (!id) {
          setError("Complaint ID is missing");
          setLoading(false);
          return;
        }

        const data = await getComplaintById(id);
        if (!data) {
          setError("Complaint not found");
          setLoading(false);
          return;
        }

        setComplaint(data);
      } catch (err) {
        setError("Failed to load complaint");
        console.error("Error loading complaint:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [params]);

  const handleSubmit = async (formData: any) => {
    try {
      if (!complaint?.id) return;
      
      setLoading(true);
      await updateComplaint({
        id: complaint.id,
        ...formData
      });
      
      setNotification({
        type: "success",
        message: "Complaint updated successfully"
      });
      
      setTimeout(() => {
        router.push(`/complaints/${complaint.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating complaint:", err);
      setNotification({
        type: "error",
        message: "Failed to update complaint"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Complaint</h1>
      
      {notification && (
        <NotificationBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {complaint && (
        <ComplaintForm
          initialData={complaint}
          onSubmit={handleSubmit}
          isSubmitting={loading}
        />
      )}
    </div>
  );
}