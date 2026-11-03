import { describe, it, expect } from 'vitest';
import { User } from '@/models/User';

describe('User model', () => {
  it('defines password with select: false to prevent hash leakage', () => {
    const path: any = User.schema.path('password');
    expect(path).toBeDefined();
    expect(path.options.select).toBe(false);
  });

  it('defaults role to TeamMember and status to active', () => {
    const doc = new User({ name: 'John Doe', email: 'john@tesla.club' });
    expect(doc.role).toBe('TeamMember');
    expect(doc.status).toBe('active');
  });
});
