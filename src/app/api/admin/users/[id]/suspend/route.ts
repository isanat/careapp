import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { randomUUID } from "crypto";

// POST - Suspend user with reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Reason is required and must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Get current user state
    const userResult = await db.execute({
      sql: `SELECT 
        u.id, u.name, u.email, u.role, u.status,
        w.balance as walletBalance
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      WHERE u.id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userBefore = userResult.rows[0];

    // Check if user is already suspended
    if (userBefore.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "User is already suspended" },
        { status: 400 }
      );
    }

    // Prevent suspending admin users
    if (userBefore.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot suspend admin users" },
        { status: 403 }
      );
    }

    // Get admin profile
    const adminProfileResult = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ?`,
      args: [session.user.id],
    });

    const adminUserId = adminProfileResult.rows[0]?.id as string | null;

    // Get IP and user agent
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Update user status to SUSPENDED
    await db.execute({
      sql: `UPDATE User SET status = 'SUSPENDED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [userId],
    });

    // Get updated user state
    const updatedUserResult = await db.execute({
      sql: `SELECT id, name, email, role, status FROM User WHERE id = ?`,
      args: [userId],
    });

    const userAfter = updatedUserResult.rows[0];

    // Log action to AdminAction table
    if (adminUserId) {
      await db.execute({
        sql: `INSERT INTO AdminAction (
          id, adminUserId, action, entityType, entityId, 
          oldValue, newValue, ipAddress, userAgent, reason, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          randomUUID(),
          adminUserId,
          "SUSPEND",
          "USER",
          userId,
          JSON.stringify({
            status: userBefore.status,
            name: userBefore.name,
            email: userBefore.email,
          }),
          JSON.stringify({
            status: userAfter?.status,
            name: userAfter?.name,
            email: userAfter?.email,
          }),
          ipAddress,
          userAgent,
          reason,
        ],
      });

      // Update lastAdminActionAt
      await db.execute({
        sql: `UPDATE AdminUser SET lastAdminActionAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [adminUserId],
      });
    }

    return NextResponse.json({
      success: true,
      message: "User suspended successfully",
      user: {
        id: userAfter?.id,
        name: userAfter?.name,
        email: userAfter?.email,
        role: userAfter?.role,
        status: userAfter?.status,
      },
      action: {
        type: "SUSPEND",
        reason,
        performedBy: session.user.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("User suspend error:", error);
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  }
}
