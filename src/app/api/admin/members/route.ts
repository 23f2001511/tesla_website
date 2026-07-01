import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getAuthPayload } from '@/lib/auth';
import { TL_PERMISSION_KEYS } from '@/lib/permissions';

// Roles that may create/edit/delete/toggle members across teams.
const MEMBER_MANAGERS = ['Admin', 'President', 'OfficeBearer'];
// Roles that may change another member's role (promote/demote).
const ROLE_MANAGERS = ['Admin', 'President'];
// Restricted Team-Leader features (stored on User.permissions). Locked until granted.
// Single source of truth shared with the teams API and the Team-Leader dashboard.
const TL_PERMISSIONS = TL_PERMISSION_KEYS;

function canManageMembers(role?: string | null) {
  return !!role && MEMBER_MANAGERS.includes(role);
}
function canManageRoles(role?: string | null) {
  return !!role && ROLE_MANAGERS.includes(role);
}
function hasPerm(doc: any, perm: string) {
  return Array.isArray(doc?.permissions) && doc.permissions.includes(perm);
}

// ─── GET: list members (scoped for Team Leaders) ──────────────────────────────
export async function GET() {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const actorDoc: any = await User.findById(actor.userId).select('role team').lean();
    const role = actorDoc?.role;
    const isLeader = role === 'TeamLeader';

    if (!canManageMembers(role) && !isLeader) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Team Leaders only ever see their own team's members.
    const query = isLeader ? { team: actorDoc?.team || '__none__' } : {};

    const members = await User.find(query).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: members.length, members }, { status: 200 });
  } catch (error) {
    console.error('Members Fetch Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch members' }, { status: 500 });
  }
}

// ─── POST: create a member ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const actorDoc: any = await User.findById(actor.userId).select('role team permissions').lean();
    const actorRole = actorDoc?.role;

    const body = await req.json();
    let { role, team } = body;
    const { name, email, password, designation, permissions } = body;

    const isManager = canManageMembers(actorRole);
    const isScopedLeader = actorRole === 'TeamLeader' && hasPerm(actorDoc, 'members:create');

    if (!isManager && !isScopedLeader) {
      return NextResponse.json({ success: false, message: 'You do not have permission to add members.' }, { status: 403 });
    }

    // A Team Leader can only ever add a plain member to their OWN team.
    if (!isManager && isScopedLeader) {
      team = actorDoc?.team || '';
      role = 'TeamMember';
    }

    // PI can never be assigned from the dashboard.
    if (role === 'PI') {
      return NextResponse.json({ success: false, message: 'Members cannot be assigned the PI role.' }, { status: 400 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'TeamMember',
      team: team || '',
      designation: designation || '',
      permissions: isManager ? (permissions || []) : [],
      status: 'active',
      isVerified: false,
    });

    return NextResponse.json({ success: true, message: 'Member created successfully', member: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create Member Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create member' }, { status: 500 });
  }
}

// ─── PATCH: updateRole | updateDetails | toggleStatus | setPermissions ─────────
// The actor's identity/role is taken from the verified JWT, never the request body.
export async function PATCH(req: Request) {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const actorDoc: any = await User.findById(actor.userId).select('role team permissions').lean();
    const actorRole = actorDoc?.role;
    const actorId = actor.userId;

    const body = await req.json();
    const { id, action, role } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Member id is required' }, { status: 400 });

    const target = await User.findById(id);
    if (!target) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });

    const isManager = canManageMembers(actorRole);
    const isLeader = actorRole === 'TeamLeader';
    const leaderOwnsTarget = isLeader && actorDoc?.team && target.team === actorDoc.team;

    // ── Promote / demote (change role) — managers only, never to PI ──
    if (action === 'updateRole') {
      if (!canManageRoles(actorRole)) {
        return NextResponse.json({ success: false, message: 'You do not have permission to change roles.' }, { status: 403 });
      }
      const validRoles = ['Admin', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'];
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ success: false, message: 'A valid role is required' }, { status: 400 });
      }
      if (role === 'PI') {
        return NextResponse.json({ success: false, message: 'Members cannot be promoted to PI.' }, { status: 400 });
      }
      if (actorId && String(actorId) === String(id) && actorRole === 'Admin' && role !== 'Admin') {
        return NextResponse.json({ success: false, message: 'You cannot change your own Admin role.' }, { status: 400 });
      }

      target.role = role;
      if (role !== 'Alumni' && target.status === 'alumni') target.status = 'active';
      if (role === 'Alumni') target.status = 'alumni';
      // Demoting out of TeamLeader strips the restricted features.
      if (role !== 'TeamLeader') {
        target.permissions = (target.permissions || []).filter((p: string) => !TL_PERMISSIONS.includes(p));
      }

      await target.save();
      return NextResponse.json({ success: true, message: `${target.name} is now ${role}.`, member: target }, { status: 200 });
    }

    // ── Grant / revoke Team-Leader permissions & lock/unlock features ──
    // body: { id, action: 'setPermissions', permissions: string[], makeLeader?: boolean, revoke?: boolean }
    if (action === 'setPermissions') {
      if (!isManager) {
        return NextResponse.json({ success: false, message: 'You do not have permission to manage permissions.' }, { status: 403 });
      }
      const { permissions, makeLeader, revoke } = body;
      if (!Array.isArray(permissions)) {
        return NextResponse.json({ success: false, message: 'permissions must be an array' }, { status: 400 });
      }
      // Keep any non-TL permissions intact; only the TL feature set is managed here.
      const preserved = (target.permissions || []).filter((p: string) => !TL_PERMISSIONS.includes(p));
      const tlGranted = permissions.filter((p: string) => TL_PERMISSIONS.includes(p));
      target.permissions = Array.from(new Set([...preserved, ...tlGranted]));

      if (makeLeader && target.role !== 'TeamLeader') target.role = 'TeamLeader';
      if (revoke && target.role === 'TeamLeader') target.role = 'TeamMember';

      await target.save();
      return NextResponse.json({ success: true, message: 'Permissions updated.', member: target }, { status: 200 });
    }

    // ── Edit name / team / designation ──
    if (action === 'updateDetails') {
      if (!isManager && !(isLeader && hasPerm(actorDoc, 'team:edit') && leaderOwnsTarget)) {
        return NextResponse.json({ success: false, message: 'You do not have permission to edit this member.' }, { status: 403 });
      }
      const { name, team, designation } = body;
      if (name !== undefined) target.name = name;
      // Team Leaders can never move a member into a different team.
      if (team !== undefined && isManager) target.team = team;
      if (designation !== undefined) target.designation = designation;

      await target.save();
      return NextResponse.json({ success: true, message: 'Member details updated.', member: target }, { status: 200 });
    }

    // ── Toggle active / inactive ──
    if (action === 'toggleStatus') {
      if (!isManager && !(isLeader && hasPerm(actorDoc, 'team:edit') && leaderOwnsTarget)) {
        return NextResponse.json({ success: false, message: 'You do not have permission to change this member.' }, { status: 403 });
      }
      if (actorId && String(actorId) === String(id)) {
        return NextResponse.json({ success: false, message: 'You cannot change your own status.' }, { status: 400 });
      }
      target.status = target.status === 'inactive' ? 'active' : 'inactive';
      await target.save();
      return NextResponse.json({ success: true, message: `${target.name} is now ${target.status}.`, member: target }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Update Member Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update member' }, { status: 500 });
  }
}

// ─── DELETE: remove a member ──────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const actorDoc: any = await User.findById(actor.userId).select('role team permissions').lean();
    const actorRole = actorDoc?.role;
    const actorId = actor.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Member id is required' }, { status: 400 });

    const target = await User.findById(id).select('team');
    if (!target) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });

    const isManager = canManageMembers(actorRole);
    const leaderCanRemove =
      actorRole === 'TeamLeader' &&
      hasPerm(actorDoc, 'members:delete') &&
      actorDoc?.team &&
      target.team === actorDoc.team;

    if (!isManager && !leaderCanRemove) {
      return NextResponse.json({ success: false, message: 'You do not have permission to remove this member.' }, { status: 403 });
    }

    if (actorId && actorId === id) {
      return NextResponse.json({ success: false, message: 'You cannot delete your own account.' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Member removed.' }, { status: 200 });
  } catch (error) {
    console.error('Delete Member Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete member' }, { status: 500 });
  }
}
