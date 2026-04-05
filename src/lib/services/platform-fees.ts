/**
 * Platform Fees Service
 *
 * Manages dynamic platform fee calculations from PlatformSettings database
 * All fees are fetched from the database at runtime - no hardcoded values
 */

import { db } from '@/lib/db-turso';

// Default fallback values if database unavailable (should rarely happen)
const DEFAULTS = {
  platformFeePercent: 10,      // 10% - caregiver pays this, gets 90%
  activationCostEurCents: 3500, // €35
  contractFeeEurCents: 500,     // €5
};

interface PlatformSettings {
  platformFeePercent: number;
  activationCostEurCents: number;
  contractFeeEurCents: number;
}

let cachedSettings: PlatformSettings | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch platform settings from database with caching
 */
async function getPlatformSettings(): Promise<PlatformSettings> {
  const now = Date.now();

  // Return cached value if fresh
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedSettings;
  }

  try {
    const result = await db.execute({
      sql: `SELECT platformFeePercent, activationCostEurCents, contractFeeEurCents
            FROM PlatformSettings
            LIMIT 1`,
      args: []
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      cachedSettings = {
        platformFeePercent: Number(row.platformFeePercent) || DEFAULTS.platformFeePercent,
        activationCostEurCents: Number(row.activationCostEurCents) || DEFAULTS.activationCostEurCents,
        contractFeeEurCents: Number(row.contractFeeEurCents) || DEFAULTS.contractFeeEurCents,
      };
    } else {
      cachedSettings = DEFAULTS;
    }

    lastFetchTime = now;
    return cachedSettings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return cachedSettings || DEFAULTS;
  }
}

/**
 * Clear cache (useful after admin updates fees)
 */
export function clearPlatformSettingsCache(): void {
  cachedSettings = null;
  lastFetchTime = 0;
}

/**
 * Get platform fee percentage (what caregiver pays, gets rest)
 * @returns Platform fee as percentage (e.g., 10 for 10%)
 */
export async function getPlatformFeePercent(): Promise<number> {
  const settings = await getPlatformSettings();
  return settings.platformFeePercent;
}

/**
 * Get activation cost in euros cents
 */
export async function getActivationCostCents(): Promise<number> {
  const settings = await getPlatformSettings();
  return settings.activationCostEurCents;
}

/**
 * Get contract fee in euros cents
 */
export async function getContractFeeCents(): Promise<number> {
  const settings = await getPlatformSettings();
  return settings.contractFeeEurCents;
}

/**
 * Calculate platform fee amount from total
 * @param totalCents Total amount in cents
 * @param feePercent Optional fee percent override (defaults to database value)
 * @returns Platform fee amount in cents
 */
export async function calculatePlatformFee(
  totalCents: number,
  feePercent?: number
): Promise<number> {
  const percent = feePercent ?? await getPlatformFeePercent();
  return Math.round(totalCents * percent / 100);
}

/**
 * Calculate caregiver amount (total minus platform fee)
 * @param totalCents Total amount in cents
 * @param feePercent Optional fee percent override
 * @returns Amount caregiver receives in cents
 */
export async function calculateCaregiverAmount(
  totalCents: number,
  feePercent?: number
): Promise<number> {
  const platformFee = await calculatePlatformFee(totalCents, feePercent);
  return totalCents - platformFee;
}

/**
 * Get all platform settings at once
 */
export async function getPlatformSettingsAll(): Promise<PlatformSettings> {
  return getPlatformSettings();
}

/**
 * Format fee percentage for display (e.g., "10%" or "15%")
 */
export function formatFeePercentage(percent: number): string {
  return `${percent}%`;
}

/**
 * Get caregiver earnings percentage (100 - platform fee)
 * @param platformFeePercent Platform fee percentage
 * @returns Percentage caregiver earns
 */
export function getCaregiverEarningsPercent(platformFeePercent: number): number {
  return 100 - platformFeePercent;
}
