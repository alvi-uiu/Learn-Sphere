
import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  MessageSquare,
  Layout as DashboardIcon,
  Zap,
  ShieldCheck,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
  Moon,
  Sun
} from 'lucide-react';
import { AppView, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for notifications every 1 second
  useEffect(() => {
    if (!user?.id) return;

    const pollNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/notifications?userId=${user.id}`);
        const data = await res.json();
        const unread = data.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Failed to poll notifications:', e);
      }
    };

    pollNotifications(); // Initial fetch
    const interval = setInterval(pollNotifications, 1000); // Poll every 1 second

    return () => clearInterval(interval); // Cleanup
  }, [user?.id]);

  const navItems = user?.role === 'admin'
    ? [
      { id: AppView.ADMIN, icon: ShieldCheck, label: 'Admin Hub' }
    ]
    : [
      { id: AppView.HOME, icon: Home, label: 'Academic Feed' },
      { id: AppView.TUTOR, icon: MessageSquare, label: 'AI Tutor' },
      { id: AppView.LIBRARY, icon: BookOpen, label: 'Library' },
      { id: AppView.PROJECTS, icon: Zap, label: 'Projects' },
    ];

  return (
    <div className={`min-h-screen flex flex-col ${user?.role !== 'admin' ? 'md:flex-row' : ''} ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Desktop Sidebar */}
      {user?.role !== 'admin' && (
        <aside className={`hidden md:flex flex-col w-72 p-6 space-y-10 sticky top-0 h-screen z-50 ${isDark ? 'bg-black/50 backdrop-blur-xl border-r border-white/10' : 'bg-white border-r border-gray-200 shadow-sm'
          }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 apple-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-apple-blue/20">
              <DashboardIcon className="text-white" size={28} />
            </div>
            <span className={`text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white to-gray-500' : 'from-gray-900 to-gray-500'
              }`}>
              LearnSphere
            </span>
          </div>

          <nav className="flex-1 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${activeView === item.id
                  ? 'bg-apple-blue/10 text-apple-blue border border-apple-blue/20'
                  : isDark
                    ? 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                  }`}
              >
                <item.icon size={22} className={activeView === item.id ? 'text-apple-blue' : isDark ? 'group-hover:text-gray-300' : 'group-hover:text-gray-700'} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                {activeView === item.id && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,122,255,0.8)]"></div>
                )}
              </button>
            ))}
          </nav>


          <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} space-y-2`}>
            <button
              onClick={() => setActiveView(AppView.SETTINGS)}
              className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 group ${activeView === AppView.SETTINGS
                ? 'bg-apple-blue/10 text-apple-blue border border-apple-blue/20'
                : isDark ? 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                }`}
            >
              <Settings size={22} className={activeView === AppView.SETTINGS ? 'text-apple-blue' : isDark ? 'group-hover:text-gray-300' : 'group-hover:text-gray-700'} />
              <span className="font-bold text-sm tracking-wide">Settings</span>
            </button>

            <button
              onClick={onLogout}
              className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 group ${isDark ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent' : 'text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent'
                }`}
            >
              <LogOut size={22} className={isDark ? 'group-hover:text-red-300' : 'group-hover:text-red-600'} />
              <span className="font-bold text-sm tracking-wide">Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 flex flex-col h-screen scrollbar-hide">
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-[40] backdrop-blur-xl px-6 md:px-10 py-5 flex items-center justify-between ${isDark ? 'bg-black/80 border-b border-white/5' : 'bg-white/80 border-b border-gray-200'
          }`}>
          <div className={`${user?.role === 'admin' ? 'flex' : 'flex md:hidden'} items-center space-x-3`}>
            <div className="w-10 h-10 apple-gradient rounded-xl flex items-center justify-center shadow-lg">
              <DashboardIcon className="text-white" size={22} />
            </div>
            <span className={`font-black text-xl tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>LearnSphere {user?.role === 'admin' && <span className="text-[10px] ml-2 px-2 py-0.5 bg-apple-blue/10 text-apple-blue rounded-md uppercase tracking-widest">Admin</span>}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                }`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>

            {/* Notifications */}
            {user?.role !== 'admin' && (
              <>
                <button
                  onClick={() => setActiveView(AppView.NOTIFICATIONS)}
                  className={`p-3 rounded-2xl transition-all relative group ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                    }`}
                >
                  <Bell size={20} className={isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'} />
                  {unreadCount > 0 && (
                    <span className={`absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'}`}></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView(AppView.PROFILE)}
                  className={`relative w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all ${activeView === AppView.PROFILE
                    ? 'border-apple-blue shadow-[0_0_0_4px_rgba(0,122,255,0.15)]'
                    : isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <img src={user?.avatar || "https://ui-avatars.com/api/?name=" + user?.name} className="w-full h-full object-cover" alt="Profile" />
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={onLogout}
                className={`p-3 rounded-2xl transition-all flex items-center gap-2 group ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                  }`}
              >
                <LogOut size={20} />
                <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Logout</span>
              </button>
            )}

            {user?.role !== 'admin' && (
              <button className={`md:hidden p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <Menu size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
              </button>
            )}
          </div>
        </header>

        <div className={`p-6 md:p-10 flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {user?.role !== 'admin' && (
        <nav className={`md:hidden fixed bottom-4 left-4 right-4 h-20 flex items-center justify-around px-2 rounded-[28px] z-50 shadow-xl ${isDark ? 'bg-black/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-gray-200'
          }`}>
          {(user?.role === 'admin' ? navItems : navItems.slice(0, 4)).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center ${user?.role === 'admin' ? 'w-full' : 'w-16'} h-16 rounded-2xl transition-all ${activeView === item.id
                ? 'bg-apple-blue/10 text-apple-blue'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <item.icon size={22} className={activeView === item.id ? 'animate-in zoom-in duration-300' : ''} />
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveView(AppView.PROFILE)}
            className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${activeView === AppView.PROFILE
              ? 'border-apple-blue'
              : isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
          >
            <img src={user?.avatar} className="w-full h-full object-cover" alt="Profile" />
          </button>
        </nav>
      )}
    </div>
  );
};
