import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-turso";
import crypto from "crypto";

/**
 * Didit Webhook Handler
 * Receives KYC verification completion and updates user profile
 */

const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET || "dev-secret";

/**
 * Verify Didit webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (DIDIT_WEBHOOK_SECRET === "dev-secret") {
    console.warn(
      "[Didit Webhook] Using dev secret - signature verification skipped",
    );
    return true;
  }

  const hash = crypto
    .createHmac("sha256", DIDIT_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-didit-signature");
    const body = await request.text();

    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error("[Didit Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { session_id, status, confidence, document, person } = data;

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    // Find user by KYC session ID
    const userResult = await db.execute({
      sql: `SELECT id FROM User WHERE kycSessionId = ?`,
      args: [session_id],
    });

    if (userResult.rows.length === 0) {
      console.warn(`[Didit Webhook] No user found for session ${session_id}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id as string;
    const now = new Date().toISOString();

    // Prepare update data
    const updates: string[] = [];
    const values: any[] = [];

    // Update KYC completion status
    if (status === "approved") {
      updates.push("verificationStatus = ?");
      values.push("VERIFIED");
      updates.push("status = ?");
      values.push("ACTIVE");
    } else if (status === "rejected") {
      updates.push("verificationStatus = ?");
      values.push("REJECTED");
    }

    // Update completion timestamp
    updates.push("kycCompletedAt = ?");
    values.push(now);

    // Update confidence score
    if (confidence !== undefined) {
      updates.push("kycConfidence = ?");
      values.push(Math.round(confidence));
    }

    // Update document details
    if (document) {
      if (document.issue_date) {
        updates.push("kycDocumentIssueDate = ?");
        values.push(new Date(document.issue_date).toISOString());
      }
      if (document.expiry_date) {
        updates.push("kycDocumentExpiryDate = ?");
        values.push(new Date(document.expiry_date).toISOString());
      }
      if (document.issuer) {
        updates.push("kycDocumentIssuer = ?");
        values.push(document.issuer);
      }
    }

    // Update person details
    if (person) {
      if (person.birth_date) {
        updates.push("kycBirthDate = ?");
        values.push(new Date(person.birth_date).toISOString());
      }
      if (person.nationality) {
        updates.push("kycNationality = ?");
        values.push(person.nationality);
      }
    }

    // Store full KYC data
    updates.push("kycData = ?");
    values.push(JSON.stringify(data));

    // Always update timestamp
    updates.push("updatedAt = ?");
    values.push(now);

    // Add user ID
    values.push(userId);

    // Execute update
    await db.execute({
      sql: `UPDATE User SET ${updates.join(", ")} WHERE id = ?`,
      args: values,
    });

    console.log(
      `[Didit Webhook] Successfully processed KYC for user ${userId}. Status: ${status}`,
    );

    return NextResponse.json({
      success: true,
      message: `KYC ${status} for session ${session_id}`,
      userId,
      status,
    });
  } catch (error) {
    console.error("[Didit Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Didit webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
