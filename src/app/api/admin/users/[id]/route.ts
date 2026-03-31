import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    // Get user basic info
    let userResult;
    try {
      userResult = await db.execute({
        sql: `SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.status,
          u.createdAt,
          u.lastLoginAt,
        FROM User u
        WHERE u.id = ?`,
        args: [id],
      });
    } catch (dbError) {
      console.error("Error fetching user base data:", dbError);
      return NextResponse.json(
        { error: "Database error fetching user", details: dbError instanceof Error ? dbError.message : "Unknown" },
        { status: 500 }
      );
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRow = userResult.rows[0] as Record<string, unknown>;
    const userRole = userRow.role as string;

    // Get KYC status
    let kycStatus = "UNVERIFIED";
    if (userRole === "CAREGIVER") {
      try {
        const kycResult = await db.execute({
          sql: "SELECT verificationStatus FROM ProfileCaregiver WHERE userId = ?",
          args: [id],
        });
        kycStatus = (kycResult.rows[0]?.verificationStatus as string) || "UNVERIFIED";
      } catch (e) {
        console.error("Error fetching KYC status:", e);
      }
    }

    // Get profile data
    let profile: Record<string, unknown> = {};
    if (userRole === "CAREGIVER") {
      try {
        const profileResult = await db.execute({
          sql: `SELECT
            experienceYears,
            services,
            hourlyRateEur,
            bio,
            averageRating,
            totalReviews
          FROM ProfileCaregiver WHERE userId = ?`,
          args: [id],
        });
        if (profileResult.rows.length > 0) {
          const p = profileResult.rows[0] as Record<string, unknown>;
          // Safely parse services JSON
          let specialties: string[] = [];
          try {
            if (p.services) {
              specialties = JSON.parse(p.services as string);
            }
          } catch {
            specialties = [];
          }
          profile = {
            experience: Number(p.experienceYears || 0),
            specialties,
            hourlyRate: Number(p.hourlyRateEur || 0),
            bio: p.bio as string,
            rating: Number(p.averageRating || 0),
            totalReviews: Number(p.totalReviews || 0),
          };
        }
      } catch (e) {
        console.error("Error fetching caregiver profile:", e);
      }
    } else if (userRole === "FAMILY") {
      try {
        const profileResult = await db.execute({
          sql: `SELECT country, city, preferredLanguage FROM ProfileFamily WHERE userId = ?`,
          args: [id],
        });
        if (profileResult.rows.length > 0) {
          const p = profileResult.rows[0] as Record<string, unknown>;
          profile = {
            country: p.country as string,
            city: p.city as string,
            preferredLanguage: p.preferredLanguage as string,
          };
        }
      } catch (e) {
        console.error("Error fetching family profile:", e);
      }
    }

    // Get wallet totals
    const walletTotals: Record<string, unknown> = { totalReceived: 0, totalSent: 0 };

    // Get contracts
    let contracts: Array<Record<string, unknown>> = [];
    try {
      const contractsResult = await db.execute({
        sql: `SELECT
          c.id,
          c.title,
          c.status,
          c.startDate,
          c.endDate,
          c.totalEurCents as value
        FROM Contract c
        WHERE c.familyUserId = ? OR c.caregiverUserId = ?
        ORDER BY c.createdAt DESC
        LIMIT 10`,
        args: [id, id],
      });
      contracts = contractsResult.rows.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string,
          title: r.title as string,
          status: r.status as string,
          startDate: r.startDate as string,
          endDate: r.endDate as string,
          value: Number(r.value || 0),
        };
      });
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }

    const transactions: Array<Record<string, unknown>> = [];

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
      if (c.startDate) {
        activity.push({
          id: `act-contract-${i}`,
          type: "contract_created",
          description: `Contract "${c.title}" created`,
          timestamp: c.startDate as string,
        });
      }
    });

    // Sort activity by timestamp
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const user = {
      id: userRow.id as string,
      name: userRow.name as string,
      email: userRow.email as string,
      phone: userRow.phone as string,
      role: userRole as "FAMILY" | "CAREGIVER" | "ADMIN",
      status: userRow.status as "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE",
      kycStatus: kycStatus as "VERIFIED" | "UNVERIFIED" | "PENDING_VERIFICATION" | "REJECTED",
      createdAt: userRow.createdAt as string,
      lastLoginAt: userRow.lastLoginAt as string,
      profile,
      contracts,
      transactions,
      activity,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user detail error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: "Failed to fetch user", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

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
        u.id, u.name, u.email, u.phone, u.role, u.status, u.createdAt,
        COALESCE(pc.verificationStatus, 'UNVERIFIED') as kycStatus
      FROM User u
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE u.id = ?`,
      args: [id],
    });

    const userAfter = userResult.rows[0];

    // Log action to AdminAction table
    const adminProfileResult = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ?`,
      args: [adminUserId],
    });
    const adminProfileId = adminProfileResult.rows[0]?.id as string | null;

    if (adminProfileId) {
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
          adminProfileId,
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
        args: [adminProfileId],
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
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId, session } = auth;

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
      sql: `SELECT id, name, email, phone, role, status FROM User WHERE id = ?`,
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
            WHERE (familyUserId = ? OR caregiverUserId = ?)
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
      args: [adminUserId],
    });
    const adminProfileId = adminProfileResult.rows[0]?.id as string | null;

    // Get IP and user agent
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Soft delete - set status to INACTIVE and anonymize some data
    await db.execute({
      sql: `UPDATE User SET
        status = 'INACTIVE',
        email = 'deleted_' || id || '@deleted.seniorcare.pt',
        phone = NULL,
        passwordHash = NULL,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [id],
    });

    // Log action to AdminAction table
    if (adminProfileId) {
      await db.execute({
        sql: `INSERT INTO AdminAction (
          id, adminUserId, action, entityType, entityId,
          oldValue, newValue, ipAddress, userAgent, reason, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          randomUUID(),
          adminProfileId,
          "DELETE",
          "USER",
          id,
          JSON.stringify({
            name: userBefore.name,
            email: userBefore.email,
            phone: userBefore.phone,
            role: userBefore.role,
            status: userBefore.status,
          }),
          JSON.stringify({
            status: "INACTIVE",
            email: `deleted_${id}@deleted.seniorcare.pt`,
          }),
          ipAddress,
          userAgent,
          reason,
        ],
      });

      // Update lastAdminActionAt
      await db.execute({
        sql: `UPDATE AdminUser SET lastAdminActionAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [adminProfileId],
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
