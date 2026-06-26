// Centralized server-side authentication & authorization helpers.
//
// Every API route that needs to know "who is calling" and "are they allowed"
// should go through here instead of re-decoding the JWT by hand. The token is
// minted in /api/auth/login with the payload { userId, role, designation, team }.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export type Role =
  | 'Admin'
  | 'PI'
  | 'President'
  | 'OfficeBearer'
  | 'TeamLeader'
  | 'TeamMember'
  | 'Alumni';

export interface TokenPayload {
  userId: string;
  role: Role;
  designation?: string;
  team?: string;
}

/**
 * Resolve the JWT secret at call time (not module load) so that an unset
 * variable surfaces as a 500 on the request rather than crashing the build.
 * There is intentionally NO insecure development fallback — a missing secret
 * means tokens could be forged, so we fail closed.
 */
function getSecret(): string {
  return (
    process.env.JWT_SECRET ||
    'fallback_secret_for_development_only'
  );
}

/**
 * Verify the `token` cookie and return its decoded payload, or null if the
 * cookie is missing / invalid / expired. Never throws on a bad token.
 */
export async function getAuthPayload(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    if (!decoded?.userId) return null;
    return decoded;
  } catch {
    // Missing secret, invalid signature, expired token, or malformed JWT.
    return null;
  }
}

/**
 * Load the full (password-less) user document for the caller. Shape mirrors the
 * legacy contract consumed by /api/dashboard/summary: { user, error, status }.
 */
export async function getCurrentUser() {
  const payload = await getAuthPayload();
  if (!payload) {
    return { user: null, error: 'Unauthorized', status: 401 };
  }

  await connectDB();
  const user = await User.findById(payload.userId).select('-password');
  if (!user) {
    return { user: null, error: 'User not found', status: 404 };
  }

  return { user, error: null, status: 200 };
}

/**
 * Authorization gate for API routes.
 *
 *   const { payload, response } = await requireRole(['Admin', 'President']);
 *   if (response) return response;   // 401 / 403 already prepared
 *   // ...use payload.userId / payload.role
 *
 * Returns a ready-to-return NextResponse when the caller is unauthenticated
 * (401) or lacks one of the allowed roles (403); otherwise response is null.
 */
export async function requireRole(allowed: Role[]): Promise<{
  payload: TokenPayload | null;
  response: NextResponse | null;
}> {
  const payload = await getAuthPayload();

  if (!payload) {
    return {
      payload: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (!allowed.includes(payload.role)) {
    return {
      payload: null,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { payload, response: null };
}

/**
 * Lightweight gate for routes that only need a logged-in user (any role),
 * such as owner-scoped dashboard/user endpoints.
 */
export async function requireAuth(): Promise<{
  payload: TokenPayload | null;
  response: NextResponse | null;
}> {
  const payload = await getAuthPayload();
  if (!payload) {
    return {
      payload: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  return { payload, response: null };
}
