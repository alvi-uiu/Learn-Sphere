
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Users, BookOpen, MessageSquare, ShieldCheck,
  Search, Trash2, Edit2, Zap, Calendar, Activity, Database, Check, X,
  Download, Image, FileText, ExternalLink, Award, Clock, Link as LinkIcon
} from 'lucide-react';

interface RecentActivity {
  users: any[];
  posts: any[];
  projects: any[];
}

interface Stats {
  users: number;
  posts: number;
  projects: number;
  resources: number;
  recent: RecentActivity;
  system: {
    uptime: number;
    gemini: string;
    nodeVersion: string;
    platform: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  major: string;
  post_count: number;
  project_count: number;
  avatar: string;
}

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'projects' | 'resources'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/stats');
      if (!res.ok) {
        if (res.status === 404) throw new Error('Admin API not found. Please restart your server.');
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Failed to load users. Is the server running?');
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/posts');
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch posts', err);
      setError('Failed to load posts');
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Failed to load projects');
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/resources');
      if (!res.ok) throw new Error('Failed to load resources');
      const data = await res.json();
      setResources(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch resources', err);
      setError('Failed to load resources');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      if (activeTab === 'dashboard') await fetchStats();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'posts') await fetchPosts();
      if (activeTab === 'projects') await fetchProjects();
      if (activeTab === 'resources') await fetchResources();
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/posts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/projects/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/resources/${id}`, { method: 'DELETE' });
      if (res.ok) fetchResources();
    } catch (err) {
      console.error('Failed to delete resource', err);
    }
  };

  const handleUpdateUser = async (user: AdminUser) => {
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const UserEditModal = ({ user, onClose, onSave }: { user: AdminUser, onClose: () => void, onSave: (u: AdminUser) => void }) => {
    const [formData, setFormData] = useState<AdminUser>({ ...user });

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <GlassCard className="w-full max-w-lg p-8 space-y-6 border-white/10 shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Edit2 size={20} className="text-apple-blue" />
              Edit User Profile
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Full Name</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Email Address</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Major / Dept</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                value={formData.major}
                onChange={e => setFormData({ ...formData, major: e.target.value })}
              />
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Role</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 appearance-none"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student" className="bg-black">Student</option>
                <option value="professor" className="bg-black">Professor</option>
                <option value="admin" className="bg-black">Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 font-bold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="flex-[2] py-3 rounded-2xl apple-gradient text-white font-bold text-sm shadow-xl shadow-apple-blue/20 transition-all hover:scale-[1.02]"
            >
              Save Changes
            </button>
          </div>
        </GlassCard>
      </div>
    );
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Horizontal Nav Top */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30 py-4 bg-gray-50/80 dark:bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 apple-gradient rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white" size={22} />
          </div>
          <h2 className="text-xl font-black tracking-tight">Admin Hub</h2>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-2 glass border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'posts', icon: MessageSquare, label: 'Posts' },
            { id: 'projects', icon: Zap, label: 'Projects' },
            { id: 'resources', icon: BookOpen, label: 'Resources' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${activeTab === tab.id
                ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'
                }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 apple-gradient rounded-2xl animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Hub...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
            <X className="text-red-500" size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">Sync Failed</h3>
          <p className="text-gray-500 max-w-sm text-sm mb-8">{error}</p>
          <button
            onClick={() => setActiveTab(activeTab)}
            className="px-8 py-3 apple-gradient text-white rounded-2xl font-bold text-sm shadow-xl shadow-apple-blue/20"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400' },
                  { label: 'Feed Posts', value: stats.posts, icon: MessageSquare, color: 'text-purple-400' },
                  { label: 'Active Projects', value: stats.projects, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Library Resources', value: stats.resources, icon: BookOpen, color: 'text-green-400' },
                ].map((stat, i) => (
                  <GlassCard key={i} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-widest">{stat.label}</p>
                        <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                      </div>
                      <div className={`p-2 rounded-xl ${stat.color.replace('text', 'bg')}/10 border border-white/5`}>
                        <stat.icon size={20} className={stat.color} />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Column */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity size={20} className="text-apple-blue" />
                    Recent Platform Activity
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard className="p-6">
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest flex items-center gap-2">
                        <Users size={14} /> Newest Members
                      </h4>
                      <div className="space-y-4">
                        {stats.recent.users.map((u, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img src={u.avatar} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                            </div>
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase">{u.role}</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} /> Latest Posts
                      </h4>
                      <div className="space-y-4">
                        {stats.recent.posts.map((p, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-apple-blue/10 flex items-center justify-center border border-apple-blue/20">
                              <img src={p.author_avatar || `https://ui-avatars.com/api/?name=${p.author_name}`} className="w-full h-full rounded-lg" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate leading-none mb-1">{p.author_name}</p>
                              <p className="text-[10px] text-gray-500 truncate italic line-clamp-2">"{p.content}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>

                  <GlassCard className="p-6">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest flex items-center gap-2">
                      <Zap size={14} /> Recent Projects
                    </h4>
                    <div className="space-y-4">
                      {stats.recent.projects.map((pr, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                            <Zap size={18} className="text-yellow-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{pr.title}</p>
                            <p className="text-xs text-gray-500 truncate italic">{pr.description?.slice(0, 60)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400">{pr.trimester} {pr.year}</p>
                            <p className="text-[10px] text-apple-blue font-bold uppercase">{pr.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* System Status Column */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Database size={20} className="text-purple-400" />
                    Infrastructure
                  </h3>

                  <GlassCard className="p-6 space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Backend Uptime</p>
                      <p className="text-sm font-bold">{(stats.system.uptime / 3600).toFixed(2)} hours</p>
                      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-green-500 w-[99%]"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gemini AI API</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stats.system.gemini === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <p className="text-sm font-bold">{stats.system.gemini}</p>
                        </div>
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold uppercase">Healthy</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Node Version</p>
                      <p className="text-sm font-bold">{stats.system.nodeVersion}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Host Platform</p>
                      <p className="text-sm font-bold uppercase">{stats.system.platform}</p>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all font-medium"
                  />
                </div>
              </div>

              <GlassCard className="overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                      <tr>
                        <th className="px-6 py-5">User</th>
                        <th className="px-6 py-5">Role</th>
                        <th className="px-6 py-5">Stats</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="text-sm hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5" alt={user.name} />
                              <div>
                                <p className="font-extrabold">{user.name}</p>
                                <p className="text-[10px] text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                              user.role === 'professor' ? 'bg-purple-500/10 text-purple-500' :
                                'bg-apple-blue/10 text-apple-blue'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-gray-500">
                              <div className="flex items-center gap-1.5" title="Total Posts">
                                <MessageSquare size={14} />
                                <span className="font-bold text-xs">{user.post_count}</span>
                              </div>
                              <div className="flex items-center gap-1.5" title="Total Projects">
                                <Zap size={14} />
                                <span className="font-bold text-xs">{user.project_count}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {user.role !== 'admin' && (
                                <button onClick={() => setEditingUser(user)} className="p-2 text-gray-500 hover:text-white transition-colors">
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {editingUser && (
            <UserEditModal
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onSave={handleUpdateUser}
            />
          )}

          {activeTab === 'posts' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.filter(p => !searchQuery || p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(post => {
                  const attachments = post.attachments ? JSON.parse(post.attachments) : [];
                  const sessionData = post.session_data ? JSON.parse(post.session_data) : null;
                  return (
                    <GlassCard key={post.id} className="p-6 flex flex-col h-full border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img src={post.author_avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">{post.author_name}</p>
                              <span className="text-[8px] font-black uppercase tracking-widest text-apple-blue px-1.5 py-0.5 bg-apple-blue/10 rounded-md">
                                {post.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-4">
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                        {attachments.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {attachments.slice(0, 4).map((att: any, idx: number) => (
                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-white/5 group/att">
                                {att.file_type === 'photo' ? (
                                  <img src={att.file_path?.startsWith('data:') ? att.file_path : `http://localhost:3001${att.file_path}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <a
                                    href={att.file_path?.startsWith('data:') ? att.file_path : `http://localhost:3001${att.file_path}`}
                                    download={att.file_name || 'Document'}
                                    className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 hover:bg-white/10 transition-colors"
                                  >
                                    <FileText size={20} className="text-apple-blue" />
                                    <p className="text-[9px] text-gray-400 truncate w-full text-center px-1">{att.file_name || 'Document'}</p>
                                    <Download size={12} className="text-gray-500" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {sessionData && (
                          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 mt-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-indigo-400 truncate">{sessionData.course_name}</h5>
                              <Calendar size={12} className="text-indigo-400" />
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{sessionData.topics}</p>
                            <div className="flex items-center gap-3 text-[10px]">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock size={10} />
                                <span>{sessionData.start_time}</span>
                              </div>
                              {sessionData.meeting_link && (
                                <a href={sessionData.meeting_link} target="_blank" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
                                  <LinkIcon size={10} />
                                  <span>Join</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all font-medium"
                  />
                </div>
              </div>
              <GlassCard className="overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                      <tr>
                        <th className="px-6 py-5">Project Title</th>
                        <th className="px-6 py-5">Owner</th>
                        <th className="px-6 py-5">Trimester</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.filter(pr => !searchQuery || pr.title?.toLowerCase().includes(searchQuery.toLowerCase()) || pr.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(project => (
                        <tr key={project.id} className="text-sm hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4 font-bold">{project.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <img src={project.owner_avatar} className="w-6 h-6 rounded-lg" alt="" />
                              <span className="text-gray-400">{project.owner_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-gray-500">{project.trimester} {project.year}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded font-bold uppercase">{project.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.filter(r => !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.subject?.toLowerCase().includes(searchQuery.toLowerCase())).map(resource => (
                  <GlassCard key={resource.id} className="p-6 relative group border-white/5 hover:border-white/10 overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleDeleteResource(resource.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 flex items-center justify-center mb-6 border border-apple-blue/20">
                      <FileText className="text-apple-blue" size={24} />
                    </div>

                    <h4 className="font-bold text-sm mb-1 truncate">{resource.title}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 truncate">{resource.subject}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Type:</span>
                        <span className="font-bold text-gray-300 uppercase">{resource.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Term:</span>
                        <span className="font-bold text-gray-300">{resource.trimester} {resource.year}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Faculty:</span>
                        <span className="font-bold text-gray-300">{resource.faculty || 'AI Extracted'}</span>
                      </div>
                    </div>

                    <a
                      href={`http://localhost:3001${resource.file_path}`}
                      download={resource.title}
                      className="w-full py-2.5 bg-white/5 hover:bg-apple-blue hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Download Resource
                    </a>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
