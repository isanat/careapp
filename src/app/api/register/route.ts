import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db-turso";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

// Generate a CUID-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}${randomPart2}`.substring(0, 25);
}

// Wallet encryption key
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-encryption-key-change-in-production";

// Generate a new Ethereum wallet
function generateWallet() {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Generate salt for encryption
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  
  // Encrypt private key
  const encryptedPrivateKey = CryptoJS.AES.encrypt(
    wallet.privateKey,
    ENCRYPTION_KEY + salt
  ).toString();

  return {
    address: wallet.address,
    encryptedPrivateKey,
    salt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role } = body;

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["FAMILY", "CAREGIVER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user already exists (using Turso)
    const existingUserResult = await db.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email.toLowerCase()]
    });

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate user ID
    const userId = generateId();

    // Create user (using Turso)
    await db.execute({
      sql: `INSERT INTO users (id, name, email, phone, password_hash, role, status, verification_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        userId,
        name,
        email.toLowerCase(),
        phone || null,
        passwordHash,
        role,
        "PENDING",
        "UNVERIFIED"
      ]
    });

    // Generate wallet
    const walletData = generateWallet();
    const walletId = generateId();

    // Create wallet (using Turso)
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, address, encrypted_private_key, salt, balance_tokens, balance_eur_cents, wallet_type, is_exported, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        walletId,
        userId,
        walletData.address,
        walletData.encryptedPrivateKey,
        walletData.salt,
        0,
        0,
        "custodial",
        0
      ]
    });

    // Create profile based on role (using Turso)
    if (role === "FAMILY") {
      const profileId = generateId();
      await db.execute({
        sql: `INSERT INTO profiles_family (id, user_id, country, created_at, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [profileId, userId, "PT"]
      });
    } else {
      // CAREGIVER
      const profileId = generateId();
      await db.execute({
        sql: `INSERT INTO profiles_caregiver (id, user_id, country, hourly_rate_eur, radius_km, verification_status, total_contracts, total_hours_worked, average_rating, total_reviews, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          profileId,
          userId,
          "PT",
          1500, // €15 default (in cents)
          20,   // 20km radius
          "UNVERIFIED",
          0,
          0,
          0,
          0
        ]
      });
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      walletAddress: walletData.address,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
