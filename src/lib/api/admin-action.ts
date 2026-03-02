import { NextRequest } from "next/server";
import { db } from "@/lib/db-turso";
import { randomUUID } from "crypto";

interface LogAdminActionParams {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  request?: NextRequest;
}

/**
 * Logs an admin action to the AdminAction table and updates lastAdminActionAt.
 */
export async function logAdminAction({
  adminUserId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  reason = null,
  request,
}: LogAdminActionParams): Promise<void> {
  const ipAddress = request?.headers.get("x-forwarded-for") ||
    request?.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request?.headers.get("user-agent") || "unknown";

  // Look up the AdminUser profile ID
  const adminProfileResult = await db.execute({
    sql: `SELECT id FROM AdminUser WHERE userId = ?`,
    args: [adminUserId],
  });
  const adminProfileId = adminProfileResult.rows[0]?.id as string | null;

  if (adminProfileId) {
    await db.execute({
      sql: `INSERT INTO AdminAction (
        id, adminUserId, action, entityType, entityId,
        oldValue, newValue, ipAddress, userAgent, reason, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        randomUUID(),
        adminProfileId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        reason,
      ],
    });

    await db.execute({
      sql: `UPDATE AdminUser SET lastAdminActionAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [adminProfileId],
    });
  }
}
