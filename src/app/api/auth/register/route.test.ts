import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const { userModel } = vi.hoisted(() => {
  const userModel: any = vi.fn();
  userModel.findOne = vi.fn();
  userModel.create = vi.fn();
  return { userModel };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({ User: userModel }));

import { POST } from './route';

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/auth/register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(postRequest({ name: 'A', email: 'a@b.c' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('returns 400 when the email is already registered', async () => {
    userModel.findOne.mockResolvedValue({ _id: 'existing' });

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c', password: 'pw' }));
    expect(res.status).toBe(400);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('creates a user with a valid role and a hashed password', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'new-id' });

    const res = await POST(
      postRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        rollNo: 'CS123',
        branch: 'CSE',
        year: '3',
        batch: 2026,
        team: 'Web',
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.userId).toBe('new-id');

    const [args] = userModel.create.mock.calls[0];
    expect(args.role).toBe('TeamMember');
    expect(args.designation).toBe('Junior Member');
    expect(args.status).toBe('active');
    expect(args.isVerified).toBe(false);
    expect(args.name).toBe('Test User');
    expect(args.branch).toBe('CSE');
    expect(args.batch).toBe(2026);
    expect(args.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', args.password)).toBe(true);
  });

  it('returns 500 when creation fails', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockRejectedValue(new Error('write failed'));

    const res = await POST(postRequest({ name: 'A', email: 'a@b.c', password: 'pw' }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
