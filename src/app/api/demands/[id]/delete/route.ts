import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

/**
 * DELETE /api/demands/[id]
 * Soft delete: marca demanda como deletada mas mantém histórico
 */
export async function DELETE(
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
    const { reason } = body || {};

    // Get the demand
    const demandResult = await db.execute({
      sql: `SELECT familyUserId, deletedAt FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: "Demand not found" }, { status: 404 });
    }

    const demand = demandResult.rows[0] as any;

    // Verify ownership
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already deleted
    if (demand.deletedAt) {
      return NextResponse.json(
        { error: "Demand already deleted" },
        { status: 400 },
      );
    }

    // Soft delete: set deletedAt and deletionReason
    await db.execute({
      sql: `
        UPDATE Demand
        SET deletedAt = CURRENT_TIMESTAMP, deletionReason = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [reason || null, demandId],
    });

    return NextResponse.json({ message: "Demanda deletada com sucesso" });
  } catch (error) {
    console.error("[Demands API] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete demand" },
      { status: 500 },
    );
  }
}
