import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

/**
 * GET /api/notifications
 * Obter notificações do usuário (não lidas primeiro)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    let query = `
      SELECT
        id, type, title, message, referenceType, referenceId,
        isRead, readAt, emailSent, createdAt
      FROM Notification
      WHERE userId = ?
    `;
    const args: (string | number)[] = [session.user.id];

    if (unreadOnly) {
      query += ` AND isRead = false`;
    }

    query += ` ORDER BY createdAt DESC LIMIT ?`;
    args.push(limit);

    const result = await db.execute({
      sql: query,
      args,
    });

    return NextResponse.json({
      notifications: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        isRead: row.isRead,
        readAt: row.readAt,
        emailSent: row.emailSent,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Notifications API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/notifications
 * Marcar notificação como lida
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id: notificationId, isRead } = body;

    if (!notificationId || typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await db.execute({
      sql: `
        UPDATE Notification
        SET isRead = ?, readAt = ?
        WHERE id = ? AND userId = ?
      `,
      args: [
        isRead ? 1 : 0,
        isRead ? now : null,
        notificationId,
        session.user.id,
      ],
    });

    return NextResponse.json({
      message: "Notification updated",
    });
  } catch (error) {
    console.error("[Notifications API] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
