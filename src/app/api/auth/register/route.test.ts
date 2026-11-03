import { describe, it, expect, vi, beforeEach } from 'vitest';

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

    const res = await POST(
      postRequest({ name: 'A', email: 'a@b.c', password: 'secretpassword' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/already exists/);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('creates user with TeamMember role on success', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      _id: 'new-id',
      name: 'Tesla User',
      email: 'user@tesla.club',
      role: 'TeamMember',
    });

    const res = await POST(
      postRequest({ name: 'Tesla User', email: 'user@tesla.club', password: 'secretpassword' })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toMatch(/registered successfully/i);
    expect(userModel.create).toHaveBeenCalled();
  });
});
