import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_secret_for_development_only';
const userId = '507f1f77bcf86cd799439011';

const { blogModel, userModel, cookiesMock } = vi.hoisted(() => {
  const blogModel: any = vi.fn();
  blogModel.find = vi.fn();
  blogModel.create = vi.fn();

  const userModel: any = vi.fn();
  userModel.findById = vi.fn();

  return { blogModel, userModel, cookiesMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Blog', () => ({ Blog: blogModel }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

import { GET, POST } from './route';

function chained(result: any) {
  const p: any = Promise.resolve(result);
  p.sort = vi.fn(() => p);
  p.select = vi.fn(() => p);
  return p;
}

function chainedReject(err: Error) {
  const p: any = Promise.reject(err);
  p.sort = vi.fn(() => p);
  p.select = vi.fn(() => p);
  return p;
}

function cookieStore(value?: string) {
  return {
    get: vi.fn((name: string) => (value ? { name, value } : undefined)),
  } as any;
}

function getRequest(url = 'http://localhost/api/blogs'): Request {
  return new Request(url);
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  cookiesMock.mockResolvedValue(cookieStore());
});

describe('GET /api/blogs', () => {
  it('returns published blogs with no filters', async () => {
    const blogs = [{ _id: '1', title: 'Hello' }];
    blogModel.find.mockReturnValue(chained(blogs));

    const res = await GET(getRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true, blogs });
    expect(blogModel.find).toHaveBeenCalledWith({ status: 'Published' });
  });

  it('filters by category when provided (not "all")', async () => {
    blogModel.find.mockReturnValue(chained([]));

    await GET(getRequest('http://localhost/api/blogs?category=WEB'));

    expect(blogModel.find).toHaveBeenCalledWith({ status: 'Published', category: 'WEB' });
  });

  it('ignores category when it equals "all"', async () => {
    blogModel.find.mockReturnValue(chained([]));

    await GET(getRequest('http://localhost/api/blogs?category=all'));

    expect(blogModel.find).toHaveBeenCalledWith({ status: 'Published' });
  });

  it('builds an $or regex query when searching', async () => {
    blogModel.find.mockReturnValue(chained([]));

    await GET(getRequest('http://localhost/api/blogs?search=next'));

    const [query] = blogModel.find.mock.calls[0];
    expect(query.status).toBe('Published');
    expect(query.$or).toHaveLength(3);
    expect(query.$or[0].title).toEqual({ $regex: 'next', $options: 'i' });
  });

  it('returns 500 when the database query fails', async () => {
    blogModel.find.mockReturnValue(chainedReject(new Error('boom')));

    const res = await GET(getRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('boom');
  });
});

describe('POST /api/blogs', () => {
  it('returns 401 when no token is present', async () => {
    const res = await POST(postRequest({ title: 'T', content: 'C' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    cookiesMock.mockResolvedValue(cookieStore('not-a-valid-token'));

    const res = await POST(postRequest({ title: 'T', content: 'C' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when title or content is missing', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));

    const res = await POST(postRequest({ title: 'Only title' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Title and content/);
    expect(userModel.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the session user no longer exists', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue(null);

    const res = await POST(postRequest({ title: 'T', content: 'C' }));
    expect(res.status).toBe(404);
  });

  it('creates a blog with slug, author, authorRole, authorId and publishedDate', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue({
      _id: userId,
      name: 'Test User',
      designation: 'President',
    });
    const created = { _id: 'blog-1', title: 'Hello World!' };
    blogModel.create.mockResolvedValue(created);

    const res = await POST(
      postRequest({ title: 'Hello World!', content: 'Body', category: 'WEB' })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.blog).toEqual(created);

    const [args] = blogModel.create.mock.calls[0];
    expect(args.slug).toBe('hello-world');
    expect(args.author).toBe('Test User');
    expect(args.authorRole).toBe('President');
    expect(args.authorId).toBe(userId);
    expect(args.publishedDate).toBeTruthy();
    expect(args.category).toBe('WEB');
  });

  it('uses provided slug and author when given', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue({ _id: userId, name: 'Test User' });
    blogModel.create.mockResolvedValue({});

    await POST(
      postRequest({ title: 'Title', content: 'C', slug: 'custom-slug', author: 'Custom Author' })
    );

    const [args] = blogModel.create.mock.calls[0];
    expect(args.slug).toBe('custom-slug');
    expect(args.author).toBe('Custom Author');
    expect(args.authorRole).toBe('Member');
  });

  it('returns 500 when creation fails', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue({ _id: userId, name: 'Test User' });
    blogModel.create.mockRejectedValue(new Error('write failed'));

    const res = await POST(postRequest({ title: 'T', content: 'C' }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('write failed');
  });
});
