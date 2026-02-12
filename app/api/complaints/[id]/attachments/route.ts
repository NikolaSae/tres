// /app/api/complaints/[id]/attachments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: complaintId } = await params;

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check if user has access to this complaint
    const user = await db.user.findUnique({ 
      where: { id: session.user.id }
    });

    const canAccess = 
      session.user.id === complaint.submittedById ||
      session.user.id === complaint.assignedAgentId ||
      ["ADMIN", "MANAGER", "AGENT"].includes(user?.role || "");

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
  { params }: { params: Promise }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: complaintId } = await params;

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check if user can upload to this complaint
    const user = await db.user.findUnique({ 
      where: { id: session.user.id }
    });

    const canUpload = 
      session.user.id === complaint.submittedById ||
      session.user.id === complaint.assignedAgentId ||
      ["ADMIN", "MANAGER", "AGENT"].includes(user?.role || "");

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
      "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
      return new NextResponse("File type not allowed", { status: 400 });
    }

    // ✅ ISPRAVKA: Uklonjen drugi parametar - writeFile prima samo 2 parametra
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "complaints");
    
    // Save file
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Create attachment record
    const attachment = await db.attachment.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/complaints/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        complaintId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        action: "ATTACHMENT_UPLOADED",
        entityType: "complaint",
        entityId: complaintId,
        details: `File uploaded: ${file.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("[ATTACHMENTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: complaintId } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return new NextResponse("Attachment ID is required", { status: 400 });
    }

    // Check if attachment exists and belongs to this complaint
    const attachment = await db.attachment.findFirst({
      where: {
        id: attachmentId,
        complaintId,
      },
    });

    if (!attachment) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    // Check permissions
    const user = await db.user.findUnique({ 
      where: { id: session.user.id }
    });

    const canDelete = 
      session.user.id === attachment.uploadedById ||
      ["ADMIN", "MANAGER"].includes(user?.role || "");

    if (!canDelete) {
      return new NextResponse("Not authorized to delete this attachment", { status: 403 });
    }

    // Delete attachment record
    await db.attachment.delete({
      where: { id: attachmentId },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        action: "ATTACHMENT_DELETED",
        entityType: "complaint",
        entityId: complaintId,
        details: `File deleted: ${attachment.fileName}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ATTACHMENTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}