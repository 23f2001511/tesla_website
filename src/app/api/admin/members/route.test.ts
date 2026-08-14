import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const { userModel, adminAuthMock } = vi.hoisted(() => {
  const userModel: any = vi.fn();
  userModel.find = vi.fn();
  userModel.findOne = vi.fn();
  userModel.create = vi.fn();

  return { userModel, adminAuthMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('@/lib/adminAuth', () => ({ verifyAdminSession: adminAuthMock }));

import { GET, POST } from './route';

function chained(result: any) {
  const p: any = Promise.resolve(result);
  p.sort = vi.fn(() => p);
  p.select = vi.fn(() => p);
  return p;
}

function authorized() {
  adminAuthMock.mockResolvedValue({
    authorized: true,
    email: 'admin@tesla.club',
    name: 'Admin',
  });
}

function unauthorized() {
  adminAuthMock.mockResolvedValue({ authorized: false, reason: 'Not allowed' });
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/admin/members', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(userModel.find).not.toHaveBeenCalled();
  });

  it('returns all members without passwords', async () => {
    authorized();
    const members = [{ _id: '1', name: 'A' }, { _id: '2', name: 'B' }];
    userModel.find.mockReturnValue(chained(members));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(data.members).toEqual(members);
    expect(userModel.find).toHaveBeenCalledWith({});
  });

  it('returns 500 when the query fails', async () => {
    authorized();
    userModel.find.mockReturnValue(chained([]));
    const p: any = Promise.reject(new Error('boom'));
    p.select = vi.fn(() => p);
    p.sort = vi.fn(() => p);
    userModel.find.mockReturnValue(p);

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/members', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c', password: 'pw' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    authorized();

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toMatch(/required/);
  });

  it('returns 400 when the email is already registered', async () => {
    authorized();
    userModel.findOne.mockResolvedValue({ _id: 'existing' });

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c', password: 'pw' }));
    expect(res.status).toBe(400);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('creates a member with a hashed password and defaults', async () => {
    authorized();
    userModel.findOne.mockResolvedValue(null);
    const created = { _id: 'new-id', name: 'A' };
    userModel.create.mockResolvedValue(created);

    const res = await POST(
      postRequest({ name: 'A', email: 'a@b.c', password: 'secret123' })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.member).toEqual(created);

    const [args] = userModel.create.mock.calls[0];
    expect(args.role).toBe('TeamMember');
    expect(args.team).toBe('');
    expect(args.status).toBe('active');
    expect(args.isVerified).toBe(false);
    expect(args.password).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', args.password)).toBe(true);
  });

  it('honours explicit role, team, designation and permissions', async () => {
    authorized();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({});

    await POST(
      postRequest({
        name: 'A',
        email: 'a@b.c',
        password: 'pw',
        role: 'President',
        team: 'Core',
        designation: 'Lead',
        permissions: ['blogs:write'],
      })
    );

    const [args] = userModel.create.mock.calls[0];
    expect(args.role).toBe('President');
    expect(args.team).toBe('Core');
    expect(args.designation).toBe('Lead');
    expect(args.permissions).toEqual(['blogs:write']);
  });

  it('returns 500 when creation fails', async () => {
    authorized();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockRejectedValue(new Error('write failed'));

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c', password: 'pw' }));
    expect(res.status).toBe(500);
  });
});
