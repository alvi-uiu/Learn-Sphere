import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Moon, Sun, Bell, Shield, Globe, Palette,
  ChevronRight, Toggle, Eye, Lock, Trash2, Download
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onBack, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sessions: true,
    comments: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    showToast('Notification preference updated', 'success');
  };

  const SettingRow: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
  }> = ({ icon, title, description, action, onClick, danger }) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isDark 
          ? `hover:bg-white/5 ${danger ? 'hover:bg-red-500/10' : ''}` 
          : `hover:bg-gray-50 ${danger ? 'hover:bg-red-50' : ''}`
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${
          danger 
            ? 'bg-red-500/10 text-red-500' 
            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
        }`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-medium ${danger ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      {action || (onClick && <ChevronRight size={18} className="text-gray-400" />)}
    </div>
  );

  const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-apple-blue' : isDark ? 'bg-white/20' : 'bg-gray-300'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft size={24} className={isDark ? 'text-white' : 'text-gray-700'} />
        </button>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <GlassCard className="p-2">
          <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs font-bold uppercase tracking-wider">Appearance</p>
          </div>
          <SettingRow
            icon={isDark ? <Moon size={18} /> : <Sun size={18} />}
            title="Theme"
            description={`Currently using ${theme} mode`}
            action={
              <button
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isDark ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            }
          />
          <SettingRow
            icon={<Palette size={18} />}
            title="Accent Color"
            description="Blue (Default)"
            onClick={() => showToast('Color customization coming soon!', 'info')}
          />
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="p-2">
          <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs font-bold uppercase tracking-wider">Notifications</p>
          </div>
          <SettingRow
            icon={<Bell size={18} />}
            title="Push Notifications"
            description="Receive notifications on your device"
            action={<Toggle enabled={notifications.push} onChange={() => handleNotificationChange('push')} />}
          />
          <SettingRow
            icon={<Bell size={18} />}
            title="Email Notifications"
            description="Receive updates via email"
            action={<Toggle enabled={notifications.email} onChange={() => handleNotificationChange('email')} />}
          />
          <SettingRow
            icon={<Bell size={18} />}
            title="Session Reminders"
            description="Get notified before study sessions"
            action={<Toggle enabled={notifications.sessions} onChange={() => handleNotificationChange('sessions')} />}
          />
          <SettingRow
            icon={<Bell size={18} />}
            title="Comment Notifications"
            description="When someone comments on your posts"
            action={<Toggle enabled={notifications.comments} onChange={() => handleNotificationChange('comments')} />}
          />
        </GlassCard>

        {/* Privacy & Security */}
        <GlassCard className="p-2">
          <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs font-bold uppercase tracking-wider">Privacy & Security</p>
          </div>
          <SettingRow
            icon={<Eye size={18} />}
            title="Profile Visibility"
            description="Who can see your profile"
            onClick={() => showToast('Privacy settings coming soon!', 'info')}
          />
          <SettingRow
            icon={<Lock size={18} />}
            title="Change Password"
            description="Update your password"
            onClick={() => showToast('Password change coming soon!', 'info')}
          />
          <SettingRow
            icon={<Shield size={18} />}
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            onClick={() => showToast('2FA coming soon!', 'info')}
          />
        </GlassCard>

        {/* Data */}
        <GlassCard className="p-2">
          <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs font-bold uppercase tracking-wider">Data</p>
          </div>
          <SettingRow
            icon={<Download size={18} />}
            title="Download My Data"
            description="Get a copy of your data"
            onClick={() => showToast('Data export coming soon!', 'info')}
          />
          <SettingRow
            icon={<Trash2 size={18} />}
            title="Delete Account"
            description="Permanently delete your account"
            onClick={() => showToast('Please contact support to delete your account', 'error')}
            danger
          />
        </GlassCard>

        {/* About */}
        <GlassCard className="p-2">
          <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs font-bold uppercase tracking-wider">About</p>
          </div>
          <SettingRow
            icon={<Globe size={18} />}
            title="Version"
            description="LearnSphere v1.0.0"
          />
        </GlassCard>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold text-sm transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};
