/**
 * Admin authentication utilities
 * Used to protect admin-only endpoints
 */

export function validateAdminKey(authHeader: string | null): boolean {
  if (!authHeader) return false;

  // Extract the key from "Bearer <key>" or just use the key directly
  const key = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  // In development, accept "dev-admin-key"
  if (process.env.NODE_ENV !== 'production') {
    if (key === 'dev-admin-key') return true;
  }

  // Check against environment variable
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    console.warn('[Admin Auth] ADMIN_API_KEY not configured');
    return false;
  }

  return key === adminKey;
}
