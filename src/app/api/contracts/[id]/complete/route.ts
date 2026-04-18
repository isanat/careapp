import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { generateId } from "@/lib/utils/id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const contractResult = await db.execute({
      sql: `SELECT familyUserId, caregiverUserId, status FROM Contract WHERE id = ?`,
      args: [contractId],
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 },
      );
    }

    const contract = contractResult.rows[0];
    const isFamily = contract.familyUserId === session.user.id;
    const isCaregiver = contract.caregiverUserId === session.user.id;

    if (!isFamily && !isCaregiver) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (contract.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Apenas contratos ativos podem ser concluídos" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE Contract SET status = 'COMPLETED', completedAt = ?, updatedAt = ? WHERE id = ?`,
      args: [now, now, contractId],
    });

    // Notify the other party
    const otherUserId = isFamily
      ? contract.caregiverUserId
      : contract.familyUserId;

    const notificationId = generateId("notif");
    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
            VALUES (?, ?, 'contract_completed', 'Contrato Concluído', ?, 'contract', ?, ?)`,
      args: [
        notificationId,
        otherUserId,
        "O contrato foi marcado como concluído. Pode agora deixar uma avaliação.",
        contractId,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Contrato concluído com sucesso",
    });
  } catch (error) {
    console.error("Error completing contract:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
