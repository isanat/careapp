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
    const { name, email, phone, password, role, acceptTerms } = body;
    
    // Get IP address and user agent for legal proof
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

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

    // Validate terms acceptance (required for legal protection)
    if (!acceptTerms) {
      return NextResponse.json(
        { error: "Terms acceptance is required" },
        { status: 400 }
      );
    }

    // Check if user already exists (using Turso)
    const existingUserResult = await db.execute({
      sql: `SELECT id FROM User WHERE email = ?`,
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
    const now = new Date().toISOString();

    // Create user (using Turso)
    await db.execute({
      sql: `INSERT INTO User (id, name, email, phone, passwordHash, role, status, verificationStatus, createdAt, updatedAt)
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
      sql: `INSERT INTO Wallet (id, userId, address, encryptedPrivateKey, salt, balanceTokens, balanceEurCents, walletType, isExported, createdAt, updatedAt)
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
        sql: `INSERT INTO ProfileFamily (id, userId, country, createdAt, updatedAt)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [profileId, userId, "PT"]
      });
    } else {
      // CAREGIVER
      const profileId = generateId();
      await db.execute({
        sql: `INSERT INTO ProfileCaregiver (id, userId, country, hourlyRateEur, radiusKm, verificationStatus, totalContracts, totalHoursWorked, averageRating, totalReviews, createdAt, updatedAt)
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

    // Register terms acceptance for legal protection
    // Accept: terms_of_use, privacy_policy, mediation_policy
    const requiredTerms = ['terms_of_use', 'privacy_policy', 'mediation_policy'];
    
    for (const termsType of requiredTerms) {
      const acceptanceId = `ta-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      await db.execute({
        sql: `INSERT INTO TermsAcceptance (id, userId, termsType, termsVersion, ipAddress, userAgent, acceptedAt)
              VALUES (?, ?, ?, '1.0', ?, ?, ?)`,
        args: [acceptanceId, userId, termsType, ipAddress, userAgent, now]
      });
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      walletAddress: walletData.address,
      termsAccepted: requiredTerms,
      acceptedAt: now,
      ipAddress: ipAddress !== 'unknown' ? ipAddress : null, // Don't return 'unknown' to client
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
