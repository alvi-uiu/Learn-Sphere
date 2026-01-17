import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { User, Post, Project } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import {
  User as UserIcon, Mail, BookOpen, Camera, Save, ArrowLeft,
  Edit2, Award, Calendar, MapPin, Grid, Layers, Hash
} from 'lucide-react';
import { db } from '../services/db';
import { PostCard } from '../components/PostCard';

interface ProfileViewProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onViewProject?: (projectId: string) => void;
  viewingUserId?: string | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onUpdateUser, onViewProject, viewingUserId }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayedUser, setDisplayedUser] = useState<User>(user);
  // Determine if viewing own profile
  const isOwner = !viewingUserId || viewingUserId === user.id;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    major: user?.major || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);

  // Real Data State
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);

  // Effect to load user if viewing another profile
  useEffect(() => {
    const fetchUser = async () => {
      if (viewingUserId && viewingUserId !== user.id) {
        try {
          const res = await fetch(`http://localhost:3001/api/users/${viewingUserId}`);
          if (res.ok) {
            const data = await res.json();
            setDisplayedUser(data);
            return;
          }
        } catch (e) { console.error('Failed to fetch user', e); }
      }
      setDisplayedUser(user);
    };
    fetchUser();
  }, [viewingUserId, user]);

  useEffect(() => {
    // Update form data when displayedUser changes (for edit mode, though disabled for others)
    setFormData({
      name: displayedUser.name || '',
      email: displayedUser.email || '',
      studentId: displayedUser.studentId || '',
      major: displayedUser.major || '',
      bio: displayedUser.bio || '',
    });
    loadUserData();
  }, [displayedUser]);

  const loadUserData = async () => {
    // 1. Fetch Posts
    const allPosts = await db.getPosts();
    const myPosts = allPosts.filter(p => p.authorId === displayedUser.id || p.author === displayedUser.name);
    setUserPosts(myPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    // 2. Fetch Projects
    try {
      const res = await fetch(`http://localhost:3001/api/projects?t=${Date.now()}`);
      const data = await res.json();
      const allProjects: any[] = data.projects || data;
      if (Array.isArray(allProjects)) {
        const mine = allProjects.filter(p => p.owner_id === displayedUser.id || p.ownerId === displayedUser.id);
        setMyProjects(mine);
      }
    } catch (e) {
      console.error("Failed to load projects");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = { ...user, ...formData };
      onUpdateUser(updatedUser);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const updatedUser = { ...user, avatar: base64 };
      onUpdateUser(updatedUser);
      showToast('Profile picture updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handlePostDelete = async (postId: string) => {
    // Optimistic update
    setUserPosts(prev => prev.filter(p => p.id !== postId));
    // Call DB delete (simulated via db service if method exists, else just filtered view for now)
    // db.deletePost exists in db.ts
    try {
      await db.deletePost(postId);
      showToast('Post deleted', 'success');
    } catch (e) {
      showToast('Failed to delete post', 'error');
      loadUserData(); // Revert
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };


  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
        <GlassCard className="p-6 lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className={`relative mb-4 group ${isOwner ? 'cursor-pointer' : ''}`} onClick={isOwner ? handleAvatarClick : undefined}>
              <img
                src={displayedUser?.avatar || 'https://ui-avatars.com/api/?name=' + displayedUser.name}
                alt={displayedUser?.name}
                className="w-28 h-28 rounded-[2rem] border-4 border-apple-blue shadow-2xl object-cover transition-transform group-hover:scale-105"
              />
              {isOwner && (
                <div className="absolute inset-0 rounded-[2rem] bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayedUser?.name}</h2>
            <p className="text-sm text-gray-500 font-medium">{displayedUser?.role || 'Student'}</p>
            <p className="text-xs text-apple-blue mt-1 font-bold">{displayedUser?.major || 'Undeclared'}</p>

            <div className={`w-full mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-center gap-2 mb-1 text-apple-blue">
                    <Grid size={16} />
                  </div>
                  <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{userPosts.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Posts</p>
                </div>
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-center gap-2 mb-1 text-purple-500">
                    <Layers size={16} />
                  </div>
                  <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{myProjects.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Projects</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <UserIcon size={18} className="text-apple-blue" />
                Personal Info
              </h3>
              {!isEditing ? (
                isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 text-apple-blue rounded-xl text-xs font-bold hover:bg-apple-blue/20 transition-colors"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                )
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                      }`}
                  />
                ) : (
                  <p className={`py-3 px-4 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>{displayedUser?.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                  Email Address
                </label>
                <p className={`py-3 px-4 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  {(isOwner || displayedUser?.isEmailVisible) ? displayedUser?.email : 'Hidden'}
                </p>
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                  <Hash size={18} className="text-gray-500" /> Student ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. 011..."
                    className={`w-full rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40 ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
                      }`}
                  />
                ) : (
                  <p className={`py-3 px-4 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    {(isOwner || displayedUser?.isIdVisible) ? (displayedUser?.studentId || 'Not set') : 'Hidden'}
                  </p>
                )}
              </div>

              {/* Major */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                  Major / Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className={`w-full rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40 ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
                      }`}
                  />
                ) : (
                  <p className={`py-3 px-4 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>{displayedUser?.major || 'Not specified'}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className={`w-full rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40 resize-none ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
                      }`}
                  />
                ) : (
                  <p className={`py-3 px-4 rounded-xl text-sm font-medium min-h-[100px] leading-relaxed ${isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    {displayedUser?.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* My Projects Section */}
          <div className="mb-8">
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Layers size={18} className="text-purple-500" />
              My Projects
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myProjects.length > 0 ? (
                myProjects.map(project => (
                  <GlassCard
                    key={project.id}
                    onClick={() => onViewProject?.(project.id)}
                    className="p-4 border-l-4 border-l-purple-500 hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project.status === 'Open' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                        {project.status || 'Active'}
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(project.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <h4 className={`font-bold text-sm mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{project.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{project.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <img src={project.owner_avatar} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900" alt="Owner" />
                      </div>
                      <span className="text-[10px] text-gray-400">Owner</span>
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="col-span-full text-center py-8 opacity-50 text-sm">No active projects</div>
              )}
            </div>
          </div>

          {/* My Posts Section */}
          <div>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Grid size={18} className="text-apple-blue" />
              My Posts
            </h3>
            <div className="space-y-6">
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={user}
                    onDelete={handlePostDelete}
                    onUpdate={handlePostUpdate}
                  />
                ))
              ) : (
                <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                  <p className="text-sm">You haven't posted anything yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
