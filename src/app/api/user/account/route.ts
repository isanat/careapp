import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Look up user email for VerificationToken cleanup
    const userResult = await db.execute({
      sql: `SELECT email FROM User WHERE id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = userResult.rows[0].email as string;

    // Delete in dependency order to respect FK-like relationships
    // 1. Chat data
    await db.execute({
      sql: `DELETE FROM ChatMessage WHERE senderId = ?`,
      args: [userId],
    });
    await db.execute({
      sql: `DELETE FROM ChatParticipant WHERE userId = ?`,
      args: [userId],
    });

    // 2. Notifications
    await db.execute({
      sql: `DELETE FROM Notification WHERE userId = ?`,
      args: [userId],
    });

    // 4. Reviews (from this user)
    await db.execute({
      sql: `DELETE FROM Review WHERE fromUserId = ?`,
      args: [userId],
    });

    // 5. Payments
    await db.execute({
      sql: `DELETE FROM Payment WHERE userId = ?`,
      args: [userId],
    });

    // 6. Cancel active contracts
    await db.execute({
      sql: `UPDATE Contract SET status = 'CANCELLED', cancelledAt = datetime('now'), updatedAt = datetime('now')
            WHERE (familyUserId = ? OR caregiverUserId = ?)
            AND status IN ('DRAFT', 'PENDING_ACCEPTANCE', 'PENDING_PAYMENT', 'ACTIVE')`,
      args: [userId, userId],
    });

    // 7. Contract acceptances for user's contracts
    await db.execute({
      sql: `DELETE FROM ContractAcceptance WHERE contractId IN (
              SELECT id FROM Contract WHERE familyUserId = ? OR caregiverUserId = ?
            )`,
      args: [userId, userId],
    });

    // 8. Profile data
    await db.execute({
      sql: `DELETE FROM ProfileCaregiver WHERE userId = ?`,
      args: [userId],
    });
    await db.execute({
      sql: `DELETE FROM ProfileFamily WHERE userId = ?`,
      args: [userId],
    });

    // 10. Verification tokens
    await db.execute({
      sql: `DELETE FROM VerificationToken WHERE identifier = ?`,
      args: [userEmail],
    });

    // 11. Auth data
    await db.execute({
      sql: `DELETE FROM Account WHERE userId = ?`,
      args: [userId],
    });
    await db.execute({
      sql: `DELETE FROM Session WHERE userId = ?`,
      args: [userId],
    });

    // 12. Finally delete the user
    await db.execute({
      sql: `DELETE FROM User WHERE id = ?`,
      args: [userId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
