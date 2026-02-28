import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db-turso";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { forgotPasswordSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }
    const email = parsed.data.email.trim().toLowerCase();

    // Look up user (but always return success to prevent email enumeration)
    const userResult = await db.execute({
      sql: `SELECT id, email FROM User WHERE email = ?`,
      args: [email],
    });

    if (userResult.rows.length > 0) {
      // Generate secure token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      // Delete any existing reset tokens for this email
      await db.execute({
        sql: `DELETE FROM VerificationToken WHERE identifier = ?`,
        args: [email],
      });

      // Store hashed token with 1-hour expiry
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await db.execute({
        sql: `INSERT INTO VerificationToken (identifier, token, expires, createdAt) VALUES (?, ?, ?, datetime('now'))`,
        args: [email, hashedToken, expires],
      });

      // Build reset URL and send email
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return success (timing-safe against enumeration)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
