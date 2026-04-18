import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

/**
 * POST /api/demands/[id]/close
 * Encerra uma demanda
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: demandId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get the demand
    const demandResult = await db.execute({
      sql: `SELECT familyUserId, status FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: "Demand not found" }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Verify ownership
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update demand status to CLOSED
    await db.execute({
      sql: `
        UPDATE Demand
        SET status = 'CLOSED', closedAt = CURRENT_TIMESTAMP, closedReason = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [reason || null, demandId],
    });

    return NextResponse.json({ message: "Demanda encerrada com sucesso" });
  } catch (error) {
    console.error("[Demands API] Close error:", error);
    return NextResponse.json(
      { error: "Failed to close demand" },
      { status: 500 },
    );
  }
}
