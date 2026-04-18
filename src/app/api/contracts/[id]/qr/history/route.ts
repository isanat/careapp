/**
 * GET /api/contracts/{id}/qr/history
 * Get presence confirmation history for a contract
 *
 * Query Parameters:
 * - limit: number (default 30, max 100)
 * - offset: number (default 0)
 * - status: string (pending | confirmed | expired | all)
 * - from: ISO date
 * - to: ISO date
 *
 * Authorization: FAMILY (owner) or CAREGIVER (assigned)
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { getPresenceHistory } from "@/lib/qr/qr-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await params (Next.js 16+)
    const { id } = await params;

    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 },
      );
    }

    // Verify contract exists and user has access
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId FROM Contract WHERE id = ?`,
      args: [id],
    });

    const contract = contractResult.rows[0] as any;

    if (!contract) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 },
      );
    }

    // Check authorization: must be family owner or assigned caregiver
    const isOwner = contract.familyUserId === session.user.id;
    const isAssignedCaregiver = contract.caregiverUserId === session.user.id;

    if (!isOwner && !isAssignedCaregiver) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este contrato" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "30", 10),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const status = searchParams.get("status") || "all";

    let from: Date | undefined;
    let to: Date | undefined;

    const fromParam = searchParams.get("from");
    if (fromParam) {
      from = new Date(fromParam);
      if (isNaN(from.getTime())) from = undefined;
    }

    const toParam = searchParams.get("to");
    if (toParam) {
      to = new Date(toParam);
      if (isNaN(to.getTime())) to = undefined;
    }

    // Get history
    const historyData = await getPresenceHistory(contract.id, {
      limit,
      offset,
      status: status === "all" ? undefined : status,
      from,
      to,
    });

    // Format response
    const formattedHistory = historyData.history.map((item) => ({
      qrCodeId: item.id,
      qrCode: item.qrCode,
      generatedAt: item.qrGeneratedAt.toISOString(),
      expiresAt: item.qrExpiresAt.toISOString(),
      status: item.status,
      scannedAt: item.scannedAt ? item.scannedAt.toISOString() : null,
      scannedBy: item.scannedByUser
        ? {
            id: item.scannedByUser.id,
            name: item.scannedByUser.name,
          }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        contractId: contract.id,
        total: historyData.total,
        limit: historyData.limit,
        offset: historyData.offset,
        history: formattedHistory,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[QR History] Error:", error);

    const message =
      error instanceof Error ? error.message : "Erro ao buscar histórico";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
