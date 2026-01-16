
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomeView } from './views/Home';
import { TutorView } from './views/Tutor';
import { LibraryView } from './views/Library';
import { AdminView } from './views/Admin';
import { AuthView } from './views/Auth';
import { ProjectsView } from './views/Projects';
import { AppView, User } from './types';
import { Zap, Sparkles } from 'lucide-react';

import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.LOGIN);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check local session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setActiveView(AppView.HOME);
    }
    setIsInitializing(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setActiveView(AppView.HOME);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setActiveView(AppView.LOGIN);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 apple-gradient rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Auth Guard
  if (!user && (activeView === AppView.LOGIN || activeView === AppView.REGISTER)) {
    return (
      <ToastProvider>
        <AuthView
          view={activeView as AppView.LOGIN | AppView.REGISTER}
          onAuthSuccess={handleAuthSuccess}
          onSwitchView={setActiveView}
        />
      </ToastProvider>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case AppView.HOME: return <HomeView user={user} />;
      case AppView.TUTOR: return <TutorView />;
      case AppView.LIBRARY: return <LibraryView />;
      case AppView.ADMIN: return <AdminView />;
      case AppView.PROJECTS: return <ProjectsView user={user} />;
      default: return <HomeView />;
    }
  };

  return (
    <ToastProvider>
      <Layout
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onLogout={handleLogout}
      >
        {renderView()}
      </Layout>
    </ToastProvider>
  );
};

export default App;
