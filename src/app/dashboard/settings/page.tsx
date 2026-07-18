'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Eye,
  Clock,
  Palette,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import {
  getStoredThemeChoice,
  setStoredThemeChoice,
  type ThemeChoice,
} from '../theme';

interface SettingsUser {
  name: string;
  email: string;
  role: string;
  team?: string;
  branch?: string;
  year?: string;
  isPublic?: boolean;
  lastLogin?: string;
  preferences?: {
    emailNotifications?: boolean;
  };
}

// Only preferences.emailNotifications has a backend field (persisted via
// member-profile PUT). The remaining toggles are device-level preferences
// kept in localStorage so the backend stays untouched.
const LOCAL_PREFS_KEY = 'tesla-settings-preferences';

interface LocalPrefs {
  eventReminders: boolean;
  clubAnnouncements: boolean;
  publicProfile: boolean;
  showEmail: boolean;
  showPhone: boolean;
}

const DEFAULT_LOCAL_PREFS: LocalPrefs = {
  eventReminders: true,
  clubAnnouncements: true,
  publicProfile: true,
  showEmail: false,
  showPhone: false
};

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon }
];

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(!checked)}
        className="w-5 h-5"
      />
    </div>
  );
}

export default function DashboardSettings() {
  const router = useRouter();

  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifStatus, setNotifStatus] =
    useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [localPrefs, setLocalPrefs] = useState<LocalPrefs>(DEFAULT_LOCAL_PREFS);

  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('system');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      let stored: Partial<LocalPrefs> = {};
      try {
        stored = JSON.parse(localStorage.getItem(LOCAL_PREFS_KEY) ?? '{}');
      } catch {
        stored = {};
      }
      setLocalPrefs(prev => ({ ...prev, ...stored }));

      setThemeChoice(getStoredThemeChoice());

      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
          setEmailNotifications(data.user.preferences?.emailNotifications ?? true);

          // No stored local value yet — seed the toggle from the account's
          // current visibility so it doesn't contradict the server.
          if (stored.publicProfile === undefined) {
            setLocalPrefs(prev => ({
              ...prev,
              publicProfile: data.user.isPublic ?? true
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    init();
  }, []);

  // The dashboard layout owns applying the theme; it re-resolves on this event.
  const handleThemeChange = (choice: ThemeChoice) => {
    setThemeChoice(choice);
    setStoredThemeChoice(choice);
  };

  const setLocalPref = (key: keyof LocalPrefs, value: boolean) => {
    setLocalPrefs(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable — the toggle still works for this session.
      }
      return next;
    });
  };

  const handleEmailNotifications = async (next: boolean) => {
    if (!user) return;

    setEmailNotifications(next);
    setNotifStatus('saving');

    try {
      const res = await fetch('/api/user/member-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          emailNotifications: next
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);

      setNotifStatus('saved');
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      setEmailNotifications(!next);
      setNotifStatus('error');
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from the current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!data.success) {
        setPasswordError(data.message || 'Failed to change password.');
        return;
      }

      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  const accountRows: { label: string; value: string }[] = [
    { label: 'Name', value: user?.name || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Role', value: user?.role || '—' },
    { label: 'Team', value: user?.team || 'Not Assigned' },
    { label: 'Branch', value: user?.branch || '—' },
    { label: 'Year', value: user?.year || '—' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-400">
          Manage your account preferences and security.
        </p>
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Security
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">
              Change Password
            </h3>
            <p className="text-sm text-gray-400">
              Update your account password
            </p>
          </div>

          <button
            onClick={openPasswordModal}
            className="px-4 py-2 bg-primary rounded-lg text-white"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">
              Account
            </h2>
          </div>

          <button
            onClick={() => router.push('/dashboard/profile')}
            className="px-4 py-2 bg-primary rounded-lg text-white"
          >
            Edit Profile
          </button>
        </div>

        {loadingUser ? (
          <p className="text-gray-400">Loading account details…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accountRows.map(row => (
              <div key={row.label}>
                <p className="text-sm text-gray-400">{row.label}</p>
                <p className="text-white font-medium break-all">{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Theme
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                themeChoice === value
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-400 mt-4">
          System follows your device&apos;s appearance preference.
        </p>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Notifications
          </h2>

          {notifStatus === 'saving' && (
            <span className="text-sm text-gray-400 ml-auto">Saving…</span>
          )}
          {notifStatus === 'saved' && (
            <span className="text-sm text-green-400 ml-auto">Saved</span>
          )}
          {notifStatus === 'error' && (
            <span className="text-sm text-red-400 ml-auto">Failed to save</span>
          )}
        </div>

        <div className="space-y-5">
          <ToggleRow
            title="Email Notifications"
            description="Receive event and club updates by email"
            checked={emailNotifications}
            disabled={loadingUser || notifStatus === 'saving'}
            onChange={handleEmailNotifications}
          />

          <ToggleRow
            title="Event Reminders"
            description="Get reminded before registered events"
            checked={localPrefs.eventReminders}
            onChange={next => setLocalPref('eventReminders', next)}
          />

          <ToggleRow
            title="Club Announcements"
            description="Stay updated with club-wide announcements"
            checked={localPrefs.clubAnnouncements}
            onChange={next => setLocalPref('clubAnnouncements', next)}
          />
        </div>
      </div>

      {/* Privacy */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Privacy
          </h2>
        </div>

        <div className="space-y-5">
          <ToggleRow
            title="Public Profile"
            description="Allow others to view your profile"
            checked={localPrefs.publicProfile}
            onChange={next => setLocalPref('publicProfile', next)}
          />

          <ToggleRow
            title="Show Email"
            description="Display your email on your public profile"
            checked={localPrefs.showEmail}
            onChange={next => setLocalPref('showEmail', next)}
          />

          <ToggleRow
            title="Show Phone"
            description="Display your phone number on your public profile"
            checked={localPrefs.showPhone}
            onChange={next => setLocalPref('showPhone', next)}
          />
        </div>
      </div>

      {/* Session */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Session
          </h2>
        </div>

        <div>
          <h3 className="text-white font-medium">Last Login</h3>
          <p className="text-sm text-gray-400">
            {user?.lastLogin
              ? new Date(user.lastLogin).toLocaleString()
              : 'Not Available'}
          </p>
        </div>
      </div>

      {/* Logout */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-white font-medium">Logout</h3>
              <p className="text-sm text-gray-400">
                Sign out of your account on this device
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white disabled:opacity-60"
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="w-full max-w-md bg-[#111827] rounded-2xl p-6 border border-white/10">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Change Password
              </h2>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 8 characters)"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}

              {passwordSuccess && (
                <p className="text-sm text-green-400">{passwordSuccess}</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="w-full bg-primary py-3 rounded-lg text-white font-medium disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
