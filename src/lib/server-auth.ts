// Backwards-compatible re-export. The canonical implementation lives in
// `@/lib/auth`; this shim keeps the original `@/lib/server-auth` import path
// (used by /api/dashboard/summary) working.
export * from '@/lib/auth';
