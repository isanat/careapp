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

// Test users configuration
const TEST_USERS = [
  {
    email: "familia@teste.com",
    password: "teste123",
    name: "Família Silva",
    role: "FAMILY" as const,
    status: "ACTIVE" as const,
    country: "PT",
  },
  {
    email: "cuidador@teste.com",
    password: "teste123",
    name: "Maria Cuidadora",
    role: "CAREGIVER" as const,
    status: "ACTIVE" as const,
    country: "PT",
    caregiverProfile: {
      experienceYears: 5,
      specialties: ["Cuidados Domiciliários", "Alzheimer", "Paliativos"],
      hourlyRateEur: 15,
      bio: "Cuidadora profissional com 5 anos de experiência em cuidados de idosos. Especializada em cuidados domiciliários, apoio a pacientes com Alzheimer e cuidados paliativos. Dedicação e carinho são os pilares do meu trabalho.",
    },
  },
];

const INITIAL_TOKEN_BALANCE = 100;

export async function GET() {
  try {
    const results: {
      created: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        walletAddress: string;
        initialTokens: number;
        isNew: boolean;
      }>;
      credentials: Array<{
        email: string;
        password: string;
        role: string;
      }>;
      message: string;
    } = {
      created: [],
      credentials: [],
      message: "",
    };

    for (const testUser of TEST_USERS) {
      // Check if user already exists (using Turso)
      const existingUserResult = await db.execute({
        sql: `SELECT u.id, u.email, u.name, u.role, w.address, w.balance_tokens
              FROM users u
              LEFT JOIN wallets w ON u.id = w.user_id
              WHERE u.email = ?`,
        args: [testUser.email],
      });

      if (existingUserResult.rows.length > 0) {
        // User already exists, return existing data
        const existingUser = existingUserResult.rows[0];
        results.created.push({
          id: existingUser.id as string,
          email: existingUser.email as string,
          name: existingUser.name as string,
          role: existingUser.role as string,
          walletAddress: (existingUser.address as string) || "N/A",
          initialTokens: Number(existingUser.balance_tokens) || 0,
          isNew: false,
        });
        results.credentials.push({
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(testUser.password, 10);

      // Generate user ID
      const userId = generateId();

      // Create user (using Turso)
      await db.execute({
        sql: `INSERT INTO users (id, name, email, password_hash, role, status, verification_status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          userId,
          testUser.name,
          testUser.email,
          passwordHash,
          testUser.role,
          testUser.status,
          "VERIFIED",
        ],
      });

      // Create profile based on role (using Turso)
      if (testUser.role === "FAMILY") {
        const profileId = generateId();
        await db.execute({
          sql: `INSERT INTO profiles_family (id, user_id, country, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [profileId, userId, testUser.country],
        });
      } else if (testUser.role === "CAREGIVER" && testUser.caregiverProfile) {
        const profileId = generateId();
        await db.execute({
          sql: `INSERT INTO profiles_caregiver 
                (id, user_id, country, title, experience_years, services, hourly_rate_eur, bio, verification_status, total_contracts, total_hours_worked, average_rating, total_reviews, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [
            profileId,
            userId,
            testUser.country,
            "Cuidadora Profissional",
            testUser.caregiverProfile.experienceYears,
            JSON.stringify(testUser.caregiverProfile.specialties),
            testUser.caregiverProfile.hourlyRateEur * 100, // Convert to cents
            testUser.caregiverProfile.bio,
            "VERIFIED",
            0,
            0,
            0,
            0,
          ],
        });
      }

      // Generate wallet
      const walletData = generateWallet();
      const walletId = generateId();

      // Create wallet with initial balance (using Turso)
      await db.execute({
        sql: `INSERT INTO wallets 
              (id, user_id, address, encrypted_private_key, salt, balance_tokens, balance_eur_cents, wallet_type, is_exported, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          walletId,
          userId,
          walletData.address,
          walletData.encryptedPrivateKey,
          walletData.salt,
          INITIAL_TOKEN_BALANCE,
          INITIAL_TOKEN_BALANCE, // 1 token = 1 cent
          "custodial",
          0,
        ],
      });

      // Create token ledger entry for initial tokens (using Turso)
      const ledgerId = generateId();
      await db.execute({
        sql: `INSERT INTO token_ledger 
              (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at)
              VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          ledgerId,
          userId,
          INITIAL_TOKEN_BALANCE,
          INITIAL_TOKEN_BALANCE,
          "Bónus de teste - 100 tokens iniciais",
        ],
      });

      results.created.push({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        walletAddress: walletData.address,
        initialTokens: INITIAL_TOKEN_BALANCE,
        isNew: true,
      });

      results.credentials.push({
        email: testUser.email,
        password: testUser.password,
        role: testUser.role,
      });
    }

    const newUsers = results.created.filter((u) => u.isNew);
    const existingUsers = results.created.filter((u) => !u.isNew);

    results.message =
      newUsers.length > 0
        ? `Created ${newUsers.length} new test user(s). ${existingUsers.length} user(s) already existed.`
        : "All test users already exist.";

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error seeding test users:", error);
    return NextResponse.json(
      {
        error: "Failed to seed test users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
