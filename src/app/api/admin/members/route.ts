import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getAuthPayload } from '@/lib/auth';
import { TL_PERMISSION_KEYS, ACHIEVEMENT_MANAGER_PERMISSION } from '@/lib/permissions';

// Roles that may create/edit/delete/toggle members across teams.
const MEMBER_MANAGERS = ['Admin', 'President', 'OfficeBearer'];
// Roles that may change another member's role (promote/demote).
const ROLE_MANAGERS = ['Admin', 'President'];
// Accounts an OfficeBearer may NOT create, edit, deactivate, delete, or touch
// permissions on. Admin/President keep full member management.
const OB_PROTECTED_ROLES = ['Admin', 'President', 'PI'];
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
// OfficeBearer manages regular members only — Admin/President/PI accounts are off-limits.
function obBlocked(actorRole?: string | null, targetRole?: string | null) {
  return actorRole === 'OfficeBearer' && !!targetRole && OB_PROTECTED_ROLES.includes(targetRole);
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

    // An OfficeBearer can never create privileged accounts (Admin/President/PI).
    if (obBlocked(actorRole, role)) {
      return NextResponse.json(
        { success: false, message: `Office Bearers cannot create ${role} accounts.` },
        { status: 403 }
      );
    }

    // PI is a professor, not a team member — managers may create one, but it
    // never carries a team (and so never shows up in any team's member list).
    if (role === 'PI') team = '';

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    // The creator never picks the member's password: generate a secure temporary
    // one, mail it to the member, and let them change it via the existing
    // Settings → change-password flow (same pattern as the Alumni onboarding mail).
    const tempPassword = crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

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

    let emailSent = true;
    let emailError = '';
    try {
      // Gmail auth needs both vars in .env.local — CLUB_EMAIL_PASSWORD must be a
      // Google App Password (not the normal account password). Strip whitespace:
      // Google displays app passwords as "abcd efgh ijkl mnop", and a
      // Windows-edited .env.local can leave a trailing \r — both break auth.
      const smtpUser = (process.env.CLUB_EMAIL_USER || '').trim();
      const smtpPass = (process.env.CLUB_EMAIL_PASSWORD || '').replace(/\s+/g, '');
      console.log(
        '[onboard-email] 1/4 env check — CLUB_EMAIL_USER:',
        smtpUser ? `set (${smtpUser.slice(0, 2)}***${smtpUser.slice(smtpUser.indexOf('@'))})` : 'MISSING',
        '| CLUB_EMAIL_PASSWORD length:', smtpPass.length || 'MISSING'
      );
      if (!smtpUser || !smtpPass) {
        throw new Error('CLUB_EMAIL_USER and/or CLUB_EMAIL_PASSWORD are not set in .env.local');
      }
      const mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });
      // verify() opens the SMTP connection and authenticates WITHOUT sending —
      // it surfaces EAUTH / ETIMEDOUT / blocked-port errors with exact codes.
      console.log('[onboard-email] 2/4 transporter created — verifying SMTP connection/auth…');
      await mailTransporter.verify();
      console.log('[onboard-email] 3/4 SMTP verified OK — sending to:', email.trim());
      const info = await mailTransporter.sendMail({
        from: `"T.E.S.L.A Club NITP" <${process.env.CLUB_EMAIL_USER}>`,
        to: email.trim(),
        subject: '🔐 Set up your T.E.S.L.A Club account password',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 550px; margin: auto; border: 1px solid rgba(255,255,255,0.05);">
            <h2 style="color: #6366f1; margin-bottom: 4px; font-weight: 800;">Welcome to T.E.S.L.A Club!</h2>
            <p style="font-size: 12px; color: #64748b; margin-top: 0; font-weight: bold;">National Institute of Technology, Patna</p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;" />
            <p style="font-size: 14px; color: #cbd5e1;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">An account has been created for you (role: <strong>${role || 'TeamMember'}</strong>). Log in with the temporary password below and set your own password from Dashboard → Settings.</p>
            <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 12px; margin: 24px 0; font-family: 'Courier New', Courier, monospace;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #e2e8f0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0; font-size: 13px; color: #6366f1;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p style="font-size: 12px; color: #f59e0b; font-weight: 600; background-color: rgba(245,158,11,0.05); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px;">
              ⚠️ Please change this temporary password immediately after your first login.
            </p>
          </div>
        `,
      });
      // Proof the mail left the server: `accepted` must contain the recipient.
      // If it does but nothing arrives, check the recipient's SPAM folder and
      // the Gmail account's "Sent" folder — delivery, not code, is the issue.
      console.log('[onboard-email] 4/4 sendMail resolved —', {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      });
    } catch (mailErr: any) {
      emailSent = false;
      // Surface the exact SMTP failure (e.g. EAUTH "Username and Password not
      // accepted", "Missing credentials for PLAIN") instead of failing silently.
      emailError = mailErr?.message || String(mailErr);
      console.error('❌ Onboarding email FAILED (member was still created).');
      console.error('   To:', email.trim());
      console.error('   SMTP error:', emailError);
      if (mailErr?.code) console.error('   Code:', mailErr.code, mailErr.responseCode ? `(response ${mailErr.responseCode})` : '');
      if (mailErr?.response) console.error('   Server response:', mailErr.response);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Member created — a password setup email has been sent.'
        : `Member created, but the onboarding email FAILED: ${emailError}`,
      emailSent,
      ...(emailSent ? {} : { emailError }),
      member: newUser,
    }, { status: 201 });
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

    // OfficeBearer may not modify privileged accounts in ANY way — edit, status,
    // permissions, or role (updateRole below is Admin/President-only anyway).
    if (obBlocked(actorRole, target.role)) {
      return NextResponse.json(
        { success: false, message: `Office Bearers cannot modify ${target.role} accounts.` },
        { status: 403 }
      );
    }

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
      const { permissions, makeLeader, revoke, achievementManager } = body;
      if (!Array.isArray(permissions)) {
        return NextResponse.json({ success: false, message: 'permissions must be an array' }, { status: 400 });
      }
      // The Achievement Manager grant is role-INDEPENDENT — only touch it when the
      // panel explicitly sends the flag, so a Team-Leader-only save can't strip it.
      const managingAch = typeof achievementManager === 'boolean';

      // Resolve the FINAL role first — the TL feature permissions are only ever
      // valid on a Team Leader, so a Team Member can never carry them (req 3 & 4),
      // no matter what the client sends.
      let finalRole = target.role;
      if (makeLeader && finalRole !== 'TeamLeader') finalRole = 'TeamLeader';
      if (revoke && finalRole === 'TeamLeader') finalRole = 'TeamMember';
      const willBeLeader = finalRole === 'TeamLeader';

      // Keep any permission we're not actively managing here (non-TL, and the
      // achievement grant unless this request is managing it).
      const preserved = (target.permissions || []).filter(
        (p: string) => !TL_PERMISSIONS.includes(p) && !(managingAch && p === ACHIEVEMENT_MANAGER_PERMISSION)
      );
      // TL features are dropped entirely unless the member ends up a Team Leader.
      const tlGranted = willBeLeader ? permissions.filter((p: string) => TL_PERMISSIONS.includes(p)) : [];
      const next = new Set<string>([...preserved, ...tlGranted]);
      if (managingAch && achievementManager) next.add(ACHIEVEMENT_MANAGER_PERMISSION);
      target.permissions = Array.from(next);

      target.role = finalRole;

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

    const target = await User.findById(id).select('team role');
    if (!target) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });

    // OfficeBearer can never delete privileged accounts (Admin/President/PI).
    if (obBlocked(actorRole, target.role)) {
      return NextResponse.json(
        { success: false, message: `Office Bearers cannot delete ${target.role} accounts.` },
        { status: 403 }
      );
    }

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
