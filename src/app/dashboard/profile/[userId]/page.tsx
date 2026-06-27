'use client';

import { useParams } from 'next/navigation';
import { ProfileContent } from '../page';

// Dynamic member profile — reuses the shared Profile view (read-only for others).
export default function MemberProfileByIdPage() {
  const { userId } = useParams<{ userId: string }>();
  return <ProfileContent userId={userId} />;
}
