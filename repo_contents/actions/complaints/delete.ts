// /actions/complaints/delete.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteComplaint(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        error: "Unauthorized. Please sign in to delete a complaint.",
      };
    }

    // Find the complaint
    const complaint = await db.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return {
        error: "Complaint not found",
      };
    }

    // Check if user has permission to delete
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const isSubmitter = complaint.submittedById === session.user.id;
    const canDelete = ["ADMIN", "MANAGER"].includes(user?.role || "") || 
                      (isSubmitter && complaint.status === "NEW"); // Submitters can only delete NEW complaints

    if (!canDelete) {
      return {
        error: "You don't have permission to delete this complaint",
      };
    }

    // Log the deletion intent before actually deleting
    await db.activityLog.create({
      data: {
        action: "COMPLAINT_DELETED",
        entityType: "complaint",
        entityId: id,
        details: `Complaint deleted: ${complaint.title}`,
        userId: session.user.id,
        severity: "WARNING",
      },
    });

    // Delete the complaint and all related records (cascade deletion handled by Prisma)
    await db.complaint.delete({
      where: { id },
    });

    // Create notification for admins about the deletion
    if (!["ADMIN", "MANAGER"].includes(user?.role || "")) {
      const admins = await db.user.findMany({
        where: {
          role: {
            in: ["ADMIN", "MANAGER"],
          },
        },
      });

      const notificationPromises = admins.map(admin => 
        db.notification.create({
          data: {
            title: "Complaint Deleted",
            message: `A complaint "${complaint.title}" was deleted by ${user?.name || "a user"}.`,
            type: "SYSTEM",
            userId: admin.id,
            entityType: "complaint",
          },
        })
      );

      await Promise.all(notificationPromises);
    }

    revalidatePath("/complaints");
    redirect("/complaints");
  } catch (error) {
    console.error("[COMPLAINT_DELETE_ERROR]", error);
    
    return {
      error: "Failed to delete complaint. Please try again.",
    };
  }
}