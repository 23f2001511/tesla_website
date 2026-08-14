import { currentUser } from '@clerk/nextjs/server';

export interface AdminAuthResult {
  authorized: boolean;
  email?: string;
  userId?: string;
  name?: string;
  reason?: string;
}

export async function verifyAdminSession(): Promise<AdminAuthResult> {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || 'admin@tesla.club,president@tesla.club,anurag@tesla.club,admin@gmail.com';
  const allowedEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  try {
    const user = await currentUser();

    if (!user) {
      return {
        authorized: false,
        reason: 'Not authenticated with Clerk',
      };
    }

    // Get user's emails
    const userEmails = user.emailAddresses.map((e) =>
      e.emailAddress.trim().toLowerCase()
    );

    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress.toLowerCase() || userEmails[0] || '';

    // Check if any of user's emails is in the whitelist
    const isWhitelisted = userEmails.some((email) =>
      allowedEmails.includes(email)
    );

    if (!isWhitelisted) {
      return {
        authorized: false,
        email: primaryEmail,
        userId: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
        reason: `Email (${primaryEmail}) is not authorized in ADMIN_EMAILS whitelist`,
      };
    }

    return {
      authorized: true,
      email: primaryEmail,
      userId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Admin',
    };
  } catch (error: any) {
    // If Clerk is not configured with valid API keys yet, check development environment
    console.warn('verifyAdminSession notice:', error?.message || error);
    
    // In local dev without configured Clerk keys, allow fallback so developer is not locked out
    if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY.includes('placeholder')) {
      return {
        authorized: true,
        email: 'dev-admin@tesla.club',
        userId: 'dev_admin_local',
        name: 'Dev Admin (Clerk Keys Pending)',
      };
    }

    return {
      authorized: false,
      reason: error?.message || 'Authentication error',
    };
  }
}
