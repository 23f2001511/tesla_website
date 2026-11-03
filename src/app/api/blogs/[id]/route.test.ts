import { describe, it, expect, vi, beforeEach } from 'vitest';

const { blogModel, authMock } = vi.hoisted(() => {
  const blogModel: any = vi.fn();
  blogModel.findById = vi.fn();
  blogModel.findByIdAndUpdate = vi.fn();
  const authMock = {
    getAuthPayload: vi.fn(),
    requireAuth: vi.fn(),
  };
  return { blogModel, authMock };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Blog', () => ({ Blog: blogModel }));
vi.mock('@/lib/auth', () => ({
  getAuthPayload: authMock.getAuthPayload,
  requireAuth: authMock.requireAuth,
}));

import { GET } from './route';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/blogs/[id]', () => {
  it('allows unauthenticated visitors to read Published blogs', async () => {
    authMock.getAuthPayload.mockResolvedValue(null);
    blogModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'b1',
        title: 'Public Tech Article',
        status: 'Published',
        views: 10,
        author: 'u1',
      }),
    });
    blogModel.findByIdAndUpdate.mockResolvedValue({});

    const req = new Request('http://localhost/api/blogs/b1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'b1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blog.title).toBe('Public Tech Article');
    expect(blogModel.findByIdAndUpdate).toHaveBeenCalledWith('b1', { $inc: { views: 1 } });
  });

  it('blocks anonymous access to Draft blogs with 403', async () => {
    authMock.getAuthPayload.mockResolvedValue(null);
    blogModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'b2',
        title: 'Draft Post',
        status: 'Draft',
        author: 'u1',
      }),
    });

    const req = new Request('http://localhost/api/blogs/b2');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'b2' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('allows the author to read their own Draft blog', async () => {
    authMock.getAuthPayload.mockResolvedValue({ userId: 'u1', role: 'TeamMember' });
    blogModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'b2',
        title: 'Draft Post',
        status: 'Draft',
        author: 'u1',
      }),
    });

    const req = new Request('http://localhost/api/blogs/b2');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'b2' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.blog.title).toBe('Draft Post');
    // Author reading their own draft does not increment view counter
    expect(blogModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
