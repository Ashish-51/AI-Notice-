import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Bell, 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  LogOut, 
  User,
  Search,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import Chatbot from './Chatbot';
import ThemeToggle from './ThemeToggle';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'New Notice', icon: PlusCircle, roles: ['teacher'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['teacher'] },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] selection:bg-blue-500/30 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card-bg)] border-r border-[var(--border-color)] flex flex-col py-6 px-4 shrink-0 hidden md:flex backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2 mb-10">
          <Logo className="w-8 h-8 text-blue-500 shadow-blue-600/20" />
          <span className="text-xl font-bold tracking-tighter uppercase italic text-[var(--text-primary)]">SmartNotice</span>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.filter(item => !item.roles || item.roles.includes(profile?.role || '')).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "nav-item w-full group",
                currentView === item.id && "nav-item-active"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", currentView === item.id ? "text-blue-400" : "group-hover:text-white")} />
              <span className={cn(currentView === item.id && "font-bold")}>{item.label}</span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-[var(--nav-hover)] rounded-2xl border border-[var(--border-color)]">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black mb-3">Auth Session</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate text-[var(--text-primary)]">{user?.displayName || 'Dr. Admin'}</div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{profile?.role || 'Senior Admin'}</div>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full py-2 px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 border-b border-[var(--border-color)] flex items-center justify-between px-8 shrink-0 bg-[var(--bg-surface)]/50 backdrop-blur-sm relative z-10 transition-colors duration-300">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight italic uppercase leading-none text-[var(--text-primary)]">Campus Feed</h1>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase font-bold tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} • AI Secure
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4 bg-[var(--bg-main)] border border-[var(--border-color)] px-5 py-2 rounded-full mx-8">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="SCANNING NETWORK..." 
              className="bg-transparent text-[10px] text-[var(--text-secondary)] font-mono focus:outline-none w-48 uppercase tracking-widest"
            />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
          </div>

            <div className="flex items-center gap-4">
            <ThemeToggle />
            {profile?.role === 'teacher' && (
              <button 
                onClick={() => onNavigate('create')}
                className="btn-primary"
              >
                + New Notice
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {children}
        </div>
      </main>

      <Chatbot />
    </div>
  );
}
