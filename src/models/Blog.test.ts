import { describe, it, expect } from 'vitest';
import { Blog } from '@/models/Blog';

describe('Blog model', () => {
  it('defines an author field referencing the User collection', () => {
    const path: any = Blog.schema.path('author');
    expect(path).toBeDefined();
    expect(path.instance).toBe('ObjectId');
    expect(path.options.ref).toBe('User');
    expect(path.options.required).toBe(true);
  });

  it('defaults status to Draft and views to 0', () => {
    const doc = new Blog({ title: 'Test Title', content: 'Test Content', category: 'Tech' });
    expect(doc.status).toBe('Draft');
    expect(doc.views).toBe(0);
  });
});
