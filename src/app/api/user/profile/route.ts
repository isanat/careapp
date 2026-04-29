/**
 * User Profile API Routes
 *
 * GET /api/user/profile
 * - Fetch authenticated user's complete profile (User + ProfileFamily/ProfileCaregiver)
 * - Returns: { user: User, profile: MergedProfile }
 * - Auth: Required
 *
 * PUT /api/user/profile
 * - Update user profile fields across User, ProfileFamily, and ProfileCaregiver tables
 * - Supports partial updates (only provided fields are updated)
 * - Accepts: User fields, Family fields, or Caregiver fields
 * - Returns: { success: true, message: "Profile updated" }
 * - Auth: Required
 * - Automatic: Creates profile rows if needed (INSERT OR IGNORE)
 *
 * USAGE:
 * PUT /api/user/profile with JSON body:
 * {
 *   "name": "João Silva",
 *   "phone": "+351912345678",
 *   "profileImage": "https://...",
 *   "bio": "Experienced caregiver",
 *   "hourlyRateEur": 15.50,
 *   "languages": ["pt", "en"]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// Field validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhonePT(phone: string): boolean {
  // PT phone format: +351 9xx xxx xxx or 9xx xxx xxx
  const phoneRegex = /^(\+351|00351)?9\d{2}\s?\d{3}\s?\d{3}$|^\+351\s?9\d{2}\s?\d{3}\s?\d{3}$/;
  const cleaned = phone.replace(/\s/g, "");
  return phoneRegex.test(cleaned);
}

function validateAge(age: number): boolean {
  // Age should be 1-120
  return age >= 1 && age <= 120 && Number.isInteger(age);
}

function validatePositiveNumber(value: number): boolean {
  return value >= 0 && !isNaN(value);
}

function validateExperience(years: number): boolean {
  // Experience should be 0-80
  return years >= 0 && years <= 80 && Number.isInteger(years);
}

// GET: Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and their profile
    const userResult = await db.execute({
      sql: `SELECT u.*, pf.*, pc.*
            FROM User u
            LEFT JOIN ProfileFamily pf ON u.id = pf.userId
            LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
            WHERE u.id = ?`,
      args: [session.user.id],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = userResult.rows[0];

    // Merge profile data from appropriate profile table
    const profile = {
      // User fields
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      role: row.role,
      status: row.status,
      profileImage: row.profileImage,
      nif: row.nif,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
      backgroundCheckStatus: row.backgroundCheckStatus,
      backgroundCheckUrl: row.backgroundCheckUrl,

      // KYC Data (from Didit)
      kycSessionId: row.kycSessionId,
      kycCompletedAt: row.kycCompletedAt,
      kycConfidence: row.kycConfidence,
      kycBirthDate: row.kycBirthDate,
      kycNationality: row.kycNationality,
      kycDocumentIssueDate: row.kycDocumentIssueDate,
      kycDocumentExpiryDate: row.kycDocumentExpiryDate,
      kycDocumentIssuer: row.kycDocumentIssuer,
      kycData: row.kycData,

      // Family profile fields
      address: row.address,
      city: row.city,
      country: row.country,
      postalCode: row.postalCode,
      elderName: row.elderName,
      elderAge: row.elderAge,
      elderNeeds: row.elderNeeds,
      medicalConditions: row.medicalConditions,
      emergencyContactName: row.emergencyContactName,
      emergencyContactPhone: row.emergencyContactPhone,
      emergencyContactRelation: row.emergencyContactRelation,

      // Caregiver profile fields
      title: row.title,
      bio: row.bio,
      experienceYears: row.experienceYears,
      education: row.education,
      certifications: row.certifications,
      languages: row.languages,
      latitude: row.latitude,
      longitude: row.longitude,
      radiusKm: row.radiusKm,
      services: row.services,
      hourlyRateEur: row.hourlyRateEur,
      minimumHours: row.minimumHours,
      availabilityJson: row.availabilityJson,
      availableNow: row.availableNow,
      verificationStatus: row.verificationStatus,
      documentVerified: row.documentVerified,
      totalContracts: row.totalContracts,
      totalHoursWorked: row.totalHoursWorked,
      averageRating: row.averageRating,
      totalReviews: row.totalReviews,
    };

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role,
        status: row.status,
        profileImage: row.profileImage,
        nif: row.nif,
        documentType: row.documentType,
        documentNumber: row.documentNumber,
        backgroundCheckStatus: row.backgroundCheckStatus,
        backgroundCheckUrl: row.backgroundCheckUrl,
      },
      profile: profile,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Define allowed fields per role
    const caregiverOnlyFields = [
      "title",
      "bio",
      "experienceYears",
      "education",
      "certifications",
      "languages",
      "services",
      "hourlyRateEur",
    ];
    const familyOnlyFields = [
      "address",
      "elderName",
      "elderAge",
      "elderNeeds",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
    ];
    // Note: city, country are allowed for both roles (caregiver's work location, family's home)

    // Validate role-specific fields
    const userRole = session.user.role;
    if (userRole === "FAMILY") {
      const invalidFields = caregiverOnlyFields.filter(
        (field) => body[field] !== undefined
      );
      if (invalidFields.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid fields for FAMILY role",
            invalidFields,
          },
          { status: 400 }
        );
      }
    } else if (userRole === "CAREGIVER") {
      const invalidFields = familyOnlyFields.filter(
        (field) => body[field] !== undefined
      );
      if (invalidFields.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid fields for CAREGIVER role",
            invalidFields,
          },
          { status: 400 }
        );
      }
    }

    // Validate field values
    if (body.email !== undefined && !validateEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (body.phone !== undefined && !validatePhonePT(body.phone)) {
      return NextResponse.json(
        { error: "Invalid phone format. Use Portuguese format: +351 9xx xxx xxx" },
        { status: 400 }
      );
    }

    if (body.elderAge !== undefined && !validateAge(body.elderAge)) {
      return NextResponse.json(
        { error: "Invalid age. Must be between 1 and 120" },
        { status: 400 }
      );
    }

    if (
      body.experienceYears !== undefined &&
      !validateExperience(body.experienceYears)
    ) {
      return NextResponse.json(
        { error: "Invalid experience. Must be between 0 and 80 years" },
        { status: 400 }
      );
    }

    if (
      body.hourlyRateEur !== undefined &&
      !validatePositiveNumber(body.hourlyRateEur)
    ) {
      return NextResponse.json(
        { error: "Invalid hourly rate. Must be a positive number" },
        { status: 400 }
      );
    }

    // Update user basic fields
    const userUpdates: string[] = [];
    const userValues: any[] = [];

    if (body.name !== undefined) {
      userUpdates.push("name = ?");
      userValues.push(body.name);
    }
    if (body.phone !== undefined) {
      userUpdates.push("phone = ?");
      userValues.push(body.phone);
    }
    if (body.profileImage !== undefined) {
      userUpdates.push("profileImage = ?");
      userValues.push(body.profileImage);
    }
    if (body.nif !== undefined) {
      userUpdates.push("nif = ?");
      userValues.push(body.nif);
    }
    if (body.documentType !== undefined) {
      userUpdates.push("documentType = ?");
      userValues.push(body.documentType);
    }
    if (body.documentNumber !== undefined) {
      userUpdates.push("documentNumber = ?");
      userValues.push(body.documentNumber);
    }

    if (userUpdates.length > 0) {
      userUpdates.push("updatedAt = ?");
      userValues.push(now);
      userValues.push(session.user.id);

      await db.execute({
        sql: `UPDATE User SET ${userUpdates.join(", ")} WHERE id = ?`,
        args: userValues,
      });
    }

    // Update family profile
    const familyUpdates: string[] = [];
    const familyValues: any[] = [];

    if (body.address !== undefined) {
      familyUpdates.push("address = ?");
      familyValues.push(body.address);
    }
    if (body.city !== undefined) {
      familyUpdates.push("city = ?");
      familyValues.push(body.city);
    }
    if (body.country !== undefined) {
      familyUpdates.push("country = ?");
      familyValues.push(body.country);
    }
    if (body.elderName !== undefined) {
      familyUpdates.push("elderName = ?");
      familyValues.push(body.elderName);
    }
    if (body.elderAge !== undefined) {
      familyUpdates.push("elderAge = ?");
      familyValues.push(body.elderAge);
    }
    if (body.elderNeeds !== undefined) {
      familyUpdates.push("elderNeeds = ?");
      familyValues.push(body.elderNeeds);
    }
    if (body.emergencyContactName !== undefined) {
      familyUpdates.push("emergencyContactName = ?");
      familyValues.push(body.emergencyContactName);
    }
    if (body.emergencyContactPhone !== undefined) {
      familyUpdates.push("emergencyContactPhone = ?");
      familyValues.push(body.emergencyContactPhone);
    }

    if (familyUpdates.length > 0) {
      familyUpdates.push("updatedAt = ?");
      familyValues.push(now);
      familyValues.push(session.user.id);

      await db.execute({
        sql: `UPDATE ProfileFamily SET ${familyUpdates.join(", ")} WHERE userId = ?`,
        args: familyValues,
      });
    }

    // Update caregiver profile
    const caregiverUpdates: string[] = [];
    const caregiverValues: any[] = [];

    if (body.title !== undefined) {
      caregiverUpdates.push("title = ?");
      caregiverValues.push(body.title);
    }
    if (body.bio !== undefined) {
      caregiverUpdates.push("bio = ?");
      caregiverValues.push(body.bio);
    }
    if (body.experienceYears !== undefined) {
      caregiverUpdates.push("experienceYears = ?");
      caregiverValues.push(body.experienceYears);
    }
    if (body.education !== undefined) {
      caregiverUpdates.push("education = ?");
      caregiverValues.push(body.education);
    }
    if (body.certifications !== undefined) {
      caregiverUpdates.push("certifications = ?");
      caregiverValues.push(body.certifications);
    }
    if (body.languages !== undefined) {
      caregiverUpdates.push("languages = ?");
      caregiverValues.push(JSON.stringify(body.languages));
    }
    if (body.city !== undefined) {
      caregiverUpdates.push("city = ?");
      caregiverValues.push(body.city);
    }
    if (body.country !== undefined) {
      caregiverUpdates.push("country = ?");
      caregiverValues.push(body.country);
    }
    if (body.services !== undefined) {
      caregiverUpdates.push("services = ?");
      caregiverValues.push(JSON.stringify(body.services));
    }
    if (body.hourlyRateEur !== undefined) {
      caregiverUpdates.push("hourlyRateEur = ?");
      caregiverValues.push(Math.round(body.hourlyRateEur * 100));
    }

    if (caregiverUpdates.length > 0) {
      // Ensure caregiver profile row exists
      await db.execute({
        sql: `INSERT OR IGNORE INTO ProfileCaregiver (id, userId, hourlyRateEur, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?)`,
        args: [`pc_${session.user.id}`, session.user.id, now, now],
      });

      caregiverUpdates.push("updatedAt = ?");
      caregiverValues.push(now);
      caregiverValues.push(session.user.id);

      await db.execute({
        sql: `UPDATE ProfileCaregiver SET ${caregiverUpdates.join(", ")} WHERE userId = ?`,
        args: caregiverValues,
      });
    }

    // Also ensure family profile row exists for FAMILY users
    if (familyUpdates.length > 0) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO ProfileFamily (id, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
        args: [`pf_${session.user.id}`, session.user.id, now, now],
      });
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
