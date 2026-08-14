import { describe, it, expect, vi, beforeEach } from 'vitest';

const memberId = '507f1f77bcf86cd799439011';

const { userModel, adminAuthMock } = vi.hoisted(() => {
  const userModel: any = vi.fn();
  userModel.findByIdAndUpdate = vi.fn();
  userModel.findByIdAndDelete = vi.fn();

  return { userModel, adminAuthMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('@/lib/adminAuth', () => ({ verifyAdminSession: adminAuthMock }));

import { PUT, DELETE } from './route';

function chained(result: any) {
  const p: any = Promise.resolve(result);
  p.select = vi.fn(() => p);
  return p;
}

function authorized() {
  adminAuthMock.mockResolvedValue({ authorized: true, email: 'admin@tesla.club' });
}

function unauthorized() {
  adminAuthMock.mockResolvedValue({ authorized: false, reason: 'Not allowed' });
}

function reqWithParams(method: string, body?: unknown): Request {
  return new Request(`http://localhost/api/admin/members/${memberId}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PUT /api/admin/members/[id]', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await PUT(reqWithParams('PUT', { role: 'President' }), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the member does not exist', async () => {
    authorized();
    userModel.findByIdAndUpdate.mockReturnValue(chained(null));

    const res = await PUT(reqWithParams('PUT', { role: 'President' }), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(404);
  });

  it('updates the member and hides the password', async () => {
    authorized();
    const updated = { _id: memberId, name: 'A', role: 'President' };
    userModel.findByIdAndUpdate.mockReturnValue(chained(updated));

    const res = await PUT(reqWithParams('PUT', { role: 'President' }), {
      params: Promise.resolve({ id: memberId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.member).toEqual(updated);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      memberId,
      { role: 'President' },
      { new: true }
    );
  });

  it('returns 500 when the update fails', async () => {
    authorized();
    const p: any = Promise.reject(new Error('boom'));
    p.select = vi.fn(() => p);
    userModel.findByIdAndUpdate.mockReturnValue(p);

    const res = await PUT(reqWithParams('PUT', { role: 'President' }), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/members/[id]', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await DELETE(reqWithParams('DELETE'), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the member does not exist', async () => {
    authorized();
    userModel.findByIdAndDelete.mockResolvedValue(null);

    const res = await DELETE(reqWithParams('DELETE'), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(404);
  });

  it('deletes the member', async () => {
    authorized();
    userModel.findByIdAndDelete.mockResolvedValue({ _id: memberId });

    const res = await DELETE(reqWithParams('DELETE'), {
      params: Promise.resolve({ id: memberId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(memberId);
  });

  it('returns 500 when the delete fails', async () => {
    authorized();
    userModel.findByIdAndDelete.mockRejectedValue(new Error('boom'));

    const res = await DELETE(reqWithParams('DELETE'), {
      params: Promise.resolve({ id: memberId }),
    });
    expect(res.status).toBe(500);
  });
});
