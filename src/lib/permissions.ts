// ─── Team-Leader feature permissions ─────────────────────────────────────────
// Single source of truth for the restricted Team-Leader features. The keys use
// the existing `feature:action` convention already checked by the Team-Leader
// dashboard (src/app/dashboard/members/team/page.tsx). Granting a key here both
// unlocks the matching dashboard button and authorises the backend action, so we
// never fork into a second permission system.
export const TL_PERMISSIONS = [
  { key: 'members:create',    label: 'Add Team Member' },
  { key: 'members:delete',    label: 'Remove Team Member' },
  { key: 'blogs:publish',     label: 'Publish Blogs' },
  { key: 'resources:upload',  label: 'Upload Resources' },
  { key: 'resources:approve', label: 'Approve Resources' },
  { key: 'events:create',     label: 'Create Events' },
  { key: 'team:edit',         label: 'Edit Team Information' },
] as const;

// Plain array of the permission keys — handy for `$in`, `.includes`, filtering.
export const TL_PERMISSION_KEYS: string[] = TL_PERMISSIONS.map((p) => p.key);
