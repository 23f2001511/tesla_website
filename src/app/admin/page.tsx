'use client';

import { motion } from 'framer-motion';
import { Users, Calendar, FileText, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminOverview() {
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [blogCount, setBlogCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const targets = {
      members: 1248,
      events: 48,
      blogs: 126,
      visits: 3422,
    };

    const duration = 1500; // animation duration in ms
    const steps = 60;
    const intervalTime = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;

      setMemberCount(
        Math.min(
          Math.floor((targets.members * currentStep) / steps),
          targets.members
        )
      );

      setEventCount(
        Math.min(
          Math.floor((targets.events * currentStep) / steps),
          targets.events
        )
      );

      setBlogCount(
        Math.min(
          Math.floor((targets.blogs * currentStep) / steps),
          targets.blogs
        )
      );

      setVisitCount(
        Math.min(
          Math.floor((targets.visits * currentStep) / steps),
          targets.visits
        )
      );

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { title: 'Total Members', value: memberCount.toLocaleString(), change: '+12%', trend: 'up', icon: Users, color: 'text-blue-400' },
    { title: 'Active Events', value: eventCount, change: 'Same', trend: 'neutral', icon: Calendar, color: 'text-purple-400' },
    { title: 'Pending Blogs', value: blogCount, change: '+5', trend: 'up', icon: FileText, color: 'text-orange-400' },
    { title: 'Daily Visits', value: visitCount.toLocaleString(), change: '-2%', trend: 'down', icon: Activity, color: 'text-green-400' },
  ];

  const recentActivities = [
    { user: 'Aarav Mehta', action: 'submitted a new blog', time: '2 hours ago', status: 'pending' },
    { user: 'Diya Sharma', action: 'registered for AI Workshop', time: '5 hours ago', status: 'success' },
    { user: 'System', action: 'Server backup completed', time: '12 hours ago', status: 'info' },
    { user: 'Rohan Verma', action: 'updated event details', time: '1 day ago', status: 'warning' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">
            Dashboard Overview
          </h1>

          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Live
          </span>
        </div>
        <p className="text-gray-400">Welcome back, Admin. Here is what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative overflow-hidden glass p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] hover: -translate-y-1 transition-all duration-300 cursor-pointer group"

          >
            <div
              className="
    absolute inset-0 opacity-0 group-hover:opacity-100
    transition-opacity duration-500 pointer-events-none
  "
            >
              <div
                className="
      absolute -top-20 -left-20 w-40 h-40
      bg-blue-500/20 blur-3xl rounded-full
      animate-pulse
    "
              />

              <div
                className="
      absolute -bottom-20 -right-20 w-40 h-40
      bg-purple-500/20 blur-3xl rounded-full
      animate-pulse
    "
              />
            </div>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-green-400 bg-green-400/10' :
                stat.trend === 'down' ? 'text-red-400 bg-red-400/10' :
                  'text-gray-400 bg-gray-400/10'
                }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : stat.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                {stat.change}
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.title}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="relative overflow-hidden group glass p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/15 blur-3xl rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <Calendar className="w-6 h-6 text-purple-400" />

            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
              +8%
            </span>
          </div>

          <div className="text-4xl font-bold text-white">
            {eventCount}
          </div>

          <p className="text-sm text-gray-400 mt-1">
            Total Events
          </p>
        </div>

        <div className="relative overflow-hidden group glass p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/15 blur-3xl rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <FileText className="w-6 h-6 text-orange-400" />

            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
              +15%
            </span>
          </div>

          <div className="text-4xl font-bold text-white">
            {blogCount}
          </div>

          <p className="text-sm text-gray-400 mt-1">
            Total Blogs
          </p>
        </div>

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart placeholder */}
        <div className="relative overflow-hidden group lg:col-span-2 glass rounded-2xl p-6 border border-white/5 hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/15 blur-3xl rounded-full animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/15 blur-3xl rounded-full animate-pulse" />
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Site Traffic & Activity
              </h2>

              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                18% this week
              </div>
            </div>

            <p className="text-gray-400 text-sm mt-2">
              Traffic has increased significantly compared to last week.
            </p>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
            <div className="h-64 w-full flex items-end gap-4 px-4">
              {[
                { day: 'Mon', value: 40 },
                { day: 'Tue', value: 65 },
                { day: 'Wed', value: 50 },
                { day: 'Thu', value: 80 },
                { day: 'Fri', value: 60 },
                { day: 'Sat', value: 95 },
                { day: 'Sun', value: 75 },
              ].map((item) => (
                <div
                  key={item.day}
                  className="flex-1 h-full flex flex-col justify-end items-center"
                >
                  <span className='text-xs text-white mb-2'>
                    {item.value}
                  </span>

                  <motion.div
                    className="w-full bg-blue-500 rounded-t-lg hover:opacity-80"
                    initial={{ height: 0 }}
                    animate={{ height: `${item.value}%` }}
                    transition={{
                      duration: 1,
                      delay: item.value * 0.005,
                    }}
                    style={{
                      minHeight: '20px',
                    }}
                  />

                  <span className="mt-2 text-xs text-gray-400">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="relative overflow-hidden group glass rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-500/15 blur-3xl rounded-full animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/15 blur-3xl rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>

          <div className="flex-1 space-y-6">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex gap-4 relative p-2 rounded-lg hover:bg-white/5 transition-all">
                {idx !== recentActivities.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-white/10" />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-background z-10 ${activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-orange-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col pt-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-bold text-white">{activity.user}</span> {activity.action}
                  </p>
                  <span className="text-xs text-gray-500 mt-1">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] transition-all duration-300">

        <h3 className="text-xl font-semibold text-white mb-6">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <button className="group relative overflow-hidden glass p-4 rounded-xl hover:border-white/20 border border-white/5 transition-all cursor-pointer">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/10 transition-opacity duration-300" />
          <div className='relative z-10'>
            <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white">
              Create Event
            </p>
            </div>
          </button>

          <button className="group relative overflow-hidden glass p-4 rounded-xl hover:border-white/20 border border-white/5 transition-all cursor-pointer">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/10 transition-opacity duration-300" />
          <div className='relative z-10'>
            <FileText className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-white">
              Approve Blogs
            </p>
            </div>
          </button>

          <button className="group relative overflow-hidden glass p-4 rounded-xl hover:border-white/20 border border-white/5 transition-all cursor-pointer">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/10 transition-opacity duration-300" />
          <div className='relative z-10'>
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-white">
              Members
            </p>
            </div>
          </button>

          <button className="group relative overflow-hidden glass p-4 rounded-xl hover:border-white/20 border border-white/5 transition-all cursor-pointer">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/10 transition-opacity duration-300" />
          <div className='relative z-10'>
            <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white">
              Send Notice
            </p>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
