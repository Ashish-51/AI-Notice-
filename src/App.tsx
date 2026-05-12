import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateNotice from './pages/CreateNotice';
import NoticeDetails from './pages/NoticeDetails';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import { Notice } from './types';
import { Logo } from './components/Logo';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'create' | 'analytics' | 'details'>('landing');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Logo className="w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (currentView === 'auth') {
      return <AuthPage onBackToLanding={() => setCurrentView('landing')} />;
    }
    return <LandingPage onStart={() => setCurrentView('auth')} />;
  }

  // Logged in but no profile (e.g. first time Google user)
  if (!profile) {
    return <AuthPage initialView="complete-profile" />;
  }

  const navigateTo = (view: any, notice: Notice | null = null) => {
    setCurrentView(view);
    setSelectedNotice(notice);
  };

  return (
    <Layout 
      currentView={currentView === 'landing' || currentView === 'auth' ? 'dashboard' : currentView} 
      onNavigate={navigateTo}
    >
      {(currentView === 'landing' || currentView === 'dashboard') && <Dashboard onNavigate={navigateTo} />}
      {currentView === 'create' && <CreateNotice onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'analytics' && <Analytics />}
      {currentView === 'details' && selectedNotice && (
        <NoticeDetails notice={selectedNotice} onBack={() => setCurrentView('dashboard')} />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
