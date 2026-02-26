import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db-turso";
import { generateWallet } from "@/lib/services/wallet";

// Generate a CUID-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

export async function GET() {
  try {
    const adminEmail = "admin@idosolink.pt";
    const adminPassword = "Admin@123";
    const adminName = "Administrador";

    // Check if admin already exists
    const existingAdminResult = await db.execute({
      sql: `SELECT id, email, role FROM User WHERE email = ?`,
      args: [adminEmail],
    });

    if (existingAdminResult.rows.length > 0) {
      return NextResponse.json({
        message: "Admin user already exists",
        admin: {
          id: existingAdminResult.rows[0].id,
          email: existingAdminResult.rows[0].email,
          role: existingAdminResult.rows[0].role,
        },
        credentials: {
          email: adminEmail,
          password: adminPassword,
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Generate user ID
    const userId = generateId();

    // Create admin user
    await db.execute({
      sql: `INSERT INTO User (id, name, email, passwordHash, role, status, verificationStatus, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [userId, adminName, adminEmail, passwordHash],
    });

    // Generate wallet for admin
    const walletData = generateWallet();
    const walletId = generateId();

    await db.execute({
      sql: `INSERT INTO Wallet 
            (id, userId, address, encryptedPrivateKey, salt, balanceTokens, balanceEurCents, walletType, isExported, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        walletId,
        userId,
        walletData.address,
        walletData.encryptedPrivateKey,
        walletData.salt,
        1000, // 1000 tokens for admin
        1000,
        "custodial",
        0,
      ],
    });

    return NextResponse.json({
      message: "Admin user created successfully!",
      admin: {
        id: userId,
        name: adminName,
        email: adminEmail,
        role: "ADMIN",
        walletAddress: walletData.address,
      },
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
