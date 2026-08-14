import { describe, it, expect } from 'vitest';
import { Blog } from '@/models/Blog';

describe('Blog model', () => {
  it('defines an authorId field referencing the User collection', () => {
    const path: any = Blog.schema.path('authorId');
    expect(path).toBeDefined();
    expect(path.instance).toBe('ObjectId');
    expect(path.options.ref).toBe('User');
  });

  it('defaults authorId to null so admin-created blogs are unowned', () => {
    const doc = new Blog({ title: 'T', content: 'C' });
    expect(doc.authorId).toBeNull();
  });
});
