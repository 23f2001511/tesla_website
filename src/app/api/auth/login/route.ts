import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getErrorDetails } from '@/lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide email and password' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        designation: user.designation,
        team: user.team,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      message: 'Logged in successfully',
      role: user.role,
      designation: user.designation,
      team: user.team,
      mustChangePassword: user.mustChangePassword === true,
    });

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error){
    console.error('Login Error:', error);
    const details = getErrorDetails(error);

    // Mongo unreachable / wrong URI → 503 with a hint instead of opaque 500.
    if (details.name === 'MongooseServerSelectionError' || /ECONNREFUSED|ServerSelection/i.test(details.message || '')) {
      return NextResponse.json(
        { error: 'Database unavailable. Make sure MongoDB is running and MONGODB_URI is correct.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
