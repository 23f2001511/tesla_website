import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getAuthPayload, requireRole } from '@/lib/auth';

// Roles that may promote/demote/delete other members.
// Mirrors the same pattern used for alumni management.
const MEMBER_MANAGERS = ['Admin', 'President'];

function canManageMembers(role: string | null | undefined) {
  return !!role && MEMBER_MANAGERS.includes(role);
}

// PI has one narrow extra power: promote a member directly to OfficeBearer.
// This does NOT grant edit/delete/status-toggle on members in general.
function canPromoteToOfficeBearer(actorRole: string | null | undefined, targetRole: string) {
  return actorRole === 'PI' && targetRole === 'OfficeBearer';
}

export async function GET() {
  try {
    const { response: authError } = await requireRole(['Admin', 'President']);
    if (authError) return authError;

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
    const { response: authError } = await requireRole(['Admin', 'President']);
    if (authError) return authError;

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

// ─── PATCH: promote/demote, edit details, or toggle active status ────────────
// body: { id, action: 'updateRole' | 'updateDetails' | 'toggleStatus', ...fields }
// The actor's identity/role is taken from the verified JWT, never the request body.
export async function PATCH(req: Request) {
  try {
    const actor = await getAuthPayload();
    if (!actor) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const actorRole = actor.role;
    const actorId = actor.userId;

    await connectDB();

    const body = await req.json();
    const { id, action, role } = body;

    const isStandardManager = canManageMembers(actorRole);
    const isPIPromotion = action === 'updateRole' && canPromoteToOfficeBearer(actorRole, role);

    if (!isStandardManager && !isPIPromotion) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to manage members.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Member id is required' },
        { status: 400 }
      );
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // ── Promote / demote (change role) ──
    if (action === 'updateRole') {
      const validRoles = ['Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'];

      if (!role || !validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, message: 'A valid role is required' },
          { status: 400 }
        );
      }

      // PI's permission is narrow: only ever allowed to set role -> OfficeBearer.
      if (actorRole === 'PI' && role !== 'OfficeBearer') {
        return NextResponse.json(
          { success: false, message: 'PI can only promote members to Office Bearer.' },
          { status: 403 }
        );
      }

      // Guard: don't let an Admin accidentally strip their own Admin role and lock themselves out.
      if (actorId && String(actorId) === String(id) && actorRole === 'Admin' && role !== 'Admin') {
        return NextResponse.json(
          { success: false, message: 'You cannot change your own Admin role.' },
          { status: 400 }
        );
      }

      target.role = role;
      // Keep status consistent: promoting out of Alumni should restore active status.
      if (role !== 'Alumni' && target.status === 'alumni') target.status = 'active';
      if (role === 'Alumni') target.status = 'alumni';

      await target.save();

      return NextResponse.json(
        { success: true, message: `${target.name} is now ${role}.`, member: target },
        { status: 200 }
      );
    }

    // ── Edit name / team / designation ──
    if (action === 'updateDetails') {
      const { name, team, designation } = body;
      if (name !== undefined) target.name = name;
      if (team !== undefined) target.team = team;
      if (designation !== undefined) target.designation = designation;

      await target.save();

      return NextResponse.json(
        { success: true, message: 'Member details updated.', member: target },
        { status: 200 }
      );
    }

    // ── Toggle active / inactive ──
    if (action === 'toggleStatus') {
      if (actorId && String(actorId) === String(id)) {
        return NextResponse.json(
          { success: false, message: 'You cannot change your own status.' },
          { status: 400 }
        );
      }

      target.status = target.status === 'inactive' ? 'active' : 'inactive';
      await target.save();

      return NextResponse.json(
        { success: true, message: `${target.name} is now ${target.status}.`, member: target },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update Member Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// ─── DELETE: remove a member entirely ─────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const actor = await getAuthPayload();
    if (!actor) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const actorRole = actor.role;
    const actorId = actor.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!canManageMembers(actorRole)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to manage members.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Member id is required' },
        { status: 400 }
      );
    }

    if (actorId && actorId === id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Member removed.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete Member Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete member' },
      { status: 500 }
    );
  }
}