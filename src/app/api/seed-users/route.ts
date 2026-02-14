import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateWallet } from "@/lib/services/wallet";

// Test users configuration
const TEST_USERS = [
  {
    email: "familia@teste.com",
    password: "teste123",
    name: "Família Silva",
    role: "FAMILY" as const,
    status: "ACTIVE" as const,
    country: "Portugal",
  },
  {
    email: "cuidador@teste.com",
    password: "teste123",
    name: "Maria Cuidadora",
    role: "CAREGIVER" as const,
    status: "ACTIVE" as const,
    country: "Portugal",
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
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: testUser.email },
        include: {
          wallet: true,
          profileCaregiver: true,
          profileFamily: true,
        },
      });

      if (existingUser) {
        // User already exists, return existing data
        results.created.push({
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          walletAddress: existingUser.wallet?.address || "N/A",
          initialTokens: existingUser.wallet?.balanceTokens || 0,
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

      // Create user with profile and wallet in a transaction
      const newUser = await db.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: testUser.email,
            passwordHash,
            name: testUser.name,
            role: testUser.role,
            status: testUser.status,
            verificationStatus: "VERIFIED",
          },
        });

        // Create profile based on role
        if (testUser.role === "FAMILY") {
          await tx.profileFamily.create({
            data: {
              userId: user.id,
              country: testUser.country,
            },
          });
        } else if (testUser.role === "CAREGIVER" && testUser.caregiverProfile) {
          await tx.profileCaregiver.create({
            data: {
              userId: user.id,
              country: testUser.country,
              experienceYears: testUser.caregiverProfile.experienceYears,
              services: JSON.stringify(testUser.caregiverProfile.specialties),
              hourlyRateEur: testUser.caregiverProfile.hourlyRateEur * 100, // Convert to cents
              bio: testUser.caregiverProfile.bio,
              title: "Cuidadora Profissional",
              verificationStatus: "VERIFIED",
            },
          });
        }

        // Generate wallet
        const walletData = generateWallet();

        // Create wallet with initial balance
        const wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            address: walletData.address,
            encryptedPrivateKey: walletData.encryptedPrivateKey,
            salt: walletData.salt,
            balanceTokens: INITIAL_TOKEN_BALANCE,
            balanceEurCents: INITIAL_TOKEN_BALANCE * 100, // 1 token = 0.01 EUR = 1 cent
            walletType: "custodial",
            isExported: false,
          },
        });

        // Create token ledger entry for initial tokens
        await tx.tokenLedger.create({
          data: {
            userId: user.id,
            type: "CREDIT",
            reason: "ACTIVATION_BONUS",
            amountTokens: INITIAL_TOKEN_BALANCE,
            amountEurCents: INITIAL_TOKEN_BALANCE * 100,
            description: "Bónus de teste - 100 tokens iniciais",
          },
        });

        return { user, wallet };
      });

      results.created.push({
        id: newUser.user.id,
        email: newUser.user.email,
        name: newUser.user.name,
        role: newUser.user.role,
        walletAddress: newUser.wallet.address,
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
