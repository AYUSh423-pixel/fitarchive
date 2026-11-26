import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getClientKey, applyRateLimit, strictRateLimiter } from '@/lib/rate-limit';
import { logger, generateRequestId } from '@/lib/logger';

// Paths that should have stricter rate limiting
const STRICT_PATHS = [
  '/api/auth',
  '/api/ai',
  '/api/account',
];

// Paths that should be publicly accessible without auth
const PUBLIC_PATHS = [
  '/api/auth', // Auth endpoints handle their own auth
  '/_next',
  '/static',
  '/favicon.ico',
  '/manifest.json',
  '/icon-',
  '/apple-touch-icon.png',
];

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();
  const { pathname } = request.nextUrl;
  const clientKey = getClientKey(request);

  // Skip middleware for public assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Apply strict rate limiting to sensitive endpoints
  if (STRICT_PATHS.some(p => pathname.startsWith(p))) {
    const rateLimitResult = applyRateLimit(request, strictRateLimiter, clientKey);
    if (rateLimitResult && !rateLimitResult.success) {
      logger.security('Strict rate limit exceeded', { pathname, clientKey }, undefined, requestId);
      const headers = rateLimitResult.headers as Record<string, string>;
      const retryAfter = headers['Retry-After'] ?? '';
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers,
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    Object.entries(rateLimitResult?.headers || {}).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Add request ID header for tracing
  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);

  // Security: Prevent indexing of non-public pages
  if (pathname.startsWith('/api/') || pathname.startsWith('/scanner') || pathname.startsWith('/settings')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};