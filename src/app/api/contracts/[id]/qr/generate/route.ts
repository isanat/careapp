/**
 * POST /api/contracts/{id}/qr/generate
 * Generate a daily QR code for presence confirmation
 *
 * Authorization: FAMILY role, must be contract owner
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrGetQRCode } from "@/lib/qr/qr-service";
import { checkRateLimit } from "@/lib/qr/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { formatQRCodeResponse } from "@/lib/qr/qr-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // Check if user is FAMILY role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

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
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        familyUserId: true,
        status: true,
      },
    });

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

    return NextResponse.json(
      {
        success: true,
        qrCodeId: qrData.id,
        qrCode: qrData.qrCode,
        expiresAt: qrData.qrExpiresAt.toISOString(),
        expiresIn: Math.floor(
          (qrData.qrExpiresAt.getTime() - Date.now()) / 1000
        ),
        generatedAt: qrData.qrGeneratedAt.toISOString(),
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
