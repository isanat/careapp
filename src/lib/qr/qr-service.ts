/**
 * QR Code Service
 * Business logic for presence confirmation QR codes
 */

import { prisma } from "@/lib/prisma";
import { generateQRCode, calculateQRExpiration, isQRCodeExpired } from "./qr-utils";

/**
 * Generate or retrieve today's QR code for a contract
 * Returns existing QR if valid (< 24h), otherwise creates new one
 */
export async function generateOrGetQRCode(contractId: string) {
  // Check if contract exists and has feature enabled
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      presenceConfirmationEnabled: true,
    },
  });

  if (!contract) {
    throw new Error("Contrato não encontrado");
  }

  if (!contract.presenceConfirmationEnabled) {
    throw new Error(
      "Confirmação de presença não está ativada neste contrato"
    );
  }

  if (contract.status !== "ACTIVE") {
    throw new Error(
      "Confirmação de presença só está disponível para contratos ativos"
    );
  }

  // Check for existing valid QR code
  const existingQR = await prisma.presenceConfirmation.findFirst({
    where: {
      contractId,
      status: "pending", // Not yet scanned
      qrExpiresAt: {
        gt: new Date(), // Not expired
      },
    },
    select: {
      id: true,
      qrCode: true,
      qrExpiresAt: true,
      qrGeneratedAt: true,
    },
    orderBy: {
      qrGeneratedAt: "desc",
    },
  });

  // If valid QR exists, return it (idempotent)
  if (existingQR) {
    return existingQR;
  }

  // Generate new QR code
  const qrCode = generateQRCode();
  const expiresAt = calculateQRExpiration();

  const newQR = await prisma.presenceConfirmation.create({
    data: {
      contractId,
      qrCode,
      qrExpiresAt: expiresAt,
      status: "pending",
    },
    select: {
      id: true,
      qrCode: true,
      qrExpiresAt: true,
      qrGeneratedAt: true,
    },
  });

  return newQR;
}

/**
 * Scan a QR code and record presence confirmation
 * Returns confirmation details or throws error if invalid
 */
export async function scanQRCode(
  qrCode: string,
  scannedByUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Find QR code record
  const presenceRecord = await prisma.presenceConfirmation.findUnique({
    where: { qrCode },
    include: {
      contract: {
        select: {
          id: true,
          caregiverUserId: true,
          familyUserId: true,
          status: true,
        },
      },
      scannedByUser: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // Validate QR code exists
  if (!presenceRecord) {
    throw new Error("Código QR inválido ou não encontrado");
  }

  // Validate contract is active
  if (presenceRecord.contract.status !== "ACTIVE") {
    throw new Error("Contrato não está ativo");
  }

  // Validate QR hasn't expired
  if (isQRCodeExpired(presenceRecord.qrExpiresAt)) {
    // Update status to expired
    await prisma.presenceConfirmation.update({
      where: { id: presenceRecord.id },
      data: { status: "expired" },
    });
    throw new Error("Código QR expirou");
  }

  // Validate QR hasn't been scanned yet
  if (presenceRecord.scannedAt) {
    throw new Error("Este código QR já foi utilizado");
  }

  // Validate caregiver is assigned to contract
  if (presenceRecord.contract.caregiverUserId !== scannedByUserId) {
    throw new Error(
      "Você não está autorizado a confirmar presença neste contrato"
    );
  }

  // Update presence confirmation
  const updated = await prisma.presenceConfirmation.update({
    where: { id: presenceRecord.id },
    data: {
      scannedAt: new Date(),
      scannedByUserId,
      status: "confirmed",
      ipAddress,
      userAgent,
    },
    include: {
      scannedByUser: {
        select: {
          id: true,
          name: true,
        },
      },
      contract: {
        select: {
          id: true,
          familyUserId: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Get presence confirmation history for a contract
 */
export async function getPresenceHistory(
  contractId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: string;
    from?: Date;
    to?: Date;
  } = {}
) {
  const {
    limit = 30,
    offset = 0,
    status,
    from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    to = new Date(),
  } = options;

  // Validate contract exists
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true },
  });

  if (!contract) {
    throw new Error("Contrato não encontrado");
  }

  // Build query filter
  const whereFilter: any = {
    contractId,
    qrGeneratedAt: {
      gte: from,
      lte: to,
    },
  };

  if (status && status !== "all") {
    whereFilter.status = status;
  }

  // Get total count
  const total = await prisma.presenceConfirmation.count({
    where: whereFilter,
  });

  // Get paginated history
  const history = await prisma.presenceConfirmation.findMany({
    where: whereFilter,
    select: {
      id: true,
      qrCode: true,
      qrGeneratedAt: true,
      qrExpiresAt: true,
      scannedAt: true,
      status: true,
      scannedByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      qrGeneratedAt: "desc",
    },
    take: Math.min(limit, 100), // Max 100 per request
    skip: offset,
  });

  return {
    total,
    limit,
    offset,
    history,
  };
}

/**
 * Mark expired QR codes
 * Should run as a scheduled job (e.g., daily)
 */
export async function markExpiredQRCodes() {
  const updated = await prisma.presenceConfirmation.updateMany({
    where: {
      status: "pending",
      qrExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "expired",
    },
  });

  return updated.count;
}
