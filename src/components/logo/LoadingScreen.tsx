'use client';

import { motion } from 'framer-motion';
import { HeroAnimatedLogo } from './HeroAnimatedLogo';

interface LoadingScreenProps {
  message?: string;
}

// Full-screen branded loading state. Mounted by route-level loading.tsx files;
// fades in on mount and fades out automatically when Next.js swaps in the page.
export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background"
    >
      <HeroAnimatedLogo size={180} showPlatform={false} />

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="text-sm tracking-[0.3em] uppercase text-gray-400"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
