import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

// GET - Get contract details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const contract = await db.execute({
      sql: `
        SELECT c.*,
          uf.name as familyName, uf.email as familyEmail, uf.phone as familyPhone,
          uc.name as caregiverName, uc.email as caregiverEmail, uc.phone as caregiverPhone
        FROM Contract c
        JOIN User uf ON c.familyUserId = uf.id
        JOIN User uc ON c.caregiverUserId = uc.id
        WHERE c.id = ?
      `,
      args: [id],
    });

    if (contract.rows.length === 0) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // Get acceptance info from contract itself
    const c = contract.rows[0] as any;
    const acceptance = {
      familyAcceptedAt: c.acceptedByFamilyAt,
      caregiverAcceptedAt: c.acceptedByCaregiverAt,
    };

    // Get payments
    const payments = await db.execute({
      sql: `SELECT * FROM Payment WHERE contractId = ? ORDER BY createdAt`,
      args: [id],
    });

    // Get escrow
    const escrow = await db.execute({
      sql: `SELECT * FROM EscrowPayment WHERE contractId = ?`,
      args: [id],
    });

    // Get reviews
    const reviews = await db.execute({
      sql: `SELECT r.*, u.name as fromUserName FROM Review r JOIN User u ON r.fromUserId = u.id WHERE r.contractId = ?`,
      args: [id],
    });

    return NextResponse.json({
      contract: contract.rows[0],
      acceptance,
      payments: payments.rows,
      escrow: escrow.rows[0] || null,
      reviews: reviews.rows,
    });
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
