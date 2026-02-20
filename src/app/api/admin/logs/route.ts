import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// GET - List audit logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const action = searchParams.get("action") || "all";
    const entityType = searchParams.get("entityType") || "all";
    const adminUserId = searchParams.get("adminUserId") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (action !== "all") {
      conditions.push("aa.action = ?");
      args.push(action);
    }

    if (entityType !== "all") {
      conditions.push("aa.entityType = ?");
      args.push(entityType);
    }

    if (adminUserId !== "all") {
      conditions.push("aa.adminUserId = ?");
      args.push(adminUserId);
    }

    if (startDate) {
      conditions.push("DATE(aa.createdAt) >= ?");
      args.push(startDate);
    }

    if (endDate) {
      conditions.push("DATE(aa.createdAt) <= ?");
      args.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM AdminAction aa ${whereClause}`,
      args,
    });
    const total = Number(countResult.rows[0]?.count || 0);

    // Get logs with admin info
    const logsResult = await db.execute({
      sql: `SELECT
        aa.id,
        aa.adminUserId,
        aa.action,
        aa.entityType,
        aa.entityId,
        aa.oldValue,
        aa.newValue,
        aa.ipAddress,
        aa.userAgent,
        aa.reason,
        aa.createdAt,
        u.name as adminName,
        u.email as adminEmail,
        au.role as adminRole
      FROM AdminAction aa
      LEFT JOIN AdminUser au ON aa.adminUserId = au.id
      LEFT JOIN User u ON au.userId = u.id
      ${whereClause}
      ORDER BY aa.createdAt DESC
      LIMIT ? OFFSET ?`,
      args: [...args, pageSize, offset],
    });

    const logs = logsResult.rows.map((row) => ({
      id: row.id as string,
      adminUserId: row.adminUserId as string,
      adminName: (row.adminName as string) || "Unknown",
      adminEmail: (row.adminEmail as string) || "Unknown",
      adminRole: (row.adminRole as string) || "ADMIN",
      action: row.action as string,
      entityType: row.entityType as string,
      entityId: row.entityId as string | null,
      oldValue: row.oldValue ? JSON.parse(row.oldValue as string) : null,
      newValue: row.newValue ? JSON.parse(row.newValue as string) : null,
      ipAddress: row.ipAddress as string | null,
      userAgent: row.userAgent as string | null,
      reason: row.reason as string | null,
      createdAt: row.createdAt as string,
    }));

    // Get unique action types for filters
    const actionTypesResult = await db.execute({
      sql: `SELECT DISTINCT action FROM AdminAction ORDER BY action`,
      args: [],
    });
    const actionTypes = actionTypesResult.rows.map((row) => row.action as string);

    // Get unique entity types for filters
    const entityTypesResult = await db.execute({
      sql: `SELECT DISTINCT entityType FROM AdminAction ORDER BY entityType`,
      args: [],
    });
    const entityTypes = entityTypesResult.rows.map((row) => row.entityType as string);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filters: {
        actionTypes,
        entityTypes,
      },
    });
  } catch (error) {
    console.error("Admin logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
