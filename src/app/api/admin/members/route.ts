import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

    const members = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: members.length,
        members
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Members Fetch Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch members'
      },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      name,
      email,
      password,
      role,
      team,
      designation,
      permissions
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, email and password are required'
        },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User already exists'
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,

      role: role || 'TeamMember',

      team: team || '',

      designation: designation || '',

      permissions: permissions || [],

      status: 'active',

      isVerified: false
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Member created successfully',
        member: newUser
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Member Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create member'
      },
      { status: 500 }
    );
  }
}