
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Heart, MessageCircle, Share2, TrendingUp, Calendar, Filter,
  Image as ImageIcon, Paperclip, MoreHorizontal, Bookmark,
  Award, Target, Users as UsersIcon, CheckCircle2, ArrowRight, Layout, FileText
} from 'lucide-react';
import { Post } from '../types';
import { useToast } from '../components/Toast';
import { db } from '../services/db';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';

const MOCK_POSTS: Post[] = []; // Removed, mock data is now in db service


import { formatRelativeTime } from '../utils/date';

interface HomeViewProps {
  user: any;
}

export const HomeView: React.FC<HomeViewProps> = ({ user }) => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  // Comments State (Handled by PostCard now)
  const [currentUser, setCurrentUser] = useState<any>(user || {});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const FILTERS = ['All', 'Academic', 'Motivational', 'Tips', 'Session', 'Saved'];

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      const res = await fetch(`http://localhost:3001/api/posts?userId=${user.id}`);
      const data = await res.json();
      setPosts(data);
    } else {
      const data = await db.getPosts();
      setPosts(data);
    }
  };



  const displayedPosts = posts.filter(post => {
    if (filter === 'All') return true;
    if (filter === 'Saved') return post.isSaved;
    return post.category === filter;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleCreatePostSuccess = () => {
    loadPosts();
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ... Left Sidebar remains same ... */}
      {/* Left Sidebar: User Stats & Navigation */}
      <div className="hidden lg:block lg:col-span-3 space-y-6">
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Dynamic User Profile */}
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              return (
                <>
                  <div className="relative">
                    <img src={user.avatar || "https://picsum.photos/seed/user1/100/100"} className="w-20 h-20 rounded-3xl border-2 border-apple-blue shadow-xl mb-4" alt="Me" />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black"></div>
                  </div>
                  <h3 className="font-bold text-lg">{user.name || 'Guest'}</h3>
                  <p className="text-xs text-gray-500">{user.role || 'Student'} • {user.major || 'Visitor'}</p>
                </>
              );
            })()}

            <div className="w-full mt-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Knowledge Level</span>
                <span className="font-bold text-apple-blue">Lvl 12</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[65%] h-full apple-gradient"></div>
              </div>
              <p className="text-[10px] text-gray-600 text-center">350 XP until next level</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'All' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`} onClick={() => setFilter('All')}>
              <div className="flex items-center gap-2"><Layout size={14} /> <span>All Posts</span></div>
            </div>
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'Session' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`} onClick={() => setFilter('Session')}>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> <span>Sessions</span></div>
            </div>
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'Saved' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`} onClick={() => setFilter('Saved')}>
              <div className="flex items-center gap-2">
                <Bookmark size={14} /> <span>Saved Resources</span>
              </div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{posts.filter(p => p.isSaved).length}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => {
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all"
            >
              Logout
            </button>
          </div>
        </GlassCard>

        {/* Daily Goal (Static for demo) */}
        <GlassCard className="p-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Daily Goal</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold">Finish Calc HW</p>
                <p className="text-[10px] text-gray-500">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-apple-blue/10 rounded-lg text-apple-blue">
                <Target size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold">Study AI Logic</p>
                <p className="text-[10px] text-gray-500">45/60 mins</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-6 space-y-6">

        {/* Create Post Action */}
        <GlassCard className="p-5 border-apple-blue/20">
          <div className="flex gap-4">
            <img src={currentUser.avatar || "https://picsum.photos/seed/user1/40/40"} className="w-10 h-10 rounded-2xl" alt="Me" />
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 bg-white/5 rounded-xl p-3 text-sm text-gray-500 cursor-text hover:bg-white/10 transition-colors"
            >
              What's on your mind, {currentUser.name?.split(' ')[0] || 'Student'}?
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <div className="flex gap-1">
              <button onClick={() => setIsCreateModalOpen(true)} className="p-2 hover:bg-white/5 rounded-xl text-indigo-400 transition-colors flex items-center gap-2">
                <Calendar size={18} />
                <span className="text-xs font-medium hidden sm:inline">Session</span>
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className="p-2 hover:bg-white/5 rounded-xl text-green-500 transition-colors flex items-center gap-2">
                <FileText size={18} />
                <span className="text-xs font-medium hidden sm:inline">Document</span>
              </button>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="apple-gradient text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-apple-blue/20"
            >
              Create Post
            </button>
          </div>
        </GlassCard>

        {/* Feed Sort / Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {displayedPosts.length > 0 ? displayedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onUpdate={handlePostUpdate}
              onDelete={handlePostDelete}
            />
          )) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No posts found for "{filter}"</p>
            </div>
          )}
        </div>

      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handleCreatePostSuccess}
        user={currentUser}
      />


      {/* Right Sidebar: Recommended & Upcoming */}
      <div className="hidden lg:block lg:col-span-3 space-y-6">
        <GlassCard className="p-6">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-apple-blue" />
            Trending Topics
          </h4>
          <div className="space-y-4">
            {[
              { topic: 'Large Language Models', posts: '2.4k', trend: '+12%' },
              { topic: 'Advanced Calculus II', posts: '1.1k', trend: '+5%' },
              { topic: 'Thesis Writing Tips', posts: '850', trend: '+28%' },
              { topic: 'Student Internships', posts: '3.2k', trend: '+15%' },
            ].map((t, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-xs font-bold text-gray-200 group-hover:text-apple-blue transition-colors">#{t.topic.replace(/\s+/g, '')}</p>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>{t.posts} posts</span>
                  <span className="text-green-500 font-bold">{t.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm">Upcoming Sessions</h4>
            <Calendar size={16} className="text-indigo-400" />
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Tomorrow • 10:00 AM</p>
              <h5 className="text-xs font-bold mb-2">CS402 Group Revision</h5>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => <img key={i} src={`https://picsum.photos/seed/${i + 20}/30/30`} className="w-6 h-6 rounded-full border-2 border-black" />)}
              </div>
            </div>
            <button className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold transition-all">
              View Calendar
            </button>
          </div>
        </GlassCard>

        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-40">
            {['About', 'Help', 'Privacy', 'Terms', 'Academic Policy'].map(link => (
              <span key={link} className="text-[10px] hover:underline cursor-pointer">{link}</span>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-4 font-mono uppercase tracking-widest">© 2024 LearnSphere Inc.</p>
        </div>
      </div>

    </div>
  );
};
