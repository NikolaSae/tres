// /app/api/complaints/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
  isInternal: z.boolean().default(false),
});

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

    // Determine if user can see internal comments
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const isStaff = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "AGENT";

    // Get comments for the complaint
    const comments = await db.comment.findMany({
      where: {
        complaintId,
        ...(isStaff ? {} : { isInternal: false }), // Filter out internal comments for regular users
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
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
    const body = await req.json();
    
    const validatedData = commentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(validatedData.error.format(), { status: 400 });
    }

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return new NextResponse("Complaint not found", { status: 404 });
    }

    // Check user permissions for internal comments
    if (validatedData.data.isInternal) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (user?.role !== "ADMIN" && user?.role !== "MANAGER" && user?.role !== "AGENT") {
        return new NextResponse("Not authorized to create internal comments", { status: 403 });
      }
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        text: validatedData.data.text,
        isInternal: validatedData.data.isInternal,
        complaintId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "COMMENT_ADDED",
        entityType: "complaint",
        entityId: complaintId,
        details: `Comment added to complaint #${complaint.id}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
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
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return new NextResponse("Comment ID required", { status: 400 });
    }

    // Check if comment exists and belongs to the user or user is admin
    const comment = await db.comment.findUnique({
      where: { 
        id: commentId,
        complaintId,
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user has permission to delete this comment
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const canDelete = 
      comment.userId === session.user.id || 
      user?.role === "ADMIN" || 
      user?.role === "MANAGER";

    if (!canDelete) {
      return new NextResponse("Not authorized to delete this comment", { status: 403 });
    }

    // Delete the comment
    await db.comment.delete({
      where: { id: commentId },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        action: "COMMENT_DELETED",
        entityType: "complaint",
        entityId: complaintId,
        details: `Comment deleted from complaint #${complaintId}`,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMMENTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}