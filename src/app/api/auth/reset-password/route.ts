import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db-turso";
import { resetPasswordSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { token, email, password } = parsed.data;

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Look up the token
    const tokenResult = await db.execute({
      sql: `SELECT identifier, token, expires FROM VerificationToken WHERE identifier = ? AND token = ?`,
      args: [email.trim().toLowerCase(), hashedToken],
    });

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const storedToken = tokenResult.rows[0];
    const expires = new Date(String(storedToken.expires));

    if (expires < new Date()) {
      // Token expired — clean it up
      await db.execute({
        sql: `DELETE FROM VerificationToken WHERE identifier = ? AND token = ?`,
        args: [email.trim().toLowerCase(), hashedToken],
      });
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    const updateResult = await db.execute({
      sql: `UPDATE User SET passwordHash = ?, updatedAt = datetime('now') WHERE email = ?`,
      args: [passwordHash, email.trim().toLowerCase()],
    });

    if (updateResult.rowsAffected === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Delete the used token (single-use)
    await db.execute({
      sql: `DELETE FROM VerificationToken WHERE identifier = ?`,
      args: [email.trim().toLowerCase()],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
