'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';

const fallbackBlogs = [
  {
    id: '1',
    title: 'Building Scalable Web Applications with Next.js',
    category: 'WEB',
    author: 'Aarav Mehta',
    readTime: '5 MIN',
    publishedDate: '20.05.26',
    slug: 'building-scalable-web-apps',
  },
  {
    id: '2',
    title: 'Getting Started with Machine Learning in Python',
    category: 'AI/ML',
    author: 'Diya Sharma',
    readTime: '8 MIN',
    publishedDate: '15.05.26',
    slug: 'getting-started-ml-python',
  },
  {
    id: '3',
    title: 'Top 10 Cyber Security Practices for Developers',
    category: 'SECURITY',
    author: 'Rohan Verma',
    readTime: '4 MIN',
    publishedDate: '10.05.26',
    slug: 'top-10-cyber-security-practices',
  },
];

export default function BlogsPage() {
  const [search, setSearch] = useState('');
  const [blogs, setBlogs] = useState<any[]>(fallbackBlogs);

  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.blogs && data.blogs.length > 0) {
          setBlogs(data.blogs);
        }
      })
      .catch((err) => console.warn('Using fallback blogs:', err));
  }, []);

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// WRITING</div>
            <h1 className="display text-5xl sm:text-7xl text-ivory">LOGS</h1>
            <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
              Tutorials, deep-dives and post-mortems from club members. Written
              by students, reviewed by seniors.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="SEARCH LOGS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-line focus:border-acid px-4 py-3 pl-10 font-mono text-xs tracking-wider text-ivory placeholder:text-muted focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          </div>
        </div>

        {/* List */}
        <div className="border border-line">
          {filtered.map((b, i) => (
            <Link
              href={`/blogs/${b._id || b.slug || b.id}`}
              key={b._id || b.id || i}
              className="grid grid-cols-12 items-center border-b border-line last:border-b-0 hover:bg-ink-2 transition-colors group cursor-pointer"
            >
              <div className="col-span-2 sm:col-span-1 border-r border-line px-4 py-8 text-center">
                <span className="font-mono text-xs text-muted group-hover:text-acid transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="col-span-10 sm:col-span-7 px-4 sm:px-6 py-8">
                <div className="tag-mono-acid mb-2">{b.category}</div>
                <h3 className="display text-xl sm:text-3xl text-ivory leading-tight group-hover:text-acid transition-colors">
                  {b.title}
                </h3>
              </div>
              <div className="hidden sm:block sm:col-span-3 border-l border-line px-6 py-8">
                <div className="tag-mono">{b.author.toUpperCase()}</div>
                <div className="tag-mono mt-1">
                  {b.publishedDate || 'RECENT'} — {b.readTime || '5 MIN'}
                </div>
              </div>
              <div className="hidden sm:flex sm:col-span-1 border-l border-line px-4 py-8 items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center tag-mono">NO LOGS FOUND</div>
          )}
        </div>
      </div>
    </div>
  );
}
