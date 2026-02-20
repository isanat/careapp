import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// GET - List users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all";
    const kyc = searchParams.get("kyc") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (search) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }

    if (role !== "all") {
      conditions.push("u.role = ?");
      args.push(role);
    }

    if (status !== "all") {
      conditions.push("u.status = ?");
      args.push(status);
    }

    if (kyc !== "all") {
      conditions.push("pc.verificationStatus = ?");
      args.push(kyc);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(DISTINCT u.id) as count
            FROM User u
            LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
            ${whereClause}`,
      args,
    });
    const total = Number(countResult.rows[0]?.count || 0);

    // Get users with pagination
    const usersResult = await db.execute({
      sql: `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.createdAt,
        COALESCE(w.balance, 0) as walletBalance,
        COALESCE(pc.verificationStatus, 'UNVERIFIED') as kycStatus
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      ${whereClause}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?`,
      args: [...args, pageSize, offset],
    });

    const users = usersResult.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      role: row.role as "FAMILY" | "CAREGIVER" | "ADMIN",
      status: row.status as "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE",
      kycStatus: (row.kycStatus || "UNVERIFIED") as "VERIFIED" | "UNVERIFIED" | "PENDING_VERIFICATION" | "REJECTED",
      walletBalance: Number(row.walletBalance || 0),
      createdAt: row.createdAt as string,
    }));

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      role = "FAMILY",
      phone,
      sendWelcomeEmail = true,
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["FAMILY", "CAREGIVER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be FAMILY, CAREGIVER, or ADMIN" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserResult = await db.execute({
      sql: "SELECT id FROM User WHERE email = ?",
      args: [email.toLowerCase()],
    });

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

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

    const userId = randomUUID();

    // Create user
    await db.execute({
      sql: `INSERT INTO User (
        id, name, email, phone, passwordHash, role, status, 
        emailVerified, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        userId,
        name,
        email.toLowerCase(),
        phone || null,
        passwordHash,
        role,
      ],
    });

    // Create role-specific profile
    if (role === "FAMILY") {
      await db.execute({
        sql: `INSERT INTO ProfileFamily (id, userId, country, createdAt, updatedAt)
              VALUES (?, ?, 'PT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [randomUUID(), userId],
      });
    } else if (role === "CAREGIVER") {
      await db.execute({
        sql: `INSERT INTO ProfileCaregiver (
          id, userId, verificationStatus, hourlyRateEur, 
          availableNow, totalContracts, totalHoursWorked, averageRating, totalReviews,
          createdAt, updatedAt
        ) VALUES (?, ?, 'UNVERIFIED', 1500, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [randomUUID(), userId],
      });
    } else if (role === "ADMIN") {
      // Create AdminUser profile for admin role
      await db.execute({
        sql: `INSERT INTO AdminUser (
          id, userId, role, isActive, createdAt, updatedAt
        ) VALUES (?, ?, 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [randomUUID(), userId],
      });
    }

    // Create wallet for user
    const walletId = randomUUID();
    const walletAddress = `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    await db.execute({
      sql: `INSERT INTO Wallet (id, userId, address, balance, balanceEurCents, walletType, createdAt, updatedAt)
            VALUES (?, ?, ?, 0, 0, 'custodial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [walletId, userId, walletAddress],
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
          "CREATE",
          "USER",
          userId,
          null,
          JSON.stringify({
            name,
            email: email.toLowerCase(),
            role,
            phone: phone || null,
          }),
          ipAddress,
          userAgent,
          "User created by admin",
        ],
      });

      // Update lastAdminActionAt
      await db.execute({
        sql: `UPDATE AdminUser SET lastAdminActionAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [adminUserId],
      });
    }

    // Get created user
    const newUserResult = await db.execute({
      sql: `SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.status, u.createdAt,
        w.address as walletAddress
      FROM User u
      LEFT JOIN Wallet w ON u.id = w.userId
      WHERE u.id = ?`,
      args: [userId],
    });

    const newUser = newUserResult.rows[0];

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser?.id,
        name: newUser?.name,
        email: newUser?.email,
        phone: newUser?.phone,
        role: newUser?.role,
        status: newUser?.status,
        walletAddress: newUser?.walletAddress,
        createdAt: newUser?.createdAt,
      },
      temporaryPassword: password, // Return for admin to share with user
      sendWelcomeEmail,
    }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
