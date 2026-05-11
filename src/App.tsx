import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateNotice from './pages/CreateNotice';
import NoticeDetails from './pages/NoticeDetails';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import { Notice } from './types';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'create' | 'analytics' | 'details'>('landing');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onStart={() => setCurrentView('landing')} />;
  }

  if (!profile) {
    return <AuthPage />;
  }

  const navigateTo = (view: any, notice: Notice | null = null) => {
    setCurrentView(view);
    setSelectedNotice(notice);
  };

  return (
    <Layout currentView={currentView} onNavigate={navigateTo}>
      {currentView === 'landing' && <Dashboard onNavigate={navigateTo} />}
      {currentView === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
