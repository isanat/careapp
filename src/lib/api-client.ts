/**
 * API client with automatic CSRF token handling.
 *
 * Usage:
 *   import { apiFetch } from "@/lib/api-client";
 *   const res = await apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAllAsRead: true }) });
 */

const CSRF_COOKIE_NAME = "__csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

let csrfToken: string | null = null;

/** Read the CSRF token from the signed cookie (token.signature → token). */
function readTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=")[1]);
  const dotIndex = value.indexOf(".");
  return dotIndex > 0 ? value.substring(0, dotIndex) : value;
}

/** Fetch a CSRF token from the server and cache it. */
async function ensureCsrfToken(): Promise<string> {
  // Try cookie first
  const fromCookie = readTokenFromCookie();
  if (fromCookie) {
    csrfToken = fromCookie;
    return csrfToken;
  }

  // Fetch new token from the server
  const res = await fetch("/api/csrf-token", { credentials: "same-origin" });
  const headerToken = res.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    csrfToken = headerToken;
    return csrfToken;
  }

  // Fallback: re-read cookie after fetch set it
  const afterFetch = readTokenFromCookie();
  if (afterFetch) {
    csrfToken = afterFetch;
    return csrfToken;
  }

  throw new Error("Failed to obtain CSRF token");
}

/**
 * Fetch wrapper that automatically attaches the CSRF token to mutating requests.
 * For GET/HEAD/OPTIONS requests, it behaves like a normal fetch.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = await ensureCsrfToken();
    const headers = new Headers(options.headers);
    headers.set(CSRF_HEADER_NAME, token);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    options = { ...options, headers, credentials: "same-origin" };
  }

  const response = await fetch(url, options);

  // If CSRF token was rejected, refresh it and retry once
  if (response.status === 403) {
    const body = await response.clone().json().catch(() => null);
    if (body?.error === "Invalid CSRF token") {
      csrfToken = null;
      // Clear stale cookie reference so ensureCsrfToken fetches fresh
      const token = await ensureCsrfToken();
      const headers = new Headers(options.headers);
      headers.set(CSRF_HEADER_NAME, token);
      return fetch(url, { ...options, headers, credentials: "same-origin" });
    }
  }

  return response;
}
