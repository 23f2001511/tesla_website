import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getAuthPayload } from '@/lib/auth';
import { getErrorDetails } from '@/lib/errors';

// ── Bootstrap admin credentials ─────────────────────────────────────────────
// Only used to seed the very first Admin (so an Admin can then log in and
// onboard the rest of the team via /admin/members). On a populated DB the route
// is auth-gated and only re-asserts "Admin already exists".
const SEED_ADMIN_EMAIL = 'admin@tesla.club';
const SEED_ADMIN_NAME = 'Tesla Admin';
// Pulled from ADMIN_SEED_PASSWORD env when set, otherwise the dev fallback.
// In production, set ADMIN_SEED_PASSWORD to a strong unique string BEFORE the
// first call to this route, then change the password through the admin panel
// (or directly in MongoDB) immediately afterwards.
const SEED_ADMIN_PASSWORD =
  process.env.ADMIN_SEED_PASSWORD || 'Admin123456';

export async function GET() {
  try {
    await connectDB();

    // Bootstrap-only: with zero Admin accounts the route may run unauthenticated
    // (first install). Once any Admin exists, only an Admin may re-run it — an
    // OfficeBearer (or anonymous caller) must never be able to (re)create an
    // Admin account this way.
    const adminExists = await User.exists({ role: 'Admin' });
    if (adminExists) {
      const payload = await getAuthPayload();
      if (payload?.role !== 'Admin') {
        return NextResponse.json(
          { success: false, message: 'Forbidden: only an Admin can run the seed.' },
          { status: 403 }
        );
      }
    }

    const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin already exists',
      });
    }

    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'ADMIN_SEED_PASSWORD environment variable must be set in production to seed the initial Admin.' },
        { status: 500 }
      );
    }
    const finalPassword = seedPassword || 'Admin123456';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    await User.create({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'Admin',
      designation: 'Admin',
      team: 'Core Team',
      status: 'active',
      isVerified: true,
    });

    // Log to server console only — never echo the password back over HTTP.
    console.log(
      `[seed] Bootstrap Admin "${SEED_ADMIN_EMAIL}" created. ` +
      `Default password in use: ${SEED_ADMIN_PASSWORD === 'Admin123456' ? 'dev fallback (Admin123456)' : 'from ADMIN_SEED_PASSWORD env'}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
    });
  } catch (error){
    console.error('Seed error:', error);
    const details = getErrorDetails(error);

    // Mongo not reachable — surface that explicitly so the operator knows to
    // start mongod / check MONGODB_URI, instead of seeing a generic 500.
    if (details.name === 'MongooseServerSelectionError' || /ECONNREFUSED|ServerSelection/i.test(details.message || '')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database unavailable. Make sure MongoDB is running and MONGODB_URI is correct.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create admin',
      },
      {
        status: 500,
      }
    );
  }
}