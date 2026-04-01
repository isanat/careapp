/**
 * QR Code Utilities
 * Helper functions for QR code generation, validation, and formatting
 */

import { randomBytes } from "crypto";

/**
 * Generate a random QR code token
 * Format: EVY-{16 random chars}
 */
export function generateQRCode(): string {
  // Generate 16 random bytes
  const randomHex = randomBytes(8).toString("hex");
  // Format: EVY-{timestamp-based-segment}{random}
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  const random = randomHex.slice(0, 12).toUpperCase();
  return `EVY-${timestamp}${random}`;
}

/**
 * Validate QR code format
 * Must be EVY-{16 chars}
 */
export function isValidQRCodeFormat(qrCode: string): boolean {
  if (!qrCode) return false;
  const regex = /^EVY-[A-Z0-9]{16}$/;
  return regex.test(qrCode);
}

/**
 * Calculate QR code expiration (24 hours from now)
 */
export function calculateQRExpiration(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}

/**
 * Check if QR code is expired
 */
export function isQRCodeExpired(expiresAt: Date | string): boolean {
  const expDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expDate < new Date();
}

/**
 * Format QR code response for API
 */
export function formatQRCodeResponse(qrCode: string, expiresAt: Date) {
  return {
    qrCode,
    expiresAt: expiresAt.toISOString(),
    expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000), // seconds
  };
}
