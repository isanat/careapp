import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/app", "/admin"];

// Routes that require ADMIN role
const ADMIN_ROUTES = ["/admin"];

// Public routes (no auth required)
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/api/auth",
  "/api/register",
  "/api/webhooks",
  "/api/payments/activation",
  "/api/kyc/webhook",
  "/legal",
  "/terms",
  "/privacy",
];

// API routes exempt from CSRF validation
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
  "/api/migrate/",
];

const CSRF_COOKIE_NAME = "__csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Double-submit cookie CSRF validation.
 * Compares the token from the cookie (before the signature dot) with the header value.
 */
function validateCsrf(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  // Cookie is signed as "token.signature" — extract the token part
  const dotIndex = cookieValue.indexOf(".");
  const cookieToken = dotIndex > 0 ? cookieValue.substring(0, dotIndex) : cookieValue;

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  return cookieToken.length > 0 && cookieToken === headerToken;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // CSRF validation for non-GET API requests
  if (
    pathname.startsWith("/api/") &&
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS" &&
    !isCsrfExempt(pathname)
  ) {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role for admin routes
    if (isAdminRoute(pathname) && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes handled elsewhere
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
