import { randomUUID } from "crypto";

/**
 * Generate a unique ID with an optional prefix.
 * Uses crypto.randomUUID() for collision-resistant, non-predictable IDs.
 */
export function generateId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
