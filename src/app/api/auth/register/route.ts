import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getErrorDetails } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const {
      name, email, password, rollNo, branch, year, batch, team,
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // NOTE: The User schema's `role` enum is
    //   ['Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni']
    // — there is no 'General'. New self-registrations must come in as 'TeamMember'
    // (admin/president/etc. are assigned later via /admin/members).
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,

      rollNo,
      branch,
      year,
      batch,

      team,

      role: 'TeamMember',

      designation: 'Junior Member',

      status: 'active',

      isVerified: false,
    });

    return NextResponse.json(
      { message: 'User registered successfully', userId: newUser._id },
      { status: 201 }
    );
  } catch (error){
    console.error('Registration Error:', error);
    const details = getErrorDetails(error);

    // Surface Mongoose validation errors with field-level detail so the client
    // (and the server logs) can see *why* the request was rejected — instead of
    // a blanket 500 that hides the real problem.
    if (details.name === 'ValidationError') {
      const fieldErrors = details.errors || {};
      const fields = Object.keys(fieldErrors).reduce<Record<string, string>>((acc, key) => {
        acc[key] = fieldErrors[key]?.message || 'invalid';
        return acc;
      }, {});
      return NextResponse.json(
        { error: 'Validation failed', fields },
        { status: 400 }
      );
    }

    // Mongo not reachable, etc.
    if (details.name === 'MongooseServerSelectionError' || /ECONNREFUSED|ServerSelection/i.test(details.message || '')) {
      return NextResponse.json(
        { error: 'Database unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
