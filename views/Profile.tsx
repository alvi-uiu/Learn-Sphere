import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import {
  User as UserIcon, Mail, BookOpen, Camera, Save, ArrowLeft,
  Edit2, Award, Calendar, MapPin
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onUpdateUser }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    major: user?.major || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = { ...user, ...formData };
      // Update in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft size={24} className={isDark ? 'text-white' : 'text-gray-700'} />
        </button>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <GlassCard className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=User'}
                alt={user?.name}
                className="w-24 h-24 rounded-3xl border-4 border-apple-blue shadow-xl"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-apple-blue rounded-full text-white shadow-lg hover:bg-blue-600 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.role || 'Student'}</p>
            <p className="text-xs text-apple-blue mt-1">{user?.major || 'Undeclared'}</p>

            <div className={`w-full mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.xp || 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase">XP Points</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>12</p>
                  <p className="text-[10px] text-gray-500 uppercase">Posts</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>5</p>
                  <p className="text-[10px] text-gray-500 uppercase">Projects</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Profile Details */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Information</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 text-apple-blue rounded-xl text-sm font-bold hover:bg-apple-blue/20 transition-colors"
              >
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <UserIcon size={12} /> Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                  }`}
                />
              ) : (
                <p className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>{user?.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <Mail size={12} /> Email
              </label>
              <p className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>{user?.email}</p>
            </div>

            {/* Major */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <BookOpen size={12} /> Major
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className={`w-full rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              ) : (
                <p className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>{user?.major || 'Not specified'}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className={`w-full rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40 resize-none ${
                    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              ) : (
                <p className={`py-3 px-4 rounded-xl min-h-[100px] ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>
                  {user?.bio || 'No bio added yet.'}
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Activity Section */}
        <GlassCard className="p-6 lg:col-span-3">
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Award size={16} />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Achievement Unlocked</span>
              </div>
              <p className="text-xs text-gray-500">Completed 5 study sessions this week</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-apple-blue/10 rounded-lg text-apple-blue">
                  <Calendar size={16} />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Session Created</span>
              </div>
              <p className="text-xs text-gray-500">Math 101 Review - Tomorrow 2PM</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                  <MapPin size={16} />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Project Joined</span>
              </div>
              <p className="text-xs text-gray-500">AI Research Team - 3 members</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
