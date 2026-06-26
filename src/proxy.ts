// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Must match process.env.JWT_SECRET used in /api/auth/login/route.ts exactly.
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const ADMIN_PANEL_ROLES = ['Admin', 'President'];

async function getRoleFromToken(token: string): Promise<string | null> {
  try {
    // jsonwebtoken (login route) and jose (here) both implement standard JWT —
    // a token signed with jwt.sign() verifies fine with jose's jwtVerify(),
    // as long as the secret and algorithm (default HS256 for both) match.
    const { payload } = await jwtVerify(token, secretKey);
    return (payload.role as string) || null;
  } catch {
    // Invalid signature, expired token, or malformed JWT.
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // ── Protect Admin Routes ──
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = await getRoleFromToken(token);
    if (!role) {
      // Token is invalid/expired — treat as logged out.
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    if (!ADMIN_PANEL_ROLES.includes(role)) {
      // Logged in, but not allowed in the admin panel — send them to their dashboard instead.
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ── Protect Dashboard Routes ──
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = await getRoleFromToken(token);
    if (!role) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};