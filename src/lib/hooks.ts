'use client';

import { useEffect } from 'react';

/**
 * Runs an async loader from an effect.
 *
 * The loader is invoked in a microtask instead of synchronously, which keeps
 * the effect body itself free of state updates (`react-hooks/set-state-in-effect`)
 * while preserving the original semantics of
 * `useEffect(() => { load(); }, [load])`: it runs on mount and again whenever
 * the loader identity changes (e.g. a `useCallback` that depends on filters).
 *
 * Always pass a `useCallback`-memoised loader — an inline arrow changes identity
 * on every render and would re-run the loader in a loop.
 */
export function useLoaderEffect(load: () => void | Promise<void>): void {
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);
}
