'use client';

import useSWR from 'swr';

/**
 * Base URL for all API calls. Defaults to same-origin ('') because the API
 * routes live in this Next.js app — no CORS involved. Override with
 * NEXT_PUBLIC_API_BASE_URL in .env.local if the backend ever moves elsewhere.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { cache: 'no-store' });
  const data: unknown = await res.json().catch(() => ({}));
  if (typeof data === 'object' && data !== null) {
    const envelope = data as { success?: boolean; error?: string; message?: string };
    if (!res.ok || envelope.success === false) {
      throw new Error(envelope.error || envelope.message || `Request failed (${res.status})`);
    }
  } else if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return data as T;
}

/**
 * SWR-backed data hook with revalidation — public pages auto-refresh when new
 * data is added (revalidateOnFocus + a 30s poll, deduped by SWR).
 */
export function useApi<T = unknown>(url: string | null) {
  return useSWR<T>(url, apiFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });
}