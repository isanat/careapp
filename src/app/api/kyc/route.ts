import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { createKycSession } from "@/lib/services/didit";
import { db } from "@/lib/db-turso";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a caregiver
    const userResult = await db.execute({
      sql: `SELECT u.id, u.email, u.name, u.role, pc.verification_status 
            FROM users u 
            LEFT JOIN profiles_caregiver pc ON u.id = pc.user_id 
            WHERE u.id = ?`,
      args: [session.user.id]
    });

    const user = userResult.rows[0];
    
    if (!user || user.role !== "CAREGIVER") {
      return NextResponse.json(
        { error: "Only caregivers can verify their identity" },
        { status: 403 }
      );
    }

    // Check if already verified or pending
    if (user.verification_status === "VERIFIED") {
      return NextResponse.json(
        { error: "Identity already verified" },
        { status: 400 }
      );
    }

    // Create KYC session with Didit
    const kycSession = await createKycSession(
      session.user.id,
      user.email as string,
      user.name as string
    );

    // Store session ID in database
    await db.execute({
      sql: `UPDATE profiles_caregiver 
            SET verification_status = 'PENDING',
                kyc_session_id = ?,
                kyc_session_created_at = ?
            WHERE user_id = ?`,
      args: [kycSession.session_id, new Date().toISOString(), session.user.id]
    });

    return NextResponse.json({
      success: true,
      session_id: kycSession.session_id,
      url: kycSession.url,
      expires_at: kycSession.expires_at,
    });
  } catch (error) {
    console.error("Error creating KYC session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create verification session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get KYC status
    const result = await db.execute({
      sql: `SELECT 
              verification_status,
              document_type,
              document_number,
              document_verified,
              kyc_session_id,
              kyc_session_created_at,
              kyc_completed_at,
              kyc_confidence
            FROM profiles_caregiver 
            WHERE user_id = ?`,
      args: [session.user.id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const profile = result.rows[0];

    return NextResponse.json({
      verification_status: profile.verification_status || "UNVERIFIED",
      document_type: profile.document_type,
      document_verified: profile.document_verified === 1,
      session_id: profile.kyc_session_id,
      session_created_at: profile.kyc_session_created_at,
      completed_at: profile.kyc_completed_at,
      confidence: profile.kyc_confidence,
    });
  } catch (error) {
    console.error("Error getting KYC status:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}
