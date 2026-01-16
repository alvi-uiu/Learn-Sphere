
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Heart, MessageCircle, TrendingUp, Calendar,
  Bookmark, Target, CheckCircle2, Layout, FileText,
  Plus, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Post } from '../types';
import { useToast } from '../components/Toast';
import { db } from '../services/db';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { useTheme } from '../contexts/ThemeContext';

const MOCK_POSTS: Post[] = []; // Removed, mock data is now in db service


import { formatRelativeTime } from '../utils/date';

interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  targetMinutes?: number;
  completedMinutes?: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  meetingLink?: string;
}

interface HomeViewProps {
  user: any;
}

export const HomeView: React.FC<HomeViewProps> = ({ user }) => {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  // Comments State (Handled by PostCard now)
  const [currentUser, setCurrentUser] = useState<any>(user || {});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const FILTERS = ['All', 'Academic', 'Motivational', 'Tips', 'Session', 'Saved'];

  // Daily Goals State
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
    const saved = localStorage.getItem('dailyGoals');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', title: 'Study for 60 minutes', completed: false, targetMinutes: 60, completedMinutes: 0 },
      { id: '2', title: 'Review lecture notes', completed: false },
    ];
  });
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Upcoming Sessions State
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Trending Topics State
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
    loadPosts();
    loadUpcomingSessions();
  }, [user]);

  // Save daily goals to localStorage
  useEffect(() => {
    localStorage.setItem('dailyGoals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  // Calculate trending topics based on likes and comments
  useEffect(() => {
    if (posts.length > 0) {
      const categoryStats: Record<string, { likes: number; comments: number; count: number }> = {};
      
      posts.forEach(post => {
        const cat = post.category || 'General';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { likes: 0, comments: 0, count: 0 };
        }
        categoryStats[cat].likes += post.likes;
        categoryStats[cat].comments += post.comments;
        categoryStats[cat].count++;
      });

      const trending = Object.entries(categoryStats)
        .map(([topic, stats]) => ({
          topic,
          engagement: stats.likes + stats.comments,
          posts: stats.count,
          trend: Math.round((stats.likes / Math.max(stats.count, 1)) * 10)
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 4);

      setTrendingTopics(trending);
    }
  }, [posts]);

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

  const loadUpcomingSessions = async () => {
    // Load sessions from posts with sessionData
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`http://localhost:3001/api/posts?userId=${user.id || ''}`);
      const allPosts = await res.json();
      const sessions = allPosts
        .filter((p: any) => p.sessionData)
        .map((p: any) => ({
          id: p.id,
          title: p.sessionData.course_name || 'Study Session',
          date: p.sessionData.start_time?.split(' ')[0] || 'TBD',
          time: p.sessionData.start_time || 'TBD',
          participants: ['You'],
          meetingLink: p.sessionData.meeting_link
        }))
        .slice(0, 5);
      setUpcomingSessions(sessions);
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  // Daily Goal handlers
  const toggleGoalComplete = (goalId: string) => {
    setDailyGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, completed: !g.completed } : g
    ));
    showToast('Goal updated!', 'success');
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: DailyGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      completed: false
    };
    setDailyGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setIsAddingGoal(false);
    showToast('Goal added!', 'success');
  };

  const deleteGoal = (goalId: string) => {
    setDailyGoals(prev => prev.filter(g => g.id !== goalId));
    showToast('Goal removed', 'success');
  };

  const resetDailyGoals = () => {
    setDailyGoals([]);
    localStorage.removeItem('dailyGoals');
    showToast('Daily goals cleared!', 'success');
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
                    <div className={`absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'}`}></div>
                  </div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name || 'Guest'}</h3>
                  <p className="text-xs text-gray-500">{user.role || 'Student'} • {user.major || 'Visitor'}</p>
                </>
              );
            })()}
          </div>

          <div className={`mt-8 pt-8 border-t ${isDark ? 'border-white/5' : 'border-gray-200'} space-y-3`}>
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'All' ? (isDark ? 'bg-white/10 text-white' : 'bg-apple-blue/10 text-apple-blue font-bold') : (isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`} onClick={() => setFilter('All')}>
              <div className="flex items-center gap-2"><Layout size={14} /> <span>All Posts</span></div>
            </div>
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'Session' ? (isDark ? 'bg-white/10 text-white' : 'bg-apple-blue/10 text-apple-blue font-bold') : (isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`} onClick={() => setFilter('Session')}>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> <span>Sessions</span></div>
            </div>
            <div className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer group ${filter === 'Saved' ? (isDark ? 'bg-white/10 text-white' : 'bg-apple-blue/10 text-apple-blue font-bold') : (isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`} onClick={() => setFilter('Saved')}>
              <div className="flex items-center gap-2">
                <Bookmark size={14} /> <span>Saved Resources</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>{posts.filter(p => p.isSaved).length}</span>
            </div>
          </div>

          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
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

        {/* Daily Goal - Interactive */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Daily Goals</h4>
            <div className="flex gap-2">
              <button
                onClick={resetDailyGoals}
                className="text-[10px] text-gray-400 hover:text-apple-blue transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsAddingGoal(true)}
                className="p-1 bg-apple-blue/10 rounded-lg text-apple-blue hover:bg-apple-blue/20 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-bold text-apple-blue">
                {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length} done
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
              <div 
                className="h-full apple-gradient transition-all duration-500"
                style={{ width: `${dailyGoals.length > 0 ? (dailyGoals.filter(g => g.completed).length / dailyGoals.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {dailyGoals.map(goal => (
              <div 
                key={goal.id} 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${goal.completed ? 'bg-green-500/10' : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100')}`}
                onClick={() => toggleGoalComplete(goal.id)}
              >
                <div className={`p-1.5 rounded-lg ${goal.completed ? 'bg-green-500/20 text-green-500' : (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-400')}`}>
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${goal.completed ? 'line-through text-gray-400' : (isDark ? 'text-white' : 'text-gray-900')}`}>{goal.title}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add Goal Input */}
            {isAddingGoal && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  placeholder="New goal..."
                  className={`flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue ${
                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'
                  }`}
                  autoFocus
                />
                <button onClick={addGoal} className="px-3 py-2 bg-apple-blue text-white rounded-lg text-xs font-bold">Add</button>
                <button onClick={() => setIsAddingGoal(false)} className="px-2 py-2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            )}
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
              className={`flex-1 rounded-xl p-3 text-sm text-gray-500 cursor-text transition-colors ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              What's on your mind, {currentUser.name?.split(' ')[0] || 'Student'}?
            </div>
          </div>
          <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <div className="flex gap-1">
              <button onClick={() => setIsCreateModalOpen(true)} className={`p-2 rounded-xl transition-colors flex items-center gap-2 ${isDark ? 'hover:bg-white/5 text-indigo-400' : 'hover:bg-gray-100 text-indigo-500'}`}>
                <Calendar size={18} />
                <span className="text-xs font-medium hidden sm:inline">Session</span>
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className={`p-2 rounded-xl transition-colors flex items-center gap-2 ${isDark ? 'hover:bg-white/5 text-green-500' : 'hover:bg-gray-100 text-green-600'}`}>
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
                ? 'bg-apple-blue text-white'
                : isDark 
                  ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
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
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No posts found for "{filter}"</p>
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
          <h4 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp size={16} className="text-apple-blue" />
            Trending Topics
          </h4>
          <div className="space-y-4">
            {trendingTopics.length > 0 ? trendingTopics.map((t, i) => (
              <div key={i} className="group cursor-pointer" onClick={() => setFilter(t.topic)}>
                <p className={`text-xs font-bold group-hover:text-apple-blue transition-colors ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>#{t.topic.replace(/\s+/g, '')}</p>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>{t.posts} posts • {t.engagement} engagements</span>
                  <span className="text-green-500 font-bold">+{t.trend}%</span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-500 italic">No trending topics yet</p>
            )}
          </div>
        </GlassCard>

        {/* Upcoming Sessions - Card Carousel */}
        <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Upcoming Sessions</h4>
            <Calendar size={16} className="text-indigo-400" />
          </div>
          
          {upcomingSessions.length > 0 ? (
            <div className="relative">
              {/* Session Card */}
              <div className={`p-4 rounded-2xl border hover:shadow-lg transition-all ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
              }`}>
                <p className="text-[10px] text-indigo-500 font-bold uppercase mb-2">
                  {upcomingSessions[currentSessionIndex]?.date} • {upcomingSessions[currentSessionIndex]?.time}
                </p>
                <h5 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{upcomingSessions[currentSessionIndex]?.title}</h5>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <img 
                        key={i} 
                        src={`https://picsum.photos/seed/${i + currentSessionIndex * 10}/30/30`} 
                        className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'}`} 
                        alt="Participant"
                      />
                    ))}
                  </div>
                  {upcomingSessions[currentSessionIndex]?.meetingLink && (
                    <a
                      href={upcomingSessions[currentSessionIndex].meetingLink}
                      target="_blank"
                      className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-colors"
                    >
                      Join
                    </a>
                  )}
                </div>
              </div>

              {/* Navigation */}
              {upcomingSessions.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => setCurrentSessionIndex(prev => prev > 0 ? prev - 1 : upcomingSessions.length - 1)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="flex gap-1">
                    {upcomingSessions.map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentSessionIndex ? 'bg-indigo-500 w-4' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentSessionIndex(prev => prev < upcomingSessions.length - 1 ? prev + 1 : 0)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar size={32} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className="text-xs text-gray-500">No upcoming sessions</p>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-3 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition-colors"
              >
                Create Session
              </button>
            </div>
          )}
        </GlassCard>

        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-40">
            {['About', 'Help', 'Privacy', 'Terms', 'Academic Policy'].map(link => (
              <span key={link} className={`text-[10px] hover:underline cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{link}</span>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-4 font-mono uppercase tracking-widest">© 2024 LearnSphere Inc.</p>
        </div>
      </div>

    </div>
  );
};
