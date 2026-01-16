
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomeView } from './views/Home';
import { TutorView } from './views/Tutor';
import { LibraryView } from './views/Library';
import { AdminView } from './views/Admin';
import { AuthView } from './views/Auth';
import { ProjectsView } from './views/Projects';
import { ProfileView } from './views/Profile';
import { SettingsView } from './views/Settings';
import { NotificationsView } from './views/Notifications';
import { AppView, User } from './types';
import { Zap, Sparkles } from 'lucide-react';

import { ToastProvider } from './components/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.LOGIN);
  const [isInitializing, setIsInitializing] = useState(true);
  const [previousView, setPreviousView] = useState<AppView>(AppView.HOME);

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

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const navigateTo = (view: AppView) => {
    if (view === AppView.PROFILE || view === AppView.SETTINGS || view === AppView.NOTIFICATIONS) {
      setPreviousView(activeView);
    }
    setActiveView(view);
  };

  const goBack = () => {
    setActiveView(previousView);
  };

  const isDark = theme === 'dark';

  if (isInitializing) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="w-12 h-12 apple-gradient rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Auth Guard
  if (!user && (activeView === AppView.LOGIN || activeView === AppView.REGISTER)) {
    return (
      <AuthView
        view={activeView as AppView.LOGIN | AppView.REGISTER}
        onAuthSuccess={handleAuthSuccess}
        onSwitchView={setActiveView}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case AppView.HOME: return <HomeView user={user} />;
      case AppView.TUTOR: return <TutorView />;
      case AppView.LIBRARY: return <LibraryView />;
      case AppView.ADMIN: return <AdminView />;
      case AppView.PROJECTS: return <ProjectsView user={user} />;
      case AppView.PROFILE: return <ProfileView user={user!} onBack={goBack} onUpdateUser={handleUpdateUser} />;
      case AppView.SETTINGS: return <SettingsView user={user!} onBack={goBack} onLogout={handleLogout} />;
      case AppView.NOTIFICATIONS: return <NotificationsView onBack={goBack} onOpenSettings={() => setActiveView(AppView.SETTINGS)} />;
      default: return <HomeView user={user} />;
    }
  };

  return (
    <Layout
      activeView={activeView}
      setActiveView={navigateTo}
      user={user}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
