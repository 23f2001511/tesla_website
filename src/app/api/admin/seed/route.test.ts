import { describe, it, expect, vi, beforeEach } from 'vitest';

const { userModel, authMock } = vi.hoisted(() => {
  const userModel: any = vi.fn();
  userModel.exists = vi.fn();
  userModel.findOne = vi.fn();
  userModel.create = vi.fn();
  const authMock = {
    getAuthPayload: vi.fn(),
  };
  return { userModel, authMock };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('@/lib/auth', () => ({ getAuthPayload: authMock.getAuthPayload }));

import { GET } from './route';

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.ADMIN_SEED_PASSWORD;
});

describe('GET /api/admin/seed', () => {
  it('blocks anonymous access when an Admin already exists', async () => {
    userModel.exists.mockResolvedValue(true);
    authMock.getAuthPayload.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toMatch(/only an admin/i);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('fails closed in production if ADMIN_SEED_PASSWORD is unset', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    userModel.exists.mockResolvedValue(false);
    userModel.findOne.mockResolvedValue(null);

    try {
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.message).toMatch(/ADMIN_SEED_PASSWORD/);
      expect(userModel.create).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('seeds admin successfully when no admin exists in development', async () => {
    userModel.exists.mockResolvedValue(false);
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'admin-id', email: 'admin@tesla.club' });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(userModel.create).toHaveBeenCalled();
  });
});
