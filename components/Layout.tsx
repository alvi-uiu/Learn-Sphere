
import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  Layout as DashboardIcon, 
  Users, 
  Zap, 
  ShieldCheck,
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { AppView, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, user, onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { id: AppView.HOME, icon: Home, label: 'Academic Feed' },
    { id: AppView.TUTOR, icon: MessageSquare, label: 'AI Tutor' },
    { id: AppView.LIBRARY, icon: BookOpen, label: 'Library' },
    { id: AppView.PROJECTS, icon: Zap, label: 'Projects' },
    ...(user?.role === 'admin' ? [{ id: AppView.ADMIN, icon: ShieldCheck, label: 'Admin Hub' }] : []),
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 glass border-r border-white/10 p-6 space-y-10 sticky top-0 h-screen z-50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 apple-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-apple-blue/20">
            <DashboardIcon className="text-white" size={28} />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
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
                  ? 'bg-apple-blue/10 text-white border border-apple-blue/20' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeView === item.id ? 'text-apple-blue' : 'group-hover:text-gray-300'} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {activeView === item.id && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,122,255,0.8)]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 glass border-white/5 rounded-2xl hover:border-white/20 transition-all cursor-pointer group relative">
             <div className="relative">
                <img src={user?.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="Profile" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-black"></div>
             </div>
             <div className="flex-1 min-w-0" onClick={() => setProfileOpen(!profileOpen)}>
                <p className="text-xs font-black truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{user?.major}</p>
             </div>
             <ChevronDown size={14} className={`text-gray-600 group-hover:text-white transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
             
             {/* Profile Popover */}
             {profileOpen && (
               <div className="absolute bottom-full left-0 w-full mb-3 glass border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all">
                    <UserIcon size={14} /> Profile
                 </button>
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all">
                    <Settings size={14} /> Settings
                 </button>
                 <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs text-red-400 hover:text-red-300 transition-all border-t border-white/5 mt-1"
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
        <header className="sticky top-0 z-[40] glass border-b border-white/5 px-6 md:px-10 py-5 flex items-center justify-between backdrop-blur-3xl">
          <div className="md:hidden flex items-center space-x-3">
             <div className="w-10 h-10 apple-gradient rounded-xl flex items-center justify-center shadow-lg">
                <DashboardIcon className="text-white" size={22} />
             </div>
             <span className="font-black text-xl tracking-tighter">LearnSphere</span>
          </div>
          
          <div className="flex-1 max-w-2xl mx-10 relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Discover resources, concepts, and peers..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/50 transition-all text-sm shadow-inner"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col items-end mr-2">
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Academic Rank</span>
               <span className="text-xs font-bold text-apple-blue">Pioneer Alpha</span>
            </div>
            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all relative group">
              <Bell size={20} className="text-gray-400 group-hover:text-white" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
            </button>
            <button className="md:hidden p-3 bg-white/5 rounded-2xl">
              <Menu size={20} />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-20 glass border border-white/10 flex items-center justify-around px-2 rounded-[28px] z-50 shadow-2xl">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
              activeView === item.id ? 'bg-apple-blue/10 text-apple-blue' : 'text-gray-500'
            }`}
          >
            <item.icon size={22} className={activeView === item.id ? 'animate-in zoom-in duration-300' : ''} />
            <span className="text-[10px] font-black uppercase tracking-tighter mt-1">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button 
          onClick={() => setActiveView(AppView.PROFILE)}
          className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${activeView === AppView.PROFILE ? 'border-apple-blue' : 'border-white/10'}`}
        >
          <img src={user?.avatar} className="w-full h-full object-cover" alt="Profile" />
        </button>
      </nav>
    </div>
  );
};
