/**
 * QR Code Service
 * Business logic for presence confirmation QR codes
 * Uses libsql/turso for database operations
 */

import { db } from "@/lib/db-turso";
import { generateQRCode, calculateQRExpiration, isQRCodeExpired } from "./qr-utils";

interface PresenceConfirmation {
  id: string;
  contractId: string;
  qrCode: string;
  qrGeneratedAt: string;
  qrExpiresAt: string;
  scannedAt: string | null;
  scannedByUserId: string | null;
  status: string;
}

interface QRCodeResponse {
  id: string;
  qrCode: string;
  qrExpiresAt: string;
  qrGeneratedAt: string;
}

/**
 * Generate or retrieve today's QR code for a contract
 * Returns existing QR if valid (< 24h), otherwise creates new one
 */
export async function generateOrGetQRCode(contractId: string): Promise<QRCodeResponse> {
  // Check if contract exists and has feature enabled
  const contractResult = await db.execute({
    sql: `SELECT id, status, presenceConfirmationEnabled FROM Contract WHERE id = ?`,
    args: [contractId],
  });

  const contract = contractResult.rows[0] as any;

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

  // Check for existing valid QR code (not scanned, not expired)
  const now = new Date().toISOString();
  const existingResult = await db.execute({
    sql: `SELECT id, qrCode, qrExpiresAt, qrGeneratedAt FROM PresenceConfirmation
           WHERE contractId = ? AND status = 'pending' AND qrExpiresAt > ?
           ORDER BY qrGeneratedAt DESC LIMIT 1`,
    args: [contractId, now],
  });

  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0] as any;
    return {
      id: existing.id,
      qrCode: existing.qrCode,
      qrExpiresAt: existing.qrExpiresAt,
      qrGeneratedAt: existing.qrGeneratedAt,
    };
  }

  // Generate new QR code
  const qrCode = generateQRCode();
  const expiresAt = calculateQRExpiration().toISOString();
  const generatedAt = new Date().toISOString();

  // Generate ID (match Prisma's default cuid() behavior)
  const id = Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

  const insertResult = await db.execute({
    sql: `INSERT INTO PresenceConfirmation (id, contractId, qrCode, qrGeneratedAt, qrExpiresAt, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
    args: [id, contractId, qrCode, generatedAt, expiresAt],
  });

  return {
    id,
    qrCode,
    qrExpiresAt: expiresAt,
    qrGeneratedAt: generatedAt,
  };
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
  // Find QR code record with contract details
  const presenceResult = await db.execute({
    sql: `SELECT pc.id, pc.contractId, pc.status, pc.qrExpiresAt, pc.scannedAt,
           c.status as contractStatus, c.caregiverUserId, c.familyUserId,
           u.id as scannedByUserIdCheck, u.name as scannedByUserName
           FROM PresenceConfirmation pc
           JOIN Contract c ON pc.contractId = c.id
           LEFT JOIN User u ON pc.scannedByUserId = u.id
           WHERE pc.qrCode = ?`,
    args: [qrCode],
  });

  if (presenceResult.rows.length === 0) {
    throw new Error("Código QR inválido ou não encontrado");
  }

  const presenceRecord = presenceResult.rows[0] as any;

  // Validate contract is active
  if (presenceRecord.contractStatus !== "ACTIVE") {
    throw new Error("Contrato não está ativo");
  }

  // Validate QR hasn't expired
  const now = new Date();
  const expiresAt = new Date(presenceRecord.qrExpiresAt);
  if (now > expiresAt) {
    // Update status to expired
    await db.execute({
      sql: `UPDATE PresenceConfirmation SET status = 'expired' WHERE id = ?`,
      args: [presenceRecord.id],
    });
    throw new Error("Código QR expirou");
  }

  // Validate QR hasn't been scanned yet
  if (presenceRecord.scannedAt) {
    throw new Error("Este código QR já foi utilizado");
  }

  // Validate caregiver is assigned to contract
  if (presenceRecord.caregiverUserId !== scannedByUserId) {
    throw new Error(
      "Você não está autorizado a confirmar presença neste contrato"
    );
  }

  // Update presence confirmation
  const scanTimeIso = new Date().toISOString();
  await db.execute({
    sql: `UPDATE PresenceConfirmation
           SET scannedAt = ?, scannedByUserId = ?, status = 'confirmed', ipAddress = ?, userAgent = ?
           WHERE id = ?`,
    args: [scanTimeIso, scannedByUserId, ipAddress || null, userAgent || null, presenceRecord.id],
  });

  // Get user name for response
  const userResult = await db.execute({
    sql: `SELECT id, name FROM User WHERE id = ?`,
    args: [scannedByUserId],
  });

  const user = userResult.rows[0] as any;

  return {
    id: presenceRecord.id,
    contractId: presenceRecord.contractId,
    scannedAt: scanTimeIso,
    scannedByUser: {
      id: scannedByUserId,
      name: user?.name || "Profissional",
    },
    contract: {
      id: presenceRecord.contractId,
      familyUserId: presenceRecord.familyUserId,
    },
    status: "confirmed",
  };
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
  const contractResult = await db.execute({
    sql: `SELECT id FROM Contract WHERE id = ?`,
    args: [contractId],
  });

  if (contractResult.rows.length === 0) {
    throw new Error("Contrato não encontrado");
  }

  // Build query filter
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const statusCondition = status && status !== "all" ? `AND status = '${status}'` : "";

  // Get total count
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as total FROM PresenceConfirmation
           WHERE contractId = ? AND qrGeneratedAt >= ? AND qrGeneratedAt <= ? ${statusCondition}`,
    args: [contractId, fromIso, toIso],
  });

  const total = (countResult.rows[0] as any)?.total || 0;

  // Get paginated history
  const historyResult = await db.execute({
    sql: `SELECT pc.id, pc.qrCode, pc.qrGeneratedAt, pc.qrExpiresAt, pc.scannedAt, pc.status,
           u.id as scannedByUserId, u.name as scannedByUserName
           FROM PresenceConfirmation pc
           LEFT JOIN User u ON pc.scannedByUserId = u.id
           WHERE pc.contractId = ? AND pc.qrGeneratedAt >= ? AND pc.qrGeneratedAt <= ? ${statusCondition}
           ORDER BY pc.qrGeneratedAt DESC
           LIMIT ? OFFSET ?`,
    args: [
      contractId,
      fromIso,
      toIso,
      Math.min(limit, 100).toString(),
      offset.toString(),
    ],
  });

  const history = historyResult.rows.map((row: any) => ({
    id: row.id,
    qrCode: row.qrCode,
    qrGeneratedAt: row.qrGeneratedAt,
    qrExpiresAt: row.qrExpiresAt,
    scannedAt: row.scannedAt,
    status: row.status,
    scannedByUser: row.scannedByUserId
      ? {
          id: row.scannedByUserId,
          name: row.scannedByUserName,
        }
      : null,
  }));

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
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `UPDATE PresenceConfirmation
           SET status = 'expired'
           WHERE status = 'pending' AND qrExpiresAt < ?`,
    args: [now],
  });

  return result.rowsAffected || 0;
}
