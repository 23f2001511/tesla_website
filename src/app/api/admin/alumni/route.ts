import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Alumni records contain personal contact data and account creation — manage as admins only.
const ALUMNI_MANAGERS = ['Admin', 'President'] as const;

// Nodemailer config using SMTP configurations env values
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CLUB_EMAIL_USER,    // Apni official club email ID .env.local me dalein
    pass: process.env.CLUB_EMAIL_PASSWORD // Google Account App Password token dalein
  }
});

// ─── GET: Fetch Alumni Feed & Manage Convertables ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...ALUMNI_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const search = searchParams.get('search') || '';

    // 1. Agar mode 'convertable' hai toh un members ko dhoondo jo abhi alumni nahi hain
    if (mode === 'convertable') {
      const queryFilter: Record<string, any> = {
        role: { $ne: 'Alumni' },
        status: { $ne: 'alumni' }
      };

      if (search) {
        queryFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const potentialMembers = await User.find(queryFilter).limit(10).lean();
      
      return NextResponse.json({
        success: true,
        members: potentialMembers.map((m: any) => ({
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          branch: m.branch || '',
          batch: m.batch || null,
          designation: m.designation || '',
          role: m.role || 'TeamMember'
        }))
      });
    }

    // 2. Default: Saare verified alumni network profiles fetch karo directory grid ke liye
    const alumniList = await User.find({
      $or: [
        { role: 'Alumni' },
        { status: 'alumni' }
      ]
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      alumni: alumniList.map((a: any) => ({
        id: a._id.toString(),
        name: a.name,
        email: a.email,
        branch: a.branch || '',
        batch: a.batch || null,
        graduationYear: a.graduationYear || null,
        company: a.company || '',
        currentRole: a.currentRole || '',
        location: a.location || '',
        bio: a.bio || '',
        skills: a.skills || [],
        achievements: a.achievements || [],
        projects: a.projects || [],
        portfolio: a.portfolio || '',
        linkedin: a.socialLinks?.linkedin || '',
        github: a.socialLinks?.github || '',
        isVerified: a.isVerified || false,
        createdAt: a.createdAt
      }))
    });
  } catch (error: any) {
    console.error('ALUMNI API GET ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST: Ingest/Create New Alumnus & Dispatch Secure Mail ────────────────
export async function POST(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...ALUMNI_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const { mode, userId, name, email, password, branch, company, currentRole, graduationYear, location, linkedin } = body;

    // A. FLOW 1: Convert existing user to Alumni status
    if (mode === 'convert') {
      if (!userId) return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            role: 'Alumni',
            status: 'alumni',
            company,
            currentRole,
            graduationYear: Number(graduationYear) || null,
            location,
            isVerified: true
          }
        },
        { new: true }
      );

      if (!updatedUser) return NextResponse.json({ success: false, error: 'User mapping mismatch' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    // B. FLOW 2: Fresh entry setup (Add new passout from scratch) + Email Trigger
    if (mode === 'create') {
      if (!name || !email || !password || !company || !currentRole) {
        return NextResponse.json({ success: false, error: 'Mandatory configuration details missing.' }, { status: 400 });
      }

      const duplicateUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (duplicateUser) {
        return NextResponse.json({ success: false, error: 'This email is already active in database indexes.' }, { status: 400 });
      }

      // 1. Hash the admin defined clean password
      const encryptedPassword = await bcrypt.hash(password, 12);

      // 2. Insert absolute dynamic user object row
      await User.create({
        name,
        email: email.toLowerCase().trim(),
        password: encryptedPassword,
        role: 'Alumni',
        status: 'alumni',
        branch: branch || '',
        company,
        currentRole,
        graduationYear: Number(graduationYear) || null,
        location: location || '',
        isVerified: true,
        socialLinks: {
          linkedin: linkedin || '',
          github: '',
          instagram: ''
        }
      });

      // 3. Render and broadcast email template framework
      const htmlEmailContent = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-w: 550px; margin: auto; border: 1px solid rgba(255,255,255,0.05);">
          <h2 style="color: #6366f1; margin-bottom: 4px; font-weight: 800;">Welcome to T.E.S.L.A Alumni Network!</h2>
          <p style="font-size: 12px; color: #64748b; margin-top: 0; font-weight: bold; uppercase tracking-wider;">National Institute of Technology, Patna</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;" />
          <p style="font-size: 14px; color: #cbd5e1;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Our club administrator has successfully registered your professional alumni portfolio into the dynamic core matrix catalog. Use these secure credentials to complete your login onboarding mapping:</p>
          
          <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 12px; margin: 24px 0; font-family: 'Courier New', Courier, monospace;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;"><strong>Username:</strong> ${email}</p>
            <p style="margin: 0; font-size: 13px; color: #6366f1;"><strong>Temporary Passkey:</strong> ${password}</p>
          </div>

          <p style="font-size: 12px; color: #f59e0b; font-weight: 600; background-color: rgba(245,158,11,0.05); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px;">
            ⚠️ Action Required: Ensure you change your access key immediately upon first authentication inside profile dashboard settings configurations.
          </p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
          <p style="font-size: 11px; text-align: center; color: #475569; font-weight: 500;">Automated Credential Broadcast Matrix • T.E.S.L.A Club NIT Patna</p>
        </div>
      `;

      try {
        await mailTransporter.sendMail({
          from: `"T.E.S.L.A Club NITP" <${process.env.CLUB_EMAIL_USER}>`,
          to: email.trim(),
          subject: '🔒 Security Credentials: Your Alumnus Portfolio Account is Active',
          html: htmlEmailContent
        });
      } catch (mailErr) {
        console.warn('Mailing dispatch pipeline failed but user node created.', mailErr);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid Mode operation context flag' }, { status: 400 });
  } catch (error: any) {
    console.error('ALUMNI API POST ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Purge Alumnus Record / Revert Status ────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...ALUMNI_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID is missing' }, { status: 400 });

    // Individual absolute deletion purging execution bounds
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}