import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { getAuthPayload } from '@/lib/auth';
import { TL_PERMISSION_KEYS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Roles that may create / edit / delete teams and manage team-leader permissions.
const TEAM_MANAGERS = ['Admin', 'President', 'OfficeBearer'];

// Restricted Team-Leader features (stored on User.permissions). Shared catalog —
// features stay LOCKED until a manager grants them from the Members panel.
const TL_PERMISSIONS = TL_PERMISSION_KEYS;

function isManager(role?: string | null) {
  return !!role && TEAM_MANAGERS.includes(role);
}

// Build the per-team stat block from the team's members.
async function buildTeamStats(teamName: string) {
  const members = await User.find({ team: teamName })
    .select('_id status')
    .lean();
  const memberIds = members.map((m: any) => m._id);
  const activeMembers = members.filter((m: any) => m.status === 'active').length;

  let blogs = 0;
  let events = 0;
  let resources = 0;

  if (memberIds.length) {
    blogs = await Blog.countDocuments({ author: { $in: memberIds } });
    events = await Event.countDocuments({ registeredUsers: { $in: memberIds } });
    const resourceDocs = await Resource.find({ 'files.uploadedBy': { $in: memberIds } })
      .select('files.uploadedBy')
      .lean();
    const idSet = new Set(memberIds.map((id: any) => id.toString()));
    resourceDocs.forEach((r: any) => {
      r.files?.forEach((f: any) => {
        if (f.uploadedBy && idSet.has(f.uploadedBy.toString())) resources++;
      });
    });
  }

  return {
    totalMembers: members.length,
    activeMembers,
    blogs,
    events,
    resources,
  };
}

async function serializeTeam(team: any) {
  const stats = await buildTeamStats(team.name);
  return {
    _id: team._id.toString(),
    name: team.name,
    description: team.description || '',
    coverImage: team.coverImage || '',
    isActive: team.isActive !== false,
    createdAt: team.createdAt,
    lead: team.lead
      ? {
          _id: team.lead._id.toString(),
          name: team.lead.name,
          email: team.lead.email,
          profileImage: team.lead.profileImage || '',
        }
      : null,
    ...stats,
  };
}

// ─── GET: list teams (scoped) with stats ──────────────────────────────────────
export async function GET() {
  try {
    const actor = await getAuthPayload();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const actorDoc: any = await User.findById(actor.userId).select('role team').lean();
    const role = actorDoc?.role;
    const canManage = isManager(role);
    const isLeader = role === 'TeamLeader';

    if (!canManage && !isLeader) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const query = canManage ? {} : { name: actorDoc?.team || '__none__' };

    const teams = await Team.find(query)
      .populate('lead', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean();

    const serialized = await Promise.all(teams.map(serializeTeam));

    return NextResponse.json({ success: true, teams: serialized }, { status: 200 });
  } catch (error: any) {
    console.error('Teams Fetch Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch teams' }, { status: 500 });
  }
}

// ─── POST: create a team ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!isManager(actor.role)) {
      return NextResponse.json({ success: false, message: 'You do not have permission to manage teams.' }, { status: 403 });
    }

    await connectDB();
    const { name, description, coverImage } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Team name is required' }, { status: 400 });
    }

    const existing = await Team.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A team with this name already exists' }, { status: 400 });
    }

    const team = await Team.create({
      name: name.trim(),
      description: (description || '').trim(),
      coverImage: (coverImage || '').trim(),
      createdBy: actor.userId,
    });

    return NextResponse.json({ success: true, message: 'Team created', team: await serializeTeam(team.toObject()) }, { status: 201 });
  } catch (error: any) {
    console.error('Create Team Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create team' }, { status: 500 });
  }
}

// ─── PATCH: edit team (name/description/cover/leader/status) ───────────────────
export async function PATCH(req: NextRequest) {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Resolve the caller from the DB (fresh role + permissions, not the JWT).
    const actorDoc: any = await User.findById(actor.userId).select('role team permissions').lean();
    const actorRole = actorDoc?.role;
    const manager = isManager(actorRole);
    // A Team Leader may edit ONLY their own team's description & cover — gated by
    // the same `team:edit` permission the Members panel grants. No new perm logic.
    const leaderCanEdit =
      actorRole === 'TeamLeader' &&
      Array.isArray(actorDoc?.permissions) &&
      actorDoc.permissions.includes('team:edit');

    if (!manager && !leaderCanEdit) {
      return NextResponse.json({ success: false, message: 'You do not have permission to manage teams.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, coverImage, lead, isActive } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Team id is required' }, { status: 400 });

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });

    // ── Team-Leader path: own team only, description & cover image only ──
    if (!manager) {
      if (!actorDoc?.team || team.name !== actorDoc.team) {
        return NextResponse.json({ success: false, message: 'You can only edit your own team.' }, { status: 403 });
      }
      if (description !== undefined) team.description = description;
      if (coverImage !== undefined) team.coverImage = coverImage; // '' clears the cover
      await team.save();
      await team.populate('lead', 'name email profileImage');
      return NextResponse.json({ success: true, message: 'Team updated', team: await serializeTeam(team.toObject()) }, { status: 200 });
    }

    const oldName = team.name;

    if (name !== undefined && name.trim() && name.trim() !== team.name) {
      const dupe = await Team.findOne({ name: name.trim(), _id: { $ne: id } });
      if (dupe) return NextResponse.json({ success: false, message: 'A team with this name already exists' }, { status: 400 });
      team.name = name.trim();
      // Keep member associations consistent (User.team stores the team name).
      await User.updateMany({ team: oldName }, { $set: { team: team.name } });
    }

    if (description !== undefined) team.description = description;
    if (coverImage !== undefined) team.coverImage = coverImage; // '' clears the cover
    if (isActive !== undefined) team.isActive = !!isActive;

    // Change Team Leader: promote the chosen member, demote the previous leader.
    if (lead !== undefined) {
      if (lead === null || lead === '') {
        if (team.lead) {
          await User.findByIdAndUpdate(team.lead, {
            $set: { role: 'TeamMember' },
            $pull: { permissions: { $in: TL_PERMISSIONS } },
          });
        }
        team.lead = null;
      } else {
        const newLead = await User.findById(lead);
        if (!newLead) return NextResponse.json({ success: false, message: 'Selected leader not found' }, { status: 404 });

        // Assigning a lead rewrites their role to TeamLeader — an OfficeBearer
        // may not demote a privileged account (Admin/President/PI) that way.
        if (actorRole === 'OfficeBearer' && ['Admin', 'President', 'PI'].includes(newLead.role)) {
          return NextResponse.json(
            { success: false, message: `Office Bearers cannot make a ${newLead.role} a team leader.` },
            { status: 403 }
          );
        }

        // Demote previous leader (if different).
        if (team.lead && String(team.lead) !== String(lead)) {
          await User.findByIdAndUpdate(team.lead, {
            $set: { role: 'TeamMember' },
            $pull: { permissions: { $in: TL_PERMISSIONS } },
          });
        }

        // Promote to Team Leader but keep restricted features LOCKED by default —
        // a manager unlocks them individually from the Members permission panel.
        newLead.role = 'TeamLeader';
        newLead.team = team.name;
        await newLead.save();
        team.lead = newLead._id;
      }
    }

    await team.save();
    await team.populate('lead', 'name email profileImage');

    return NextResponse.json({ success: true, message: 'Team updated', team: await serializeTeam(team.toObject()) }, { status: 200 });
  } catch (error: any) {
    console.error('Update Team Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update team' }, { status: 500 });
  }
}

// ─── DELETE: remove a team (only if safe — no members assigned) ────────────────
export async function DELETE(req: NextRequest) {
  try {
    const actor = await getAuthPayload();
    if (!actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!isManager(actor.role)) {
      return NextResponse.json({ success: false, message: 'You do not have permission to manage teams.' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Team id is required' }, { status: 400 });

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });

    const memberCount = await User.countDocuments({ team: team.name });
    if (memberCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete: ${memberCount} member(s) still assigned. Reassign them first.` },
        { status: 400 }
      );
    }

    await Team.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Team deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete Team Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete team' }, { status: 500 });
  }
}
