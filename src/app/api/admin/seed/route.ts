import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { TeamMember } from '@/models/TeamMember';
import { Event } from '@/models/Event';
import { FlagshipEvent } from '@/models/FlagshipEvent';
import { Blog } from '@/models/Blog';
import { GalleryItem } from '@/models/GalleryItem';
import { Resource } from '@/models/Resource';
import { Achievement } from '@/models/Achievement';
import { Alumni } from '@/models/Alumni';
import { SiteSettings } from '@/models/SiteSettings';

const initialTeam = [
  { name: 'Aarav Mehta', role: 'President', category: 'Core', tag: 'PRS', order: 1 },
  { name: 'Diya Sharma', role: 'Vice President', category: 'Core', tag: 'VPR', order: 2 },
  { name: 'Rohan Verma', role: 'Technical Lead', category: 'Core', tag: 'TEC', order: 3 },
  { name: 'Ishaan Kapoor', role: 'Operations Lead', category: 'Core', tag: 'OPS', order: 4 },
  { name: 'Dr. S. Rao', role: 'Faculty Advisor', category: 'Faculty', tag: 'FAC', order: 5 },
  { name: 'Ananya Singh', role: 'Design Lead', category: 'Executive', tag: 'DES', order: 6 },
  { name: 'Kabir Anand', role: 'Events Lead', category: 'Executive', tag: 'EVT', order: 7 },
  { name: 'Meera Iyer', role: 'Outreach Lead', category: 'Executive', tag: 'OUT', order: 8 },
];

const initialEvents = [
  {
    title: 'Full-Stack Web Dev Bootcamp',
    category: 'bootcamp',
    date: '28 MAY 2026',
    time: '10:00 — 16:00',
    venue: 'Lab 1, CSE Block',
    description: 'A comprehensive 6-hour deep dive into modern Next.js, React 19, and full-stack API architecture.',
    status: 'upcoming',
    isFeatured: true,
    order: 1,
  },
  {
    title: 'AI/ML Hackathon Prep & Sprint',
    category: 'hackathon',
    date: '15 JUN 2026',
    time: '09:00 — 18:00',
    venue: 'Auditorium A',
    description: 'Hands-on sprint building LLM agents and multimodal vision systems with senior mentors.',
    status: 'upcoming',
    isFeatured: true,
    order: 2,
  },
  {
    title: 'Autonomous Robotics Workshop',
    category: 'hands-on lab',
    date: '12 JUL 2026',
    time: '14:00 — 17:00',
    venue: 'Robotics Lab 3',
    description: 'Microcontroller prototypes, sensory IoT, and embedded systems crash course.',
    status: 'upcoming',
    isFeatured: true,
    order: 3,
  },
  {
    title: 'Cyber Security 101 & Zero Trust',
    category: 'talk',
    date: '10 JAN 2026',
    time: '14:00 — 16:00',
    venue: 'Seminar Hall A',
    description: 'Industry best practices, zero trust access models, and application hardening.',
    status: 'past',
    isFeatured: false,
    order: 4,
  },
];

const initialFlagship = {
  edition: "HACK-TESLA '26",
  tagline: '36 HOURS. NATIONAL LEVEL.\n₹7.8L+ PRIZE POOL.',
  headline: 'BUILD. BREAK. SHIP.',
  description:
    'Bring a laptop, a team, and 36 hours of stubbornness. Mentors from Google, Microsoft and top startups will be on the floor.',
  dates: 'OCT 24–26, 2026',
  format: '36-HOUR SPRINT',
  venue: 'AUDITORIUM + ONLINE',
  teamSize: '2–4 MEMBERS',
  prizePool: '₹7.8L+',
  registrationLink: '/events',
  isActive: true,
  tracks: [
    {
      trackId: 'T1',
      name: 'AI & GenAI Agents',
      prize: '₹2.5L',
      desc: 'LLM agents, multimodal vision, autonomous systems solving real problems.',
    },
    {
      trackId: 'T2',
      name: 'Web3 & Cloud',
      prize: '₹2.0L',
      desc: 'Distributed systems, smart contracts, high-performance microservices.',
    },
    {
      trackId: 'T3',
      name: 'Hardware & Robotics',
      prize: '₹1.8L',
      desc: 'Microcontroller prototypes, sensory IoT, autonomous robotics.',
    },
    {
      trackId: 'T4',
      name: 'Open Innovation',
      prize: '₹1.5L',
      desc: 'No domain limits. Build for climate, health, or education.',
    },
  ],
};

const initialBlogs = [
  {
    title: 'Building Scalable Web Applications with Next.js & Mongoose',
    slug: 'building-scalable-web-apps',
    category: 'WEB',
    author: 'Aarav Mehta',
    authorRole: 'President',
    readTime: '5 MIN',
    publishedDate: '20.05.26',
    content:
      'Next.js 16 introduces breaking improvements to full-stack rendering and server proxies. In this writeup, we analyze performance patterns and data caching.',
    status: 'Published',
    views: 342,
    tags: ['Next.js', 'React', 'MongoDB'],
  },
  {
    title: 'Getting Started with Machine Learning Agents in Python',
    slug: 'getting-started-ml-python',
    category: 'AI/ML',
    author: 'Diya Sharma',
    authorRole: 'Vice President',
    readTime: '8 MIN',
    publishedDate: '15.05.26',
    content:
      'A practical guide to building autonomous AI agents with Python, tool calling, and local LLM pipelines.',
    status: 'Published',
    views: 521,
    tags: ['Python', 'AI', 'Machine Learning'],
  },
  {
    title: 'Top 10 Cyber Security Practices for Developers',
    slug: 'top-10-cyber-security-practices',
    category: 'SECURITY',
    author: 'Rohan Verma',
    authorRole: 'Technical Lead',
    readTime: '4 MIN',
    publishedDate: '10.05.26',
    content:
      'From secure cookie configurations and CSRF mitigation to rate-limiting and least-privilege OAuth scopes.',
    status: 'Published',
    views: 289,
    tags: ['Security', 'DevOps', 'OAuth'],
  },
];

