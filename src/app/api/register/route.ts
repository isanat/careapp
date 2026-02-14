import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createUserWallet } from "@/lib/services/wallet";

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

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role,
        status: "PENDING",
        verificationStatus: "UNVERIFIED",
      },
    });

    // Create wallet automatically
    const wallet = await createUserWallet(user.id);

    // Create profile based on role
    if (role === "FAMILY") {
      await db.profileFamily.create({
        data: {
          userId: user.id,
          country: "PT",
        },
      });
    } else {
      await db.profileCaregiver.create({
        data: {
          userId: user.id,
          country: "PT",
          hourlyRateEur: 1500, // €15 default
          radiusKm: 20,
          verificationStatus: "UNVERIFIED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      walletAddress: wallet.address,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
