import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  teamMemberModel,
  eventModel,
  flagshipModel,
  blogModel,
  galleryModel,
  resourceModel,
  achievementModel,
  alumniModel,
  settingsModel,
  adminAuthMock,
} = vi.hoisted(() => {
  const mk = () => {
    const m: any = vi.fn();
    m.deleteMany = vi.fn();
    m.insertMany = vi.fn();
    m.create = vi.fn();
    return m;
  };

  return {
    teamMemberModel: mk(),
    eventModel: mk(),
    flagshipModel: mk(),
    blogModel: mk(),
    galleryModel: mk(),
    resourceModel: mk(),
    achievementModel: mk(),
    alumniModel: mk(),
    settingsModel: mk(),
    adminAuthMock: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/adminAuth', () => ({ verifyAdminSession: adminAuthMock }));
vi.mock('@/models/TeamMember', () => ({ TeamMember: teamMemberModel }));
vi.mock('@/models/Event', () => ({ Event: eventModel }));
vi.mock('@/models/FlagshipEvent', () => ({ FlagshipEvent: flagshipModel }));
vi.mock('@/models/Blog', () => ({ Blog: blogModel }));
vi.mock('@/models/GalleryItem', () => ({ GalleryItem: galleryModel }));
vi.mock('@/models/Resource', () => ({ Resource: resourceModel }));
vi.mock('@/models/Achievement', () => ({ Achievement: achievementModel }));
vi.mock('@/models/Alumni', () => ({ Alumni: alumniModel }));
vi.mock('@/models/SiteSettings', () => ({ SiteSettings: settingsModel }));

import { POST, GET } from './route';

function authorized() {
  adminAuthMock.mockResolvedValue({ authorized: true, email: 'admin@tesla.club' });
}

function unauthorized() {
  adminAuthMock.mockResolvedValue({ authorized: false, reason: 'Not allowed' });
}

const allModels = [
  teamMemberModel,
  eventModel,
  flagshipModel,
  blogModel,
  galleryModel,
  resourceModel,
  achievementModel,
  alumniModel,
  settingsModel,
];

beforeEach(() => {
  vi.resetAllMocks();
  allModels.forEach((m: any) => {
    m.deleteMany.mockResolvedValue(undefined);
    m.insertMany.mockResolvedValue([{}]);
    m.create.mockResolvedValue({});
  });
});

describe('POST /api/admin/seed', () => {
  it('returns 401 when the admin session is not authorized', async () => {
    unauthorized();

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    teamMemberModel.deleteMany.mock.calls.forEach(() => {
      throw new Error('models should not be touched when unauthorized');
    });
  });

  it('wipes and reseeds every collection', async () => {
    authorized();

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    for (const m of allModels) {
      expect(m.deleteMany).toHaveBeenCalledWith({});
    }

    expect(teamMemberModel.insertMany).toHaveBeenCalled();
    expect(eventModel.insertMany).toHaveBeenCalled();
    expect(blogModel.insertMany).toHaveBeenCalled();
    expect(galleryModel.insertMany).toHaveBeenCalled();
    expect(resourceModel.insertMany).toHaveBeenCalled();
    expect(achievementModel.insertMany).toHaveBeenCalled();
    expect(alumniModel.insertMany).toHaveBeenCalled();
    expect(flagshipModel.create).toHaveBeenCalled();
    expect(settingsModel.create).toHaveBeenCalled();
  });

  it('seeds at least one event, blog and flagship track', async () => {
    authorized();

    await POST();

    const events = eventModel.insertMany.mock.calls[0][0];
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('title');

    const blogs = blogModel.insertMany.mock.calls[0][0];
    expect(blogs.length).toBeGreaterThan(0);
    expect(blogs[0]).toHaveProperty('slug');

    const flagship = flagshipModel.create.mock.calls[0][0];
    expect(flagship.tracks.length).toBeGreaterThan(0);
  });

  it('returns 500 when a collection wipe fails', async () => {
    authorized();
    teamMemberModel.deleteMany.mockRejectedValue(new Error('db down'));

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('db down');
  });
});

describe('GET /api/admin/seed', () => {
  it('also triggers the seed as a convenience', async () => {
    authorized();

    const res = await GET();
    expect(res.status).toBe(200);
    expect(teamMemberModel.deleteMany).toHaveBeenCalled();
  });
});
