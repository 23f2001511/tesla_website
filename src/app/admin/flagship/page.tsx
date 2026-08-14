'use client';

import { useState, useEffect } from 'react';
import { Zap, Save, RefreshCw, CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface Track {
  trackId: string;
  name: string;
  prize: string;
  desc: string;
}

interface FlagshipData {
  edition: string;
  tagline: string;
  headline: string;
  description: string;
  dates: string;
  format: string;
  venue: string;
  teamSize: string;
  prizePool: string;
  registrationLink: string;
  tracks: Track[];
}

const defaultFlagship: FlagshipData = {
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

export default function AdminFlagshipPage() {
  const [data, setData] = useState<FlagshipData>(defaultFlagship);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchFlagship = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/flagship');
      const json = await res.json();
      if (json.success && json.flagship) {
        setData(json.flagship);
      }
    } catch (err) {
      console.error('Error fetching flagship event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlagship();
  }, []);

  const handleTrackChange = (index: number, field: keyof Track, val: string) => {
    const newTracks = [...data.tracks];
    newTracks[index] = { ...newTracks[index], [field]: val };
    setData({ ...data, tracks: newTracks });
  };

  const handleAddTrack = () => {
    const nextId = `T${data.tracks.length + 1}`;
    setData({
      ...data,
      tracks: [
        ...data.tracks,
        { trackId: nextId, name: 'New Track', prize: '₹1.0L', desc: 'Track description here' },
      ],
    });
  };

  const handleRemoveTrack = (index: number) => {
    if (data.tracks.length <= 1) {
      alert('Must keep at least 1 track');
      return;
    }
    const newTracks = data.tracks.filter((_, i) => i !== index);
    setData({ ...data, tracks: newTracks });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);

      const res = await fetch('/api/admin/flagship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        alert('Failed to save: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// HOMEPAGE FLAGSHIP</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">HACK-TESLA '26 CONFIG</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Customize the flagship national hackathon section, dates, prizes, and competitive tracks displayed on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchFlagship} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-acid/10 border border-acid p-4 flex items-center gap-3 text-acid font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Flagship Hackathon settings updated and published to homepage!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Details Panel */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="tag-mono-acid">// CORE SETTINGS</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="tag-mono block mb-1.5">EDITION TITLE</label>
              <input
                type="text"
                required
                value={data.edition}
                onChange={(e) => setData({ ...data, edition: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">TOTAL PRIZE POOL</label>
              <input
                type="text"
                required
                value={data.prizePool}
                onChange={(e) => setData({ ...data, prizePool: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">REGISTRATION URL</label>
              <input
                type="text"
                value={data.registrationLink}
                onChange={(e) => setData({ ...data, registrationLink: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="tag-mono block mb-1.5">TAGLINE (HOMEPAGE BANNER)</label>
              <textarea
                rows={2}
                value={data.tagline}
                onChange={(e) => setData({ ...data, tagline: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="tag-mono block mb-1.5">HEADLINE</label>
              <input
                type="text"
                value={data.headline}
                onChange={(e) => setData({ ...data, headline: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="tag-mono block mb-1.5">DESCRIPTION</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="tag-mono block mb-1.5">DATES</label>
              <input
                type="text"
                value={data.dates}
                onChange={(e) => setData({ ...data, dates: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-xs text-ivory font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="tag-mono block mb-1.5">FORMAT</label>
              <input
                type="text"
                value={data.format}
                onChange={(e) => setData({ ...data, format: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-xs text-ivory font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="tag-mono block mb-1.5">VENUE</label>
              <input
                type="text"
                value={data.venue}
                onChange={(e) => setData({ ...data, venue: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-xs text-ivory font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="tag-mono block mb-1.5">TEAM SIZE</label>
              <input
                type="text"
                value={data.teamSize}
                onChange={(e) => setData({ ...data, teamSize: e.target.value })}
                className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-xs text-ivory font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tracks Editor */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="tag-mono-acid">// COMPETITION TRACKS ({data.tracks.length})</div>
            <button
              type="button"
              onClick={handleAddTrack}
              className="btn-brut text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" /> Add Track
            </button>
          </div>

          <div className="space-y-4">
            {data.tracks.map((track, i) => (
              <div
                key={i}
                className="p-4 bg-ink border border-line relative space-y-3 group hover:border-acid transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-acid font-bold">
                    TRACK #{i + 1} [{track.trackId}]
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(i)}
                    className="text-muted hover:text-red-400 p-1"
                    title="Remove Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="tag-mono text-[10px] block mb-1">TRACK ID</label>
                    <input
                      type="text"
                      value={track.trackId}
                      onChange={(e) => handleTrackChange(i, 'trackId', e.target.value)}
                      className="w-full bg-ink-2 border border-line focus:border-acid px-2.5 py-1.5 text-xs text-ivory font-mono focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="tag-mono text-[10px] block mb-1">TRACK NAME</label>
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => handleTrackChange(i, 'name', e.target.value)}
                      className="w-full bg-ink-2 border border-line focus:border-acid px-2.5 py-1.5 text-xs text-ivory font-mono focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="tag-mono text-[10px] block mb-1">TRACK PRIZE</label>
                    <input
                      type="text"
                      value={track.prize}
                      onChange={(e) => handleTrackChange(i, 'prize', e.target.value)}
                      className="w-full bg-ink-2 border border-line focus:border-acid px-2.5 py-1.5 text-xs text-acid font-mono focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="tag-mono text-[10px] block mb-1">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={track.desc}
                    onChange={(e) => handleTrackChange(i, 'desc', e.target.value)}
                    className="w-full bg-ink-2 border border-line focus:border-acid px-2.5 py-1.5 text-xs text-ivory font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>
            ))}
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
            {saving ? 'SAVING CHANGES…' : 'SAVE & PUBLISH FLAGSHIP CONFIG'}
          </button>
        </div>
      </form>
    </div>
  );
}
