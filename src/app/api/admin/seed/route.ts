import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getAuthPayload } from '@/lib/auth';

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

    const existingAdmin = await User.findOne({
      email: 'admin@tesla.club',
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin already exists',
      });
    }

    const hashedPassword = await bcrypt.hash('Admin123456', 10);

    await User.create({
      name: 'Tesla Admin',
      email: 'admin@tesla.club',
      password: hashedPassword,
      role: 'Admin',
      designation: 'Admin',
      team: 'Core Team',
      status: 'active',
      isVerified: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
    });
  } catch (error) {
    console.error(error);

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