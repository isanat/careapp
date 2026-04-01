/**
 * POST /api/qr/scan
 * Scan and validate a QR code for presence confirmation
 *
 * Authorization: CAREGIVER role
 * Rate limit: 10 scans per minute
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scanQRCode } from "@/lib/qr/qr-service";
import { checkRateLimit, getRemainingRequests } from "@/lib/qr/rate-limiter";
import { isValidQRCodeFormat } from "@/lib/qr/qr-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // Check if user is CAREGIVER role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "CAREGIVER") {
      return NextResponse.json(
        {
          error: "Apenas profissionais podem escanear códigos QR",
        },
        { status: 403 }
      );
    }

    // Check rate limit: 10 scans per minute
    const rateLimitKey = `qr:scan:${session.user.id}`;
    const remaining = getRemainingRequests(rateLimitKey, 10, 60 * 1000);

    if (remaining === 0) {
      return NextResponse.json(
        {
          error:
            "Limite de tentativas de escanear excedido. Tente novamente em 1 minuto.",
          retryAfter: 60,
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    // Check rate limit and increment
    if (!checkRateLimit(rateLimitKey, 10, 60 * 1000)) {
      return NextResponse.json(
        {
          error: "Limite de tentativas excedido",
          retryAfter: 60,
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode || typeof qrCode !== "string") {
      return NextResponse.json(
        { error: "Campo 'qrCode' é obrigatório e deve ser uma string" },
        { status: 400 }
      );
    }

    // Validate QR code format
    if (!isValidQRCodeFormat(qrCode)) {
      return NextResponse.json(
        { error: "Formato de código QR inválido" },
        { status: 400 }
      );
    }

    // Get client IP and user agent for audit trail
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Scan QR code
    const result = await scanQRCode(
      qrCode,
      session.user.id,
      ipAddress,
      userAgent
    );

    // Create notification for family
    await prisma.notification.create({
      data: {
        userId: result.contract.familyUserId,
        type: "QR_CONFIRMED",
        title: `${result.scannedByUser?.name} confirmou presença`,
        message: `${result.scannedByUser?.name} confirmou presença em ${new Date(result.scannedAt).toLocaleTimeString("pt-PT")}`,
        referenceType: "PresenceConfirmation",
        referenceId: result.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Presença confirmada por ${result.scannedByUser?.name}`,
        confirmation: {
          qrCodeId: result.id,
          contractId: result.contract.id,
          confirmedAt: result.scannedAt.toISOString(),
          confirmedBy: {
            id: result.scannedByUser?.id,
            name: result.scannedByUser?.name,
          },
          status: result.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[QR Scan] Error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro ao processar código QR";

    const statusCode =
      message.includes("expirou") ||
      message.includes("inválido") ||
      message.includes("encontrado") ||
      message.includes("já foi")
        ? 400
        : message.includes("não está autorizado")
          ? 403
          : 500;

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}
