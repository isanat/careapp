import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";
import {
  markNotificationAsRead,
  deleteAdminNotification,
} from "@/lib/services/admin-tables";
import { generateId } from "@/lib/utils/id";

// POST - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const { id } = await params;

    // Get admin profile for logging
    const adminProfile = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ? AND isActive = 1`,
      args: [adminUserId],
    });
    const adminProfileId = (adminProfile.rows[0]?.id as string) || null;

    // Mark as read using service
    await markNotificationAsRead(id, adminUserId);

    // Log action
    const actionId = generateId("action");
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, oldValue, newValue, createdAt)
        VALUES (?, ?, 'MARK_READ', 'ADMIN_NOTIFICATION', ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        actionId,
        adminProfileId || "",
        id,
        JSON.stringify({ isRead: false }),
        JSON.stringify({ isRead: true, readBy: adminUserId }),
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification: {
        id,
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: adminUserId,
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Dismiss/delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    // Get admin profile for logging
    const adminProfile = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ? AND isActive = 1`,
      args: [adminUserId],
    });
    const adminProfileId = (adminProfile.rows[0]?.id as string) || null;

    const { id } = await params;

    // Delete using service
    await deleteAdminNotification(id);

    // Log action
    const actionId = generateId("action");
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, createdAt)
        VALUES (?, ?, 'DELETE_NOTIFICATION', 'ADMIN_NOTIFICATION', ?, CURRENT_TIMESTAMP)`,
      args: [actionId, adminProfileId || "", id],
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
