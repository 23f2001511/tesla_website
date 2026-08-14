'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle2, Globe, Bell, Share2, Award } from 'lucide-react';

interface SiteSettingsData {
  clubName: string;
  tagline: string;
  contactEmail: string;
  location: string;
  discordUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  labHours: string;
  announcement: {
    active: boolean;
    text: string;
    link: string;
  };
  impactStats: {
    activeMembers: string;
    projectsShipped: string;
    hackathonWins: string;
    placementRate: string;
  };
}

const defaultSettings: SiteSettingsData = {
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
    active: false,
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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// GLOBAL CONFIG</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">SITE & LINK SETTINGS</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Update direct channels, socials, impact statistics, and global banner alerts across the platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchSettings} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-acid/10 border border-acid p-4 flex items-center gap-3 text-acid font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Site settings successfully updated and applied!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Direct Channels & Contact info */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-acid" />
            <span className="tag-mono-acid">// DIRECT CHANNELS & LOCATION</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="tag-mono block mb-1.5">CLUB CONTACT EMAIL</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">LOCATION / CAMPUS BLOCK</label>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="tag-mono block mb-1.5">LAB HOURS</label>
            <input
              type="text"
              value={settings.labHours}
              onChange={(e) => setSettings({ ...settings, labHours: e.target.value })}
              className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-acid" />
            <span className="tag-mono-acid">// SOCIAL & COMMUNITY LINKS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="tag-mono block mb-1.5">DISCORD INVITE URL</label>
              <input
                type="text"
                value={settings.discordUrl}
                onChange={(e) => setSettings({ ...settings, discordUrl: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">GITHUB REPOSITORY / ORG</label>
              <input
                type="text"
                value={settings.githubUrl}
                onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">LINKEDIN URL</label>
              <input
                type="text"
                value={settings.linkedinUrl}
                onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">INSTAGRAM URL</label>
              <input
                type="text"
                value={settings.instagramUrl}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-acid" />
            <span className="tag-mono-acid">// CLUB IMPACT NUMBERS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="tag-mono block mb-1.5">ACTIVE MEMBERS</label>
              <input
                type="text"
                value={settings.impactStats.activeMembers}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    impactStats: { ...settings.impactStats, activeMembers: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">PROJECTS SHIPPED</label>
              <input
                type="text"
                value={settings.impactStats.projectsShipped}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    impactStats: { ...settings.impactStats, projectsShipped: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">HACKATHON WINS</label>
              <input
                type="text"
                value={settings.impactStats.hackathonWins}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    impactStats: { ...settings.impactStats, hackathonWins: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">PLACEMENT RATE</label>
              <input
                type="text"
                value={settings.impactStats.placementRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    impactStats: { ...settings.impactStats, placementRate: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-acid" />
            <span className="tag-mono-acid">// GLOBAL ANNOUNCEMENT BANNER</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-ink border border-line">
            <input
              type="checkbox"
              id="announcementActive"
              checked={settings.announcement.active}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcement: { ...settings.announcement, active: e.target.checked },
                })
              }
              className="w-4 h-4 accent-[#d8ff3d]"
            />
            <label
              htmlFor="announcementActive"
              className="text-xs font-mono text-ivory cursor-pointer font-bold"
            >
              Enable Announcement Banner on Top of Website
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="tag-mono block mb-1.5">BANNER MESSAGE</label>
              <input
                type="text"
                value={settings.announcement.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, text: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">TARGET LINK</label>
              <input
                type="text"
                value={settings.announcement.link}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, link: e.target.value },
                  })
                }
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-acid px-8 py-3 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING SETTINGS…' : 'SAVE ALL SETTINGS'}
          </button>
        </div>
      </form>
    </div>
  );
}
