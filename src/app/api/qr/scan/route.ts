/**
 * POST /api/qr/scan
 * Scan and validate a QR code for presence confirmation
 *
 * Authorization: CAREGIVER role
 * Rate limit: 10 scans per minute
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
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
    const userResult = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id],
    });

    const user = userResult.rows[0] as any;

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
    const notificationId = Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    const notificationTime = new Date().toISOString();
    const scanTimeDate = typeof result.scannedAt === "string"
      ? new Date(result.scannedAt)
      : result.scannedAt;
    const scanTime = scanTimeDate.toLocaleTimeString("pt-PT");

    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        notificationId,
        result.contract.familyUserId,
        "QR_CONFIRMED",
        `${result.scannedByUser?.name} confirmou presença`,
        `${result.scannedByUser?.name} confirmou presença em ${scanTime}`,
        "PresenceConfirmation",
        result.id,
        notificationTime,
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: `Presença confirmada por ${result.scannedByUser?.name}`,
        confirmation: {
          qrCodeId: result.id,
          contractId: result.contract.id,
          confirmedAt: result.scannedAt,
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
