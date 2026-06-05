import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const {
      name,email,password,rollNo,branch,year,batch,team} = await req.json();

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

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,

      rollNo,
      branch,
      year,
      batch,

      team,

      role: 'General',

      designation: 'Junior Member',

      status: 'active',

      isVerified: false
    });

    return NextResponse.json({ message: 'User registered successfully', userId: newUser._id }, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
