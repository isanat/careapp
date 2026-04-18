import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-turso";
import { validateAdminKey } from "@/lib/admin-auth";

/**
 * Admin endpoint to create/sync users from Didit KYC data
 * POST /api/admin/sync-didit-user
 *
 * Useful when you have approved KYC data in Didit but user doesn't exist in database
 * (e.g., after database reset or manual Didit verification)
 */

interface DiditUserData {
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format
  nationality: string;
  documentNumber: string;
  documentType: string;
  documentIssuer: string;
  documentIssueDate: string; // ISO format
  documentExpiryDate: string; // ISO format
  kycSessionId: string;
  role?: "FAMILY" | "CAREGIVER";
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = request.headers.get("authorization");
    if (!validateAdminKey(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DiditUserData = await request.json();

    const {
      email,
      firstName,
      lastName,
      birthDate,
      nationality,
      documentNumber,
      documentType,
      documentIssuer,
      documentIssueDate,
      documentExpiryDate,
      kycSessionId,
      role = "CAREGIVER",
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !kycSessionId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: email, firstName, lastName, kycSessionId",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await db.execute({
      sql: "SELECT id FROM User WHERE email = ?",
      args: [email],
    });

    let userId: string;

    if (existing.rows.length > 0) {
      // Update existing user with KYC data
      userId = existing.rows[0].id as string;

      const now = new Date().toISOString();
      await db.execute({
        sql: `UPDATE User SET
          kycSessionId = ?,
          kycBirthDate = ?,
          kycNationality = ?,
          kycDocumentIssueDate = ?,
          kycDocumentExpiryDate = ?,
          kycDocumentIssuer = ?,
          verificationStatus = ?,
          status = ?,
          kycCompletedAt = ?,
          kycData = ?,
          updatedAt = ?
        WHERE id = ?`,
        args: [
          kycSessionId,
          new Date(birthDate).toISOString(),
          nationality,
          new Date(documentIssueDate).toISOString(),
          new Date(documentExpiryDate).toISOString(),
          documentIssuer,
          "VERIFIED",
          "ACTIVE",
          now,
          JSON.stringify({
            email,
            firstName,
            lastName,
            birthDate,
            nationality,
            documentNumber,
            documentType,
            documentIssuer,
            documentIssueDate,
            documentExpiryDate,
            syncedAt: now,
          }),
          now,
        ],
      });

      console.log(`[Admin] Updated user ${userId} with Didit KYC data`);

      return NextResponse.json({
        success: true,
        action: "updated",
        userId,
        email,
        message: "User updated with Didit KYC data",
      });
    } else {
      // Create new user with KYC data
      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO User (
          id,
          email,
          name,
          firstName,
          lastName,
          role,
          status,
          verificationStatus,
          kycSessionId,
          kycBirthDate,
          kycNationality,
          kycDocumentIssueDate,
          kycDocumentExpiryDate,
          kycDocumentIssuer,
          kycCompletedAt,
          kycData,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newId,
          email,
          `${firstName} ${lastName}`,
          firstName,
          lastName,
          role,
          "ACTIVE",
          "VERIFIED",
          kycSessionId,
          new Date(birthDate).toISOString(),
          nationality,
          new Date(documentIssueDate).toISOString(),
          new Date(documentExpiryDate).toISOString(),
          documentIssuer,
          now,
          JSON.stringify({
            email,
            firstName,
            lastName,
            birthDate,
            nationality,
            documentNumber,
            documentType,
            documentIssuer,
            documentIssueDate,
            documentExpiryDate,
            syncedAt: now,
          }),
          now,
          now,
        ],
      });

      console.log(`[Admin] Created new user ${newId} with Didit KYC data`);

      return NextResponse.json(
        {
          success: true,
          action: "created",
          userId: newId,
          email,
          role,
          message: "User created from Didit KYC data",
        },
        { status: 201 },
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Admin] Error syncing Didit user:", errorMsg);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "Failed to sync user from Didit data",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
