
import React, { useState } from 'react';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { id: AppView.HOME, icon: Home, label: 'Academic Feed' },
    { id: AppView.TUTOR, icon: MessageSquare, label: 'AI Tutor' },
    { id: AppView.LIBRARY, icon: BookOpen, label: 'Library' },
    { id: AppView.PROJECTS, icon: Zap, label: 'Projects' },
    ...(user?.role === 'admin' ? [{ id: AppView.ADMIN, icon: ShieldCheck, label: 'Admin Hub' }] : []),
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 p-6 space-y-10 sticky top-0 h-screen z-50 ${
        isDark ? 'bg-black/50 backdrop-blur-xl border-r border-white/10' : 'bg-white border-r border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 apple-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-apple-blue/20">
            <DashboardIcon className="text-white" size={28} />
          </div>
          <span className={`text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${
            isDark ? 'from-white to-gray-500' : 'from-gray-900 to-gray-500'
          }`}>
            LearnSphere
          </span>
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                activeView === item.id 
                  ? 'bg-apple-blue/10 text-apple-blue border border-apple-blue/20' 
                  : isDark 
                    ? 'text-gray-500 hover:bg-white/5 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

        <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group relative ${
            isDark ? 'bg-white/5 border border-white/5 hover:border-white/20' : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}>
             <div className="relative">
                <img src={user?.avatar} className={`w-10 h-10 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`} alt="Profile" />
                <div className={`absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'}`}></div>
             </div>
             <div className="flex-1 min-w-0" onClick={() => setProfileOpen(!profileOpen)}>
                <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{user?.major}</p>
             </div>
             <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-600 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
             
             {/* Profile Popover */}
             {profileOpen && (
               <div className={`absolute bottom-full left-0 w-full mb-3 rounded-2xl p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 ${
                 isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
               }`}>
                 <button 
                   onClick={() => { setActiveView(AppView.PROFILE); setProfileOpen(false); }}
                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                     isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`}
                 >
                    <UserIcon size={14} /> Profile
                 </button>
                 <button 
                   onClick={() => { setActiveView(AppView.SETTINGS); setProfileOpen(false); }}
                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                     isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`}
                 >
                    <Settings size={14} /> Settings
                 </button>
                 <button 
                  onClick={onLogout}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all border-t mt-1 ${
                    isDark ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 border-white/5' : 'text-red-500 hover:bg-red-50 hover:text-red-600 border-gray-200'
                  }`}
                 >
                    <LogOut size={14} /> Logout
                 </button>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 flex flex-col h-screen scrollbar-hide">
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-[40] backdrop-blur-xl px-6 md:px-10 py-5 flex items-center justify-between ${
          isDark ? 'bg-black/80 border-b border-white/5' : 'bg-white/80 border-b border-gray-200'
        }`}>
          <div className="md:hidden flex items-center space-x-3">
             <div className="w-10 h-10 apple-gradient rounded-xl flex items-center justify-center shadow-lg">
                <DashboardIcon className="text-white" size={22} />
             </div>
             <span className={`font-black text-xl tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>LearnSphere</span>
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-3 rounded-2xl transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
              }`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>

            {/* Notifications */}
            <button 
              onClick={() => setActiveView(AppView.NOTIFICATIONS)}
              className={`p-3 rounded-2xl transition-all relative group ${
                isDark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Bell size={20} className={isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'} />
              <span className={`absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'}`}></span>
            </button>
            
            <button className={`md:hidden p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <Menu size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-4 left-4 right-4 h-20 flex items-center justify-around px-2 rounded-[28px] z-50 shadow-xl ${
        isDark ? 'bg-black/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-gray-200'
      }`}>
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
              activeView === item.id 
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
          className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${
            activeView === AppView.PROFILE 
              ? 'border-apple-blue' 
              : isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <img src={user?.avatar} className="w-full h-full object-cover" alt="Profile" />
        </button>
      </nav>
    </div>
  );
};