const initialGallery = [
  {
    caption: 'HACK-TESLA 2025 — FINALS',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
    category: 'Hackathons',
    colSpan: 'md:col-span-8',
    order: 1,
  },
  {
    caption: 'WEB BOOTCAMP, WK 3',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
    category: 'Workshops',
    colSpan: 'md:col-span-4',
    order: 2,
  },
  {
    caption: 'CORE TEAM SYNC',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    category: 'Community',
    colSpan: 'md:col-span-4',
    order: 3,
  },
  {
    caption: 'ROBOTICS LAB NIGHT',
    imageUrl: 'https://images.unsplash.com/photo-1523908511403-7fc7b25592f4?q=80&w=800&auto=format&fit=crop',
    category: 'Hardware',
    colSpan: 'md:col-span-4',
    order: 4,
  },
  {
    caption: 'AI RESEARCH GROUP',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
    category: 'Research',
    colSpan: 'md:col-span-8',
    order: 5,
  },
];

const initialResources = [
  {
    title: 'Data Structures Notes',
    type: 'NOTES',
    subject: 'CS201',
    semester: 'Sem 3',
    downloads: 142,
    fileUrl: '#',
  },
  {
    title: 'Operating Systems PYQ 2025',
    type: 'PYQ',
    subject: 'CS301',
    semester: 'Sem 5',
    downloads: 89,
    fileUrl: '#',
  },
  {
    title: 'Database Management Lab Manual',
    type: 'LAB',
    subject: 'CS302',
    semester: 'Sem 5',
    downloads: 256,
    fileUrl: '#',
  },
  {
    title: 'Machine Learning Basics',
    type: 'SLIDES',
    subject: 'CS401',
    semester: 'Sem 7',
    downloads: 67,
    fileUrl: '#',
  },
];

const initialAchievements = [
  {
    title: '1st Prize — Smart India Hackathon',
    category: 'HACKATHON',
    year: '2024',
    verified: true,
    order: 1,
  },
  {
    title: 'Winner — CodeChase 2024',
    category: 'COMPETITIVE PROG.',
    year: '2024',
    verified: true,
    order: 2,
  },
  {
    title: '2nd Prize — Robotics Championship',
    category: 'ROBOTICS',
    year: '2024',
    verified: true,
    order: 3,
  },
  {
    title: 'Best Project Award — TechFest',
    category: 'PROJECT',
    year: '2023',
    verified: true,
    order: 4,
  },
];

const initialAlumni = [
  {
    name: 'Nikhil Patel',
    role: 'SOFTWARE ENGINEER',
    company: 'GOOGLE',
    batch: '2020',
    city: 'BENGALURU',
    order: 1,
    mentorshipAvailable: true,
  },
  {
    name: 'Kritika Joshi',
    role: 'DATA SCIENTIST',
    company: 'MICROSOFT',
    batch: '2021',
    city: 'HYDERABAD',
    order: 2,
    mentorshipAvailable: true,
  },
  {
    name: 'Rishabh Jain',
    role: 'PRODUCT MANAGER',
    company: 'AMAZON',
    batch: '2020',
    city: 'SEATTLE',
    order: 3,
    mentorshipAvailable: true,
  },
  {
    name: 'Sneha Reddy',
    role: 'SDE II',
    company: 'ADOBE',
    batch: '2022',
    city: 'NOIDA',
    order: 4,
    mentorshipAvailable: true,
  },
];

const initialSettings = {
  clubName: 'TESLA Technical Club',
  tagline: 'Engineers, coders, designers, and builders shipping real-world work on campus.',
  contactEmail: 'teslaclub@college.edu',
  location: 'CSE Block, Campus',
  discordUrl: 'https://discord.gg/tesla',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  instagramUrl: 'https://instagram.com',
  twitterUrl: 'https://twitter.com',
  labHours: 'Lab open 16:00–21:00',
  announcement: {
    active: true,
    text: 'Registrations are now OPEN for HACK-TESLA 2026! Over ₹7.8L in prizes.',
    link: '/events',
  },
  impactStats: {
    activeMembers: '500+',
    projectsShipped: '40+',
    hackathonWins: '28',
    placementRate: '96%',
  },
};

export async function POST() {
  try {
    await connectDB();

    // Seed Team Members
    await TeamMember.deleteMany({});
    await TeamMember.insertMany(initialTeam);

    // Seed Events
    await Event.deleteMany({});
    await Event.insertMany(initialEvents);

    // Seed Flagship Event
    await FlagshipEvent.deleteMany({});
    await FlagshipEvent.create(initialFlagship);

    // Seed Blogs
    await Blog.deleteMany({});
    await Blog.insertMany(initialBlogs);

    // Seed Gallery
    await GalleryItem.deleteMany({});
    await GalleryItem.insertMany(initialGallery);

    // Seed Resources
    await Resource.deleteMany({});
    await Resource.insertMany(initialResources);

    // Seed Achievements
    await Achievement.deleteMany({});
    await Achievement.insertMany(initialAchievements);

    // Seed Alumni
    await Alumni.deleteMany({});
    await Alumni.insertMany(initialAlumni);

    // Seed Settings
    await SiteSettings.deleteMany({});
    await SiteSettings.create(initialSettings);

    return NextResponse.json({
      success: true,
      message: 'All Tesla Club database collections seeded successfully!',
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed database',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}