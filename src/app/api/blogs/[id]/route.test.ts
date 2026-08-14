import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_secret_for_development_only';
const userId = '507f1f77bcf86cd799439011';
const blogId = '507f1f77bcf86cd799439012';

const { blogModel, cookiesMock } = vi.hoisted(() => {
  const blogModel: any = vi.fn();
  blogModel.findById = vi.fn();
  blogModel.findOne = vi.fn();
  blogModel.findByIdAndUpdate = vi.fn();
  blogModel.findByIdAndDelete = vi.fn();

  return { blogModel, cookiesMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Blog', () => ({ Blog: blogModel }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

import { GET, PUT, DELETE } from './route';

function cookieStore(value?: string) {
  return {
    get: vi.fn((name: string) => (value ? { name, value } : undefined)),
  } as any;
}

function reqWithParams(method: string, id: string, body?: unknown): Request {
  return new Request(`http://localhost/api/blogs/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  cookiesMock.mockResolvedValue(cookieStore());
});

describe('GET /api/blogs/[id]', () => {
  const published = { _id: blogId, title: 'Post', status: 'Published' };

  it('fetches by ObjectId and increments views', async () => {
    blogModel.findById.mockResolvedValue(published);
    blogModel.findByIdAndUpdate.mockResolvedValue(null);

    const res = await GET(reqWithParams('GET', blogId), { params: Promise.resolve({ id: blogId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.blog).toEqual(published);
    expect(blogModel.findById).toHaveBeenCalledWith(blogId);
    expect(blogModel.findByIdAndUpdate).toHaveBeenCalledWith(blogId, { $inc: { views: 1 } });
  });

  it('fetches by slug when the id is not an ObjectId', async () => {
    blogModel.findOne.mockResolvedValue(published);
    blogModel.findByIdAndUpdate.mockResolvedValue(null);

    await GET(reqWithParams('GET', 'my-slug'), { params: Promise.resolve({ id: 'my-slug' }) });

    expect(blogModel.findById).not.toHaveBeenCalled();
    expect(blogModel.findOne).toHaveBeenCalledWith({ slug: 'my-slug' });
  });

  it('returns 404 when the blog does not exist', async () => {
    blogModel.findById.mockResolvedValue(null);

    const res = await GET(reqWithParams('GET', blogId), { params: Promise.resolve({ id: blogId }) });
    expect(res.status).toBe(404);
  });

  it('hides draft blogs from the public route', async () => {
    blogModel.findById.mockResolvedValue({ _id: blogId, title: 'Draft', status: 'Draft' });

    const res = await GET(reqWithParams('GET', blogId), { params: Promise.resolve({ id: blogId }) });
    expect(res.status).toBe(404);
    expect(blogModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 500 when the query fails', async () => {
    blogModel.findById.mockRejectedValue(new Error('boom'));

    const res = await GET(reqWithParams('GET', blogId), { params: Promise.resolve({ id: blogId }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('boom');
  });
});

describe('PUT /api/blogs/[id]', () => {
  it('returns 401 without a token', async () => {
    const res = await PUT(reqWithParams('PUT', blogId, { title: 'New' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    cookiesMock.mockResolvedValue(cookieStore('garbage'));

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'New' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the blog does not exist', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue(null);

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'New' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 403 when the blog belongs to someone else', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: 'someone-else' });

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'New' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 when the blog has no authorId (admin-created)', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: null });

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'New' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(403);
  });

  it('updates the blog when the caller owns it', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: userId });
    const updated = { _id: blogId, title: 'Updated' };
    blogModel.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'Updated' }), {
      params: Promise.resolve({ id: blogId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.blog).toEqual(updated);
    expect(blogModel.findByIdAndUpdate).toHaveBeenCalledWith(blogId, { title: 'Updated' }, { new: true });
  });

  it('returns 500 when the update fails', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: userId });
    blogModel.findByIdAndUpdate.mockRejectedValue(new Error('write failed'));

    const res = await PUT(reqWithParams('PUT', blogId, { title: 'Updated' }), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/blogs/[id]', () => {
  it('returns 401 without a token', async () => {
    const res = await DELETE(reqWithParams('DELETE', blogId), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the blog does not exist', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue(null);

    const res = await DELETE(reqWithParams('DELETE', blogId), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 403 when the blog belongs to someone else', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: 'someone-else' });

    const res = await DELETE(reqWithParams('DELETE', blogId), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(403);
  });

  it('deletes the blog when the caller owns it', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: userId });
    blogModel.findByIdAndDelete.mockResolvedValue({ _id: blogId });

    const res = await DELETE(reqWithParams('DELETE', blogId), {
      params: Promise.resolve({ id: blogId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(blogModel.findByIdAndDelete).toHaveBeenCalledWith(blogId);
  });

  it('returns 500 when the delete fails', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    blogModel.findById.mockResolvedValue({ _id: blogId, authorId: userId });
    blogModel.findByIdAndDelete.mockRejectedValue(new Error('write failed'));

    const res = await DELETE(reqWithParams('DELETE', blogId), {
      params: Promise.resolve({ id: blogId }),
    });
    expect(res.status).toBe(500);
  });
});
