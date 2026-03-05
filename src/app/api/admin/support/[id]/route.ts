import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

// GET - Get single ticket details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const ticketId = id;

    // Get ticket details
    const ticketResult = await db.execute({
      sql: `
        SELECT 
          st.*,
          u.name as userName, u.email as userEmail, u.role as userRole
        FROM SupportTicket st
        LEFT JOIN User u ON st.userId = u.id
        WHERE st.id = ?
      `,
      args: [ticketId],
    });

    if (ticketResult.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get messages
    const messagesResult = await db.execute({
      sql: `
        SELECT * FROM SupportTicketMessage
        WHERE ticketId = ?
        ORDER BY createdAt ASC
      `,
      args: [ticketId],
    });

    const ticket = ticketResult.rows[0];
    const messages = messagesResult.rows.map((msg) => ({
      id: msg.id,
      ticketId: msg.ticketId,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      message: msg.message,
      attachments: msg.attachments ? JSON.parse(msg.attachments as string) : [],
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        userId: ticket.userId,
        userName: ticket.userName || "Unknown",
        userEmail: ticket.userEmail || "",
        userRole: ticket.userRole,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
        resolvedAt: ticket.resolvedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status/priority/assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const { id } = await params;
    const ticketId = id;
    const body = await request.json();
    const { status, priority, assignedTo } = body;

    const now = new Date().toISOString();

    // Build dynamic update
    const updates: string[] = ["updatedAt = ?"];
    const args: any[] = [now];

    if (status) {
      updates.push("status = ?");
      args.push(status);

      if (status === "resolved" || status === "RESOLVED") {
        updates.push("resolvedAt = ?");
        args.push(now);
      }
    }

    if (priority) {
      updates.push("priority = ?");
      args.push(priority);
    }

    if (assignedTo !== undefined) {
      updates.push("assignedTo = ?");
      args.push(assignedTo);
    }

    args.push(ticketId);

    await db.execute({
      sql: `UPDATE SupportTicket SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
