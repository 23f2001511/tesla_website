import { describe, it, expect, vi, beforeEach } from 'vitest';

const { userModel, teamModel, eventModel, adminAuthMock } = vi.hoisted(() => {
  const userModel: any = vi.fn();
  userModel.countDocuments = vi.fn();

  const teamModel: any = vi.fn();
  teamModel.countDocuments = vi.fn();

  const eventModel: any = vi.fn();
  eventModel.countDocuments = vi.fn();

  return { userModel, teamModel, eventModel, adminAuthMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/adminAuth', () => ({ verifyAdminSession: adminAuthMock }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('@/models/Team', () => ({ Team: teamModel }));
vi.mock('@/models/Event', () => ({ Event: eventModel }));

import { GET } from './route';

function authorized() {
  adminAuthMock.mockResolvedValue({ authorized: true, email: 'admin@tesla.club' });
}

function unauthorized() {
  adminAuthMock.mockResolvedValue({ authorized: false, reason: 'Not allowed' });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/admin/dashboard', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(userModel.countDocuments).not.toHaveBeenCalled();
  });

  it('returns member, team and upcoming event stats', async () => {
    authorized();
    userModel.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
    teamModel.countDocuments.mockResolvedValue(3);
    eventModel.countDocuments.mockResolvedValue(2);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats).toEqual({
      totalMembers: 10,
      activeMembers: 5,
      totalTeams: 3,
      upcomingEvents: 2,
    });
    expect(userModel.countDocuments).toHaveBeenNthCalledWith(1);
    expect(userModel.countDocuments).toHaveBeenNthCalledWith(2, { status: 'active' });
    expect(eventModel.countDocuments).toHaveBeenCalledWith({ status: 'upcoming' });
  });

  it('returns 500 when a count query fails', async () => {
    authorized();
    userModel.countDocuments.mockRejectedValue(new Error('boom'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
