  // /app/api/complaints/[id]/route.ts:

  import { NextRequest, NextResponse } from "next/server";
  import { z } from "zod";
  import { db } from "@/lib/db";
  import { complaintUpdateSchema } from "@/schemas/complaint";
  import { auth } from "@/auth";

  // GET - Get a specific complaint by ID
  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await auth();
      
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const { id } = await params;
      
      const complaint = await db.complaint.findUnique({
        where: { id },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          provider: {
            select: {
              id: true,
              name: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: "desc"
            }
          },
          attachments: true,
          statusHistory: {
            orderBy: {
              changedAt: "desc"
            }
          }
        }
      });
      
      if (!complaint) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
      }
      
      // Check permissions for non-admin/manager users
      if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        const isOwner = complaint.submittedById === session.user.id;
        const isAssigned = complaint.assignedAgentId === session.user.id;
        
        if (!isOwner && !isAssigned && session.user.role !== "AGENT") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
      
      return NextResponse.json(complaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      return NextResponse.json(
        { error: "Failed to fetch complaint details" },
        { status: 500 }
      );
    }
  }

  // PUT - Update a complaint
  export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await auth();
      
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const { id } = params;
      const json = await request.json();
      
      // Validate the request body
      const validatedData = complaintUpdateSchema.parse({ ...json, id });
      
      // Check if complaint exists
      const existingComplaint = await db.complaint.findUnique({
        where: { id },
        select: {
          id: true,
          submittedById: true,
          assignedAgentId: true,
          status: true
        }
      });
      
      if (!existingComplaint) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
      }
      
      // Check permissions
      const isAdmin = session.user.role === "ADMIN";
      const isManager = session.user.role === "MANAGER";
      const isOwner = existingComplaint.submittedById === session.user.id;
      const isAssigned = existingComplaint.assignedAgentId === session.user.id;
      
      if (!isAdmin && !isManager && !isOwner && !isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      // If status is being updated, record in history
      let updateData: any = { ...validatedData };
      delete updateData.id;
      
      if (validatedData.status && validatedData.status !== existingComplaint.status) {
        // Add to status history
        await db.complaintStatusHistory.create({
          data: {
            complaintId: id,
            previousStatus: existingComplaint.status,
            newStatus: validatedData.status,
            changedById: session.user.id,
            notes: validatedData.notes || undefined
          }
        });
        
        // Set resolved/closed date if applicable
        if (validatedData.status === "RESOLVED") {
          updateData.resolvedAt = new Date();
        } else if (validatedData.status === "CLOSED") {
          updateData.closedAt = new Date();
        }
      }
      
      // Update the complaint
      const updatedComplaint = await db.complaint.update({
        where: { id },
        data: updateData,
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          },
          provider: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      // Record activity log
      await db.activityLog.create({
        data: {
          action: "UPDATE_COMPLAINT",
          entityType: "complaint",
          entityId: id,
          details: `Updated complaint: ${updatedComplaint.title}`,
          severity: "INFO",
          userId: session.user.id
        }
      });
      
      return NextResponse.json(updatedComplaint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      
      console.error("Error updating complaint:", error);
      return NextResponse.json(
        { error: "Failed to update complaint" },
        { status: 500 }
      );
    }
  }

  // DELETE - Delete a complaint
  export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await auth();
      
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const { id } = params;
      
      // Check if user has permission to delete
      if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      // Check if complaint exists
      const complaint = await db.complaint.findUnique({
        where: { id },
        select: { id: true, title: true }
      });
      
      if (!complaint) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
      }
      
      // Delete the complaint (related records will be deleted via cascading)
      await db.complaint.delete({
        where: { id }
      });
      
      // Record activity log
      await db.activityLog.create({
        data: {
          action: "DELETE_COMPLAINT",
          entityType: "complaint",
          entityId: id,
          details: `Deleted complaint: ${complaint.title}`,
          severity: "WARNING",
          userId: session.user.id
        }
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting complaint:", error);
      return NextResponse.json(
        { error: "Failed to delete complaint" },
        { status: 500 }
      );
    }
  }