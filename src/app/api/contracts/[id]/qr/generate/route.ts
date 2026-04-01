/**
 * POST /api/contracts/{id}/qr/generate
 * Generate a daily QR code for presence confirmation
 *
 * Authorization: FAMILY role, must be contract owner
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { generateOrGetQRCode } from "@/lib/qr/qr-service";
import { checkRateLimit } from "@/lib/qr/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 16+)
    const { id } = await params;

    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // Check if user is FAMILY role
    const userResult = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id],
    });

    const user = userResult.rows[0] as any;

    if (user?.role !== "FAMILY") {
      return NextResponse.json(
        { error: "Apenas famílias podem gerar QR codes" },
        { status: 403 }
      );
    }

    // Check rate limit: 5 generations per hour
    const rateLimitKey = `qr:generate:${session.user.id}`;
    if (!checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          error:
            "Limite de gerações de QR excedido. Máximo 5 por hora.",
          retryAfter: 3600,
        },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Verify user is contract owner
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, status FROM Contract WHERE id = ?`,
      args: [id],
    });

    const contract = contractResult.rows[0] as any;

    if (!contract) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    if (contract.familyUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este contrato" },
        { status: 403 }
      );
    }

    // Generate or get existing QR code
    const qrData = await generateOrGetQRCode(contract.id);

    const expiresAtDate = new Date(qrData.qrExpiresAt);
    const expiresIn = Math.floor(
      (expiresAtDate.getTime() - Date.now()) / 1000
    );

    return NextResponse.json(
      {
        success: true,
        qrCodeId: qrData.id,
        qrCode: qrData.qrCode,
        expiresAt: qrData.qrExpiresAt,
        expiresIn,
        generatedAt: qrData.qrGeneratedAt,
        contractId: contract.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[QR Generate] Error:", error);

    const message =
      error instanceof Error ? error.message : "Erro ao gerar QR code";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
