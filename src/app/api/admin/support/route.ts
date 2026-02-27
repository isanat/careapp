import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// GET - List support tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Check if table exists first
    let tableExists = false;
    try {
      const tableCheck = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='SupportTicket'",
        args: [],
      });
      tableExists = tableCheck.rows.length > 0;
    } catch (e) {
      console.error("Table check error:", e);
    }

    if (!tableExists) {
      // Return empty response with mock stats
      return NextResponse.json({
        tickets: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        stats: {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          urgent: 0,
        },
      });
    }

    // Build query
    let whereClause = "1=1";
    const args: any[] = [];

    if (status && status !== "all") {
      whereClause += " AND st.status = ?";
      args.push(status);
    }

    if (priority && priority !== "all") {
      whereClause += " AND st.priority = ?";
      args.push(priority);
    }

    // Get tickets with user info
    const ticketsResult = await db.execute({
      sql: `
        SELECT 
          st.id, st.userId, st.subject, st.description, st.category,
          st.status, st.priority, st.assignedToId, st.resolution,
          st.createdAt, st.updatedAt, st.resolvedAt,
          u.name as userName, u.email as userEmail
        FROM SupportTicket st
        LEFT JOIN User u ON st.userId = u.id
        WHERE ${whereClause}
        ORDER BY 
          CASE st.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            ELSE 4
          END,
          st.createdAt DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    // Get total count
    const countResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count FROM SupportTicket st WHERE ${whereClause}
      `,
      args: args,
    });

    const total = Number(countResult.rows[0]?.count || 0);

    // Get stats
    const statsResult = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
        FROM SupportTicket
      `,
      args: [],
    });

    const stats = statsResult.rows[0] || {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      urgent: 0,
    };

    const tickets = ticketsResult.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName || "Unknown",
      userEmail: row.userEmail || "",
      subject: row.subject,
      description: row.description,
      category: row.category,
      status: row.status,
      priority: row.priority,
      assignedToId: row.assignedToId,
      resolution: row.resolution,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      resolvedAt: row.resolvedAt,
    }));

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: Number(stats.total || 0),
        open: Number(stats.open || 0),
        inProgress: Number(stats.in_progress || 0),
        resolved: Number(stats.resolved || 0),
        urgent: Number(stats.urgent || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, subject, description, category, priority } = body;

    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = `ticket-${Date.now()}`;

    await db.execute({
      sql: `
        INSERT INTO SupportTicket (id, userId, subject, description, category, priority, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)
      `,
      args: [
        id,
        userId,
        subject,
        description,
        category || "general",
        priority || "normal",
        now,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id,
        userId,
        subject,
        description,
        category: category || "general",
        priority: priority || "normal",
        status: "open",
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
