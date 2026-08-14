import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_secret_for_development_only';
const userId = '507f1f77bcf86cd799439011';

const { blogModel, userModel, cookiesMock } = vi.hoisted(() => {
  const blogModel: any = vi.fn();
  blogModel.find = vi.fn();

  const userModel: any = vi.fn();
  userModel.findById = vi.fn();

  return { blogModel, userModel, cookiesMock: vi.fn() };
});

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Blog', () => ({ Blog: blogModel }));
vi.mock('@/models/User', () => ({ User: userModel }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

import { GET } from './route';

function chained(result: any) {
  const p: any = Promise.resolve(result);
  p.sort = vi.fn(() => p);
  return p;
}

function cookieStore(value?: string) {
  return {
    get: vi.fn((name: string) => (value ? { name, value } : undefined)),
  } as any;
}

beforeEach(() => {
  vi.resetAllMocks();
  cookiesMock.mockResolvedValue(cookieStore());
});

describe('GET /api/blogs/my', () => {
  it('returns 401 when no token is present', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    cookiesMock.mockResolvedValue(cookieStore('not-a-valid-token'));

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns blogs matching the session user by authorId and name', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue({ _id: userId, name: 'Test User' });
    const blogs = [{ _id: '1', title: 'Mine' }];
    blogModel.find.mockReturnValue(chained(blogs));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true, blogs });

    const [query] = blogModel.find.mock.calls[0];
    expect(query.$or).toEqual([
      { authorId: userId },
      { author: 'Test User' },
    ]);
    expect(blogModel.find.mock.results[0].value.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('matches by authorId only when the user record is gone', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue(null);
    blogModel.find.mockReturnValue(chained([]));

    await GET();

    const [query] = blogModel.find.mock.calls[0];
    expect(query.$or[0]).toEqual({ authorId: userId });
    expect(query.$or[1]).toEqual({ author: undefined });
  });

  it('returns 500 when the query fails', async () => {
    cookiesMock.mockResolvedValue(cookieStore(jwt.sign({ userId }, JWT_SECRET)));
    userModel.findById.mockResolvedValue({ _id: userId, name: 'Test User' });
    const p: any = Promise.reject(new Error('boom'));
    p.sort = vi.fn(() => p);
    blogModel.find.mockReturnValue(p);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
