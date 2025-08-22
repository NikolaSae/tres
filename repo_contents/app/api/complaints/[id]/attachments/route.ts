// /app/api/complaints/[id]/attachments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadFile, deleteFile } from "@/lib/storage"; // You'll need to implement this

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const complaintId = params.id;

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check if user has access to this complaint
    const canAccess = 
      session.user.id === complaint.submittedById ||
      session.user.id === complaint.assignedAgentId ||
      ["ADMIN", "MANAGER", "AGENT"].includes((await db.user.findUnique({ 
        where: { id: session.user.id }
      }))?.role || "");

    if (!canAccess) {
      return new NextResponse("Not authorized to view these attachments", { status: 403 });
    }

    // Get attachments for the complaint
    const attachments = await db.attachment.findMany({
      where: { complaintId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("[ATTACHMENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const complaintId = params.id;

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check if user can upload to this complaint
    const canUpload = 
      session.user.id === complaint.submittedById ||
      session.user.id === complaint.assignedAgentId ||
      ["ADMIN", "MANAGER", "AGENT"].includes((await db.user.findUnique({ 
        where: { id: session.user.id }
      }))?.role || "");

    if (!canUpload) {
      return new NextResponse("Not authorized to upload attachments", { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("File is required", { status: 400 });
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File size exceeds the 5MB limit", { status: 400 });
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "application/pdf", 
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse("File type not allowed", { status: 400 });
    }

    // Upload the file to storage
    const uploadResult = await uploadFile(file, `complaints/${complaintId}`);

    // Create attachment record in database
    const attachment = await db.attachment.create({
      data: {
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileType: file.type,
        complaintId,
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "ATTACHMENT_ADDED",
        entityType: "complaint",
        entityId: complaintId,
        details: `File '${file.name}' added to complaint #${complaintId}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("[ATTACHMENT_UPLOAD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const complaintId = params.id;
    const searchParams = new URL(req.url).searchParams;
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return new NextResponse("Attachment ID required", { status: 400 });
    }

    // Check if attachment exists
    const attachment = await db.attachment.findUnique({
      where: { 
        id: attachmentId,
        complaintId,
      },
      include: {
        complaint: true,
      },
    });

    if (!attachment) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    // Check if user has permission to delete
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const canDelete = 
      user?.role === "ADMIN" || 
      user?.role === "MANAGER" ||
      (user?.role === "AGENT" && attachment.complaint.assignedAgentId === session.user.id) ||
      (attachment.complaint.submittedById === session.user.id);

    if (!canDelete) {
      return new NextResponse("Not authorized to delete this attachment", { status: 403 });
    }

    // Delete the file from storage
    await deleteFile(attachment.fileUrl);

    // Delete the attachment record
    await db.attachment.delete({
      where: { id: attachmentId },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "ATTACHMENT_DELETED",
        entityType: "complaint",
        entityId: complaintId,
        details: `File '${attachment.fileName}' deleted from complaint #${complaintId}`,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ATTACHMENT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}