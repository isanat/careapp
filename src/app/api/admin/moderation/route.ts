import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";
import {
  getModerationQueue,
  resolveModerationItem,
  createModerationItem,
} from "@/lib/services/admin-tables";
import { generateId } from "@/lib/utils/id";

// GET - Moderation queue
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "PENDING"
      | "REVIEWING"
      | "RESOLVED"
      | "DISMISSED"
      | null;
    const type = searchParams.get("type"); // REVIEW, PROFILE, etc

    // Get moderation queue items
    const queueItems = await getModerationQueue({
      status: status || undefined,
      entityType: type || undefined,
      limit: 50,
    });

    // Get pending reviews that need moderation
    let reviews: Record<string, unknown>[] = [];
    if (!type || type === "REVIEW") {
      const reviewsResult = await db.execute({
        sql: `SELECT 
          r.id, r.rating, r.comment, r.createdAt,
          c.title as contractTitle,
          uFrom.name as fromName,
          uTo.name as toName, uTo.role as toRole
        FROM Review r
        LEFT JOIN Contract c ON r.contractId = c.id
        LEFT JOIN User uFrom ON r.fromUserId = uFrom.id
        LEFT JOIN User uTo ON r.toUserId = uTo.id
        WHERE r.isModerated = ?
        ORDER BY r.createdAt DESC
        LIMIT 20`,
        args: [status === "PENDING" || !status ? 0 : 1],
      });
      reviews = reviewsResult.rows as Record<string, unknown>[];
    }

    // Get low ratings (potential issues)
    const lowRatingsResult = await db.execute({
      sql: `SELECT 
        u.id, u.name, u.email,
        pc.totalReviews, pc.averageRating,
        (SELECT COUNT(*) FROM Review WHERE toUserId = u.id AND rating <= 2) as lowRatings
      FROM User u
      JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE pc.averageRating < 3.0 AND pc.totalReviews >= 3
      ORDER BY pc.averageRating ASC
      LIMIT 10`,
      args: [],
    });

    return NextResponse.json({
      queueItems,
      reviews,
      lowRatedCaregivers: lowRatingsResult.rows,
      stats: {
        pendingItems: queueItems.filter((i) => i.status === "PENDING").length,
        pendingReviews: reviews.length,
        lowRatedCount: lowRatingsResult.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Moderate content
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const body = await request.json();
    const { type, entityId, action, reason, notes } = body;
    // type: 'REVIEW', 'PROFILE', 'MESSAGE'
    // action: 'APPROVE', 'REJECT', 'HIDE', 'WARN', 'BAN', 'DISMISS'

    const now = new Date().toISOString();

    // Apply moderation action based on type
    if (type === "REVIEW") {
      const isPublic = action === "APPROVE";
      await db.execute({
        sql: `UPDATE Review SET isModerated = 1, isPublic = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [isPublic ? 1 : 0, entityId],
      });
    }

    // Log to moderation queue
    const moderationId = generateId("mod");
    await db.execute({
      sql: `INSERT INTO ModerationQueue (id, entityType, entityId, reason, status, reviewedBy, reviewedAt, action, notes, createdAt)
        VALUES (?, ?, ?, ?, 'RESOLVED', ?, ?, ?, ?, ?)`,
      args: [
        moderationId,
        type,
        entityId,
        reason || "",
        adminUserId,
        now,
        action,
        notes || "",
        now,
      ],
    });

    // Log admin action
    const actionId = generateId("action");
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        actionId,
        adminUserId,
        `MODERATE_${action}`,
        type,
        entityId,
        reason || "",
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      type,
      entityId,
      action,
      moderationId,
    });
  } catch (error) {
    console.error("Error moderating content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
