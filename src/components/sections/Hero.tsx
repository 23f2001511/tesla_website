'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { Users, Calendar, GraduationCap, FileText, Trophy } from 'lucide-react';
import { HeroAnimatedLogo } from '@/components/logo/HeroAnimatedLogo';

export function Hero() {
  const stats = [
    { label: 'Members', value: '500+', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Events', value: '120+', icon: Calendar, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Alumni', value: '300+', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Resources', value: '1000+', icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Achievements', value: '200+', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden">
      {/* Circuit Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%233b82f6\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-primary uppercase">
              Welcome to TESLA
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span className="block text-white">Innovate.</span>
              <span className="block text-white">Build.</span>
              <span className="block text-gradient">
                <TypewriterText texts={['Inspire.', 'Create.', 'Transform.']} typingSpeed={150} pauseTime={2500} />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed mt-2">
              TESLA Technical Club is a community of passionate learners, innovators and problem solvers building the future through technology.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <Link href="/events" className="px-8 py-4 rounded-full bg-primary text-white font-semibold hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                Explore Events
              </Link>
              <Link href="/contact" className="px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
                Join TESLA
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
               <div className="flex -space-x-3">
                  {/* Mock avatars */}
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="member" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <span className="text-sm text-gray-400 font-medium">500+ Active Members</span>
            </div>
          </motion.div>

          {/* Right Content - Glowing Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:flex justify-center items-center relative"
          >
            {/* Official club logo — futuristic SVG recreation with platform */}
            <HeroAnimatedLogo size={340} className="relative z-10" />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-20"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform cursor-default group">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
