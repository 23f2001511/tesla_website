import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

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