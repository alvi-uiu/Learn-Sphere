
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
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [projectSourceView, setProjectSourceView] = useState<AppView>(AppView.PROJECTS);

  useEffect(() => {
    // Check local session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUser(user);
      setActiveView(user.role === 'admin' ? AppView.ADMIN : AppView.HOME);
    }
    setIsInitializing(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setActiveView(authenticatedUser.role === 'admin' ? AppView.ADMIN : AppView.HOME);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setActiveView(AppView.LOGIN);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // 1. Update local state
    setUser(updatedUser);

    // 2. Persist to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // 3. Persist to Database
    try {
      await fetch(`http://localhost:3001/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          major: updatedUser.major,
          studentId: updatedUser.studentId,
          isIdVisible: updatedUser.isIdVisible,
          isEmailVisible: updatedUser.isEmailVisible
        })
      });
      console.log('User profile persisted to database');
    } catch (e) {
      console.error('Failed to persist user profile update:', e);
    }
  };

  const handleViewProject = (projectId: string) => {
    setPendingProjectId(projectId);
    setProjectSourceView(activeView); // Remember where we came from
    setActiveView(AppView.PROJECTS);
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveView(AppView.PROFILE);
  };

  const navigateTo = (view: AppView) => {
    if (view === AppView.PROFILE) {
      setViewingUserId(null); // Reset to "My Profile"
    }
    if (view === AppView.PROFILE || view === AppView.SETTINGS || view === AppView.NOTIFICATIONS) {
      setPreviousView(activeView);
    }
    setActiveView(view);
  };

  const goBack = () => {
    setActiveView(previousView);
  };

  const goBackFromProject = () => {
    setPendingProjectId(null);
    setActiveView(projectSourceView);
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
      case AppView.HOME: return <HomeView user={user} onViewProfile={handleViewProfile} />;
      case AppView.TUTOR: return <TutorView />;
      case AppView.LIBRARY: return <LibraryView />;
      case AppView.ADMIN: return <AdminView />;
      case AppView.PROJECTS: return <ProjectsView user={user} initialProjectId={pendingProjectId} onBackFromProject={goBackFromProject} />;
      case AppView.PROFILE: return <ProfileView user={user!} onBack={goBack} onUpdateUser={handleUpdateUser} onViewProject={handleViewProject} viewingUserId={viewingUserId} />;
      case AppView.SETTINGS: return <SettingsView user={user!} onBack={goBack} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
      case AppView.NOTIFICATIONS: return <NotificationsView onBack={goBack} />;
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
