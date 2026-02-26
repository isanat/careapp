import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user basic info
    const userResult = await db.execute({
      sql: `SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.createdAt,
        u.lastLoginAt,
        w.address as walletAddress,
        w.balance as walletBalance
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      WHERE u.id = ?`,
      args: [id],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRow = userResult.rows[0];

    // Get KYC status
    let kycStatus = "UNVERIFIED";
    if (userRow.role === "CAREGIVER") {
      const kycResult = await db.execute({
        sql: "SELECT verificationStatus FROM ProfileCaregiver WHERE userId = ?",
        args: [id],
      });
      kycStatus = (kycResult.rows[0]?.verificationStatus as string) || "UNVERIFIED";
    }

    // Get profile data
    let profile = {};
    if (userRow.role === "CAREGIVER") {
      const profileResult = await db.execute({
        sql: `SELECT
          experience,
          specialties,
          hourlyRate,
          bio,
          rating,
          totalReviews
        FROM ProfileCaregiver WHERE userId = ?`,
        args: [id],
      });
      if (profileResult.rows.length > 0) {
        const p = profileResult.rows[0];
        profile = {
          experience: Number(p.experience || 0),
          specialties: p.specialties ? JSON.parse(p.specialties as string) : [],
          hourlyRate: Number(p.hourlyRate || 0),
          bio: p.bio as string,
          rating: Number(p.rating || 0),
          totalReviews: Number(p.totalReviews || 0),
        };
      }
    } else if (userRow.role === "FAMILY") {
      const profileResult = await db.execute({
        sql: `SELECT country, city, preferredLanguage FROM ProfileFamily WHERE userId = ?`,
        args: [id],
      });
      if (profileResult.rows.length > 0) {
        const p = profileResult.rows[0];
        profile = {
          country: p.country as string,
          city: p.city as string,
          preferredLanguage: p.preferredLanguage as string,
        };
      }
    }

    // Get wallet totals
    const walletTotalsResult = await db.execute({
      sql: `SELECT
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as totalReceived,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as totalSent
      FROM TokenLedger WHERE walletId = (SELECT id FROM Wallet WHERE userId = ?)`,
      args: [id],
    });
    const walletTotals = walletTotalsResult.rows[0];

    // Get contracts
    const contractsResult = await db.execute({
      sql: `SELECT
        c.id,
        c.title,
        c.status,
        c.startDate,
        c.endDate,
        c.totalValue as value
      FROM Contract c
      WHERE c.familyId = ? OR c.caregiverId = ?
      ORDER BY c.createdAt DESC
      LIMIT 10`,
      args: [id, id],
    });
    const contracts = contractsResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      startDate: row.startDate as string,
      endDate: row.endDate as string,
      value: Number(row.value || 0),
    }));

    // Get transactions
    const transactionsResult = await db.execute({
      sql: `SELECT
        tl.id,
        tl.amount,
        tl.reason as description,
        tl.createdAt
      FROM TokenLedger tl
      WHERE tl.walletId = (SELECT id FROM Wallet WHERE userId = ?)
      ORDER BY tl.createdAt DESC
      LIMIT 20`,
      args: [id],
    });
    const transactions = transactionsResult.rows.map((row) => ({
      id: row.id as string,
      type: Number(row.amount) > 0 ? "credit" : "debit",
      amount: Number(row.amount),
      description: row.description as string,
      createdAt: row.createdAt as string,
    }));

    // Generate activity from various sources
    const activity: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
    }> = [];

    // Add registration activity
    activity.push({
      id: `act-reg-${id}`,
      type: "user_registered",
      description: "User registered on the platform",
      timestamp: userRow.createdAt as string,
    });

    // Add last login if exists
    if (userRow.lastLoginAt) {
      activity.push({
        id: `act-login-${id}`,
        type: "user_login",
        description: "User logged in",
        timestamp: userRow.lastLoginAt as string,
      });
    }

    // Add contract activities
    contracts.forEach((c, i) => {
      activity.push({
        id: `act-contract-${i}`,
        type: "contract_created",
        description: `Contract "${c.title}" created`,
        timestamp: c.startDate,
      });
    });

    // Sort activity by timestamp
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const user = {
      id: userRow.id as string,
      name: userRow.name as string,
      email: userRow.email as string,
      phone: userRow.phone as string,
      role: userRow.role as "FAMILY" | "CAREGIVER" | "ADMIN",
      status: userRow.status as "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE",
      kycStatus: kycStatus as "VERIFIED" | "UNVERIFIED" | "PENDING_VERIFICATION" | "REJECTED",
      createdAt: userRow.createdAt as string,
      lastLoginAt: userRow.lastLoginAt as string,
      wallet: {
        address: (userRow.walletAddress as string) || "Not created",
        balance: Number(userRow.walletBalance || 0),
        totalReceived: Number(walletTotals?.totalReceived || 0),
        totalSent: Number(walletTotals?.totalSent || 0),
      },
      profile,
      contracts,
      transactions,
      activity,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, role } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const args: (string | null)[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      args.push(name);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      args.push(email.toLowerCase());
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      args.push(phone || null);
    }
    if (role !== undefined) {
      const validRoles = ["FAMILY", "CAREGIVER", "ADMIN"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }
      updates.push("role = ?");
      args.push(role);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updatedAt = CURRENT_TIMESTAMP");
    args.push(id);

    // Get user before update for audit log
    const userBeforeResult = await db.execute({
      sql: "SELECT id, name, email, phone, role, status FROM User WHERE id = ?",
      args: [id],
    });

    if (userBeforeResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userBefore = userBeforeResult.rows[0];

    // Update user
    await db.execute({
      sql: `UPDATE User SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    // Get updated user
    const userResult = await db.execute({
      sql: `SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.createdAt,
        COALESCE(w.balance, 0) as walletBalance,
        COALESCE(pc.verificationStatus, 'UNVERIFIED') as kycStatus
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE u.id = ?`,
      args: [id],
    });

    const userAfter = userResult.rows[0];

    // Log action to AdminAction table
    const adminProfileResult = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ?`,
      args: [session.user.id],
    });
    const adminUserId = adminProfileResult.rows[0]?.id as string | null;

    if (adminUserId) {
      const ipAddress = request.headers.get("x-forwarded-for") || 
                        request.headers.get("x-real-ip") || 
                        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      await db.execute({
        sql: `INSERT INTO AdminAction (
          id, adminUserId, action, entityType, entityId, 
          oldValue, newValue, ipAddress, userAgent, reason, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          randomUUID(),
          adminUserId,
          "UPDATE",
          "USER",
          id,
          JSON.stringify({
            name: userBefore.name,
            email: userBefore.email,
            phone: userBefore.phone,
            role: userBefore.role,
          }),
          JSON.stringify({
            name: userAfter?.name,
            email: userAfter?.email,
            phone: userAfter?.phone,
            role: userAfter?.role,
          }),
          ipAddress,
          userAgent,
          "User updated by admin",
        ],
      });

      await db.execute({
        sql: `UPDATE AdminUser SET lastAdminActionAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [adminUserId],
      });
    }

    return NextResponse.json({
      user: {
        id: userAfter?.id,
        name: userAfter?.name,
        email: userAfter?.email,
        phone: userAfter?.phone,
        role: userAfter?.role,
        status: userAfter?.status,
        walletBalance: Number(userAfter?.walletBalance || 0),
        kycStatus: userAfter?.kycStatus,
        createdAt: userAfter?.createdAt,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete user (set status to INACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get request body for reason (optional)
    let reason = "User deleted by admin";
    try {
      const body = await request.json();
      if (body.reason) {
        reason = body.reason;
      }
    } catch {
      // No body provided, use default reason
    }

    // Get current user state
    const userResult = await db.execute({
      sql: `SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.status,
        w.balance as walletBalance
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      WHERE u.id = ?`,
      args: [id],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userBefore = userResult.rows[0];

    // Prevent deleting admin users
    if (userBefore.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    // Check for active contracts
    const activeContractsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM Contract 
            WHERE (familyId = ? OR caregiverId = ?) 
            AND status IN ('ACTIVE', 'PENDING_ACCEPTANCE', 'PENDING_PAYMENT')`,
      args: [id, id],
    });

    const activeContracts = Number(activeContractsResult.rows[0]?.count || 0);
    if (activeContracts > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with active contracts. Please complete or cancel contracts first." },
        { status: 400 }
      );
    }

    // Get admin profile for logging
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

    // Soft delete - set status to INACTIVE and anonymize some data
    await db.execute({
      sql: `UPDATE User SET 
        status = 'INACTIVE', 
        email = 'deleted_' || id || '@deleted.idosolink.pt',
        phone = NULL,
        passwordHash = NULL,
        updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      args: [id],
    });

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
          "DELETE",
          "USER",
          id,
          JSON.stringify({
            name: userBefore.name,
            email: userBefore.email,
            phone: userBefore.phone,
            role: userBefore.role,
            status: userBefore.status,
            walletBalance: userBefore.walletBalance,
          }),
          JSON.stringify({
            status: "INACTIVE",
            email: `deleted_${id}@deleted.idosolink.pt`,
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
      message: "User soft deleted successfully",
      user: {
        id: userBefore.id,
        name: userBefore.name,
        previousEmail: userBefore.email,
        status: "INACTIVE",
      },
      action: {
        type: "DELETE",
        reason,
        performedBy: session.user.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
