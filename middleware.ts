import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Bypass CSRF protection for sync-turso endpoint
  // This endpoint uses token-based auth which is CSRF-safe
  if (request.nextUrl.pathname === '/api/admin/sync-turso') {
    const response = NextResponse.next();
    // Add header to bypass CSRF checks
    response.headers.set('x-csrf-bypass', 'sync-turso');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/sync-turso'],
};
