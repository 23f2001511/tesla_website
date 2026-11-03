// Temporary verification script — seeds two throwaway users, exercises the
// OfficeBearer restrictions end-to-end against the local dev server, then
// cleans up. Run: node scripts/verify-ob-permissions.mjs
import fs from 'node:fs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const BASE = 'http://localhost:3000';

await mongoose.connect(env.MONGODB_URI);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

const stamp = 'ob-verify-' + Math.random().toString(36).slice(2, 8);
const ob = await User.create({ name: 'TMP OB', email: `${stamp}-ob@test.local`, password: 'x', role: 'OfficeBearer', status: 'active', permissions: [] });
const admin = await User.create({ name: 'TMP Admin', email: `${stamp}-admin@test.local`, password: 'x', role: 'Admin', status: 'active', permissions: [] });
const member = await User.create({ name: 'TMP Member', email: `${stamp}-member@test.local`, password: 'x', role: 'TeamMember', status: 'active', team: '', permissions: [] });

const token = jwt.sign({ userId: ob._id.toString(), role: 'OfficeBearer' }, env.JWT_SECRET, { expiresIn: '10m' });
const adminToken = jwt.sign({ userId: admin._id.toString(), role: 'Admin' }, env.JWT_SECRET, { expiresIn: '10m' });

async function call(desc, expect, path, opts = {}, tok = token) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Cookie: `token=${tok}`, ...(opts.headers || {}) },
  });
  let body = {};
  try { body = await res.json(); } catch {}
  const ok = res.status === expect;
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${res.status} want ${expect}] ${desc}  — ${body.message || body.error || ''}`);
  return ok;
}

let pass = 0, total = 0;
const t = async (...a) => { total++; if (await call(...a)) pass++; };

console.log('\n── OfficeBearer CANNOT ──');
await t('create Admin account', 403, '/api/admin/members', { method: 'POST', body: JSON.stringify({ name: 'X', email: `${stamp}-x@test.local`, role: 'Admin' }) });
await t('create PI account', 403, '/api/admin/members', { method: 'POST', body: JSON.stringify({ name: 'X', email: `${stamp}-y@test.local`, role: 'PI' }) });
await t('promote member to Admin (updateRole)', 403, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: member._id, action: 'updateRole', role: 'Admin' }) });
await t('edit Admin details', 403, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: admin._id, action: 'updateDetails', name: 'Hacked' }) });
await t('toggle Admin status', 403, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: admin._id, action: 'toggleStatus' }) });
await t('set permissions on Admin', 403, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: admin._id, action: 'setPermissions', permissions: [], makeLeader: true }) });
await t('delete Admin account', 403, `/api/admin/members?id=${admin._id}`, { method: 'DELETE' });
await t('convert Admin to Alumni', 403, '/api/admin/alumni', { method: 'POST', body: JSON.stringify({ mode: 'convert', userId: admin._id }) });
await t('delete Admin via alumni panel', 403, `/api/admin/alumni?id=${admin._id}`, { method: 'DELETE' });

console.log('\n── OfficeBearer CAN ──');
await t('list members', 200, '/api/admin/members');
await t('list teams', 200, '/api/admin/teams');
await t('view analytics (overview)', 200, '/api/admin/overview');
await t('view analytics (dashboard stats)', 200, '/api/admin/dashboard');
await t('list alumni', 200, '/api/admin/alumni');
await t('edit regular member details', 200, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: member._id, action: 'updateDetails', designation: 'Verified' }) });
await t('delete regular member', 200, `/api/admin/members?id=${member._id}`, { method: 'DELETE' });

console.log('\n── Admin still unrestricted ──');
await t('Admin edits Admin details', 200, '/api/admin/members', { method: 'PATCH', body: JSON.stringify({ id: admin._id, action: 'updateDetails', name: 'TMP Admin' }) }, adminToken);
await t('Admin views overview', 200, '/api/admin/overview', {}, adminToken);

await User.deleteMany({ email: new RegExp(`^${stamp}-`) });
await mongoose.disconnect();
console.log(`\n${pass}/${total} checks passed. Temp users cleaned up.`);
process.exit(pass === total ? 0 : 1);
