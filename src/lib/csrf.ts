import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "__csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token and sign it with the app secret.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Create a signed CSRF cookie value.
 */
function signToken(token: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(token);
  return `${token}.${hmac.digest("hex")}`;
}

/**
 * Verify a signed CSRF cookie value.
 */
function verifySignedToken(signedToken: string, secret: string): string | null {
  const parts = signedToken.split(".");
  if (parts.length !== 2) return null;

  const [token, signature] = parts;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(token);
  const expectedSignature = hmac.digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  return token;
}

/**
 * Set a CSRF token cookie on the response and return the token.
 */
export function setCsrfCookie(response: NextResponse): string {
  const secret = process.env.NEXTAUTH_SECRET || "dev-secret";
  const token = generateCsrfToken();
  const signedValue = signToken(token, secret);

  response.cookies.set(CSRF_COOKIE_NAME, signedValue, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Validate CSRF token from request header against cookie.
 * Returns true if valid, false if invalid.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const secret = process.env.NEXTAUTH_SECRET || "dev-secret";

  const cookieValue = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const cookieToken = verifySignedToken(cookieValue, secret);
  if (!cookieToken) return false;

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  if (cookieToken.length !== headerToken.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

// Routes exempt from CSRF validation
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/",
  "/api/register",
  "/api/webhooks/",
  "/api/kyc/webhook",
  "/api/contact",
  "/api/csrf-token",
  "/api/caregivers",
  "/api/health",
  "/api/diagnostic",
  "/api/push/",
];

/**
 * Check if a route is exempt from CSRF validation.
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
