// ─── Team-Leader feature permissions ─────────────────────────────────────────
// Single source of truth for the restricted Team-Leader features. The keys use
// the existing `feature:action` convention already checked by the Team-Leader
// dashboard (src/app/dashboard/members/team/page.tsx). Granting a key here both
// unlocks the matching dashboard button and authorises the backend action, so we
// never fork into a second permission system.
export const TL_PERMISSIONS = [
  { key: 'members:create', label: 'Add Team Member' },
  { key: 'members:delete', label: 'Remove Team Member' },
  { key: 'team:edit',      label: 'Edit Team Information' },
] as const;

// Plain array of the permission keys — handy for `$in`, `.includes`, filtering.
export const TL_PERMISSION_KEYS: string[] = TL_PERMISSIONS.map((p) => p.key);

// ─── Achievement Manager permission ──────────────────────────────────────────
// A single, role-INDEPENDENT permission (same `feature:action` convention, same
// User.permissions store — NOT a second permission system). It can be granted to
// any member (TeamLeader or TeamMember) and survives role changes, unlike the
// Team-Leader features above which are stripped when someone leaves TeamLeader.
export const ACHIEVEMENT_MANAGER_PERMISSION = 'achievements:manage';

export const ACHIEVEMENT_MANAGER = {
  key: ACHIEVEMENT_MANAGER_PERMISSION,
  label: 'Achievement Manager',
} as const;

// Every permission an Admin/President/OfficeBearer may grant/revoke from the
// Members panel. Used by the setPermissions API to know which keys it owns.
export const GRANTABLE_PERMISSION_KEYS: string[] = [
  ...TL_PERMISSION_KEYS,
  ACHIEVEMENT_MANAGER_PERMISSION,
];

// Helper — does a user (or JWT-loaded doc) hold the Achievement Manager grant?
export function isAchievementManager(permissions?: string[] | null): boolean {
  return Array.isArray(permissions) && permissions.includes(ACHIEVEMENT_MANAGER_PERMISSION);
}
