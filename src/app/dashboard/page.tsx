import { redirect } from 'next/navigation';

// /dashboard has no view of its own — send users to their main dashboard.
export default function DashboardIndex() {
  redirect('/dashboard/members');
}
