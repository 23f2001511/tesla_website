import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow unauthorized notice page and public auth routes without redirect loops
  if (
    pathname.startsWith('/admin/unauthorized') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  ) {
    return NextResponse.next();
  }

  // Check for Clerk session client cookie or standard auth
  const clerkClientToken =
    request.cookies.get('__client_uat')?.value ||
    request.cookies.get('__session')?.value;

  const hasClerkKeys = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder')
  );

  // If in production/configured with Clerk, redirect unauthenticated users to /sign-in
  if (hasClerkKeys && pathname.startsWith('/admin')) {
    if (!clerkClientToken) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
