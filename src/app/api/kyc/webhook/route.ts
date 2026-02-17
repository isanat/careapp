import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/db-turso";
import { parseVerificationResult, DiditWebhookPayload } from "@/lib/services/didit";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-didit-signature") || "";

    // Verify webhook signature (in production)
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const data: DiditWebhookPayload = JSON.parse(payload);
    console.log("KYC Webhook received:", data.event, data.session_id, data.status);

    // Find the user by session ID
    const profileResult = await turso.execute({
      sql: `SELECT user_id FROM profiles_caregiver WHERE kyc_session_id = ?`,
      args: [data.session_id]
    });

    if (profileResult.rows.length === 0) {
      console.error("No profile found for session:", data.session_id);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const userId = profileResult.rows[0].user_id;

    // Parse verification results
    const verification = parseVerificationResult(data.verification);

    // Update profile based on verification result
    if (verification.status === "approved") {
      await turso.execute({
        sql: `UPDATE profiles_caregiver 
              SET verification_status = 'VERIFIED',
                  document_type = ?,
                  document_number = ?,
                  document_verified = 1,
                  kyc_completed_at = ?,
                  kyc_confidence = ?
              WHERE user_id = ?`,
        args: [
          verification.documentData?.type || null,
          verification.documentData?.documentNumber || null,
          new Date().toISOString(),
          verification.confidence,
          userId
        ]
      });

      // Also update user's verification status
      await turso.execute({
        sql: `UPDATE users SET verification_status = 'VERIFIED' WHERE id = ?`,
        args: [userId]
      });

      console.log(`KYC approved for user ${userId}`);
    } else if (verification.status === "rejected") {
      await turso.execute({
        sql: `UPDATE profiles_caregiver 
              SET verification_status = 'REJECTED',
                  kyc_completed_at = ?,
                  kyc_confidence = ?
              WHERE user_id = ?`,
        args: [new Date().toISOString(), verification.confidence, userId]
      });

      await turso.execute({
        sql: `UPDATE users SET verification_status = 'REJECTED' WHERE id = ?`,
        args: [userId]
      });

      console.log(`KYC rejected for user ${userId}`);
    } else if (verification.status === "needs_review") {
      await turso.execute({
        sql: `UPDATE profiles_caregiver 
              SET verification_status = 'PENDING',
                  kyc_confidence = ?
              WHERE user_id = ?`,
        args: [verification.confidence, userId]
      });

      console.log(`KYC needs review for user ${userId}`);
    }

    // Create notification for the user
    await turso.execute({
      sql: `INSERT INTO notifications (id, user_id, type, title, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        userId,
        "kyc_verification",
        verification.status === "approved" ? "Identity Verified" : 
          verification.status === "rejected" ? "Verification Failed" : "Verification in Review",
        verification.status === "approved" 
          ? "Your identity has been successfully verified. You can now receive contracts from families."
          : verification.status === "rejected"
          ? "Unfortunately, we could not verify your identity. Please try again with clearer documents."
          : "Your verification is under review. We will notify you once it's complete.",
        new Date().toISOString()
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("KYC webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
