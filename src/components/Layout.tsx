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
    <div className="flex min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800 flex flex-col py-6 px-4 shrink-0 hidden md:flex">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-600/20">N</div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">SmartNotice</span>
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

        <div className="mt-auto p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3">Auth Session</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">{user?.displayName || 'Dr. Admin'}</div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{profile?.role || 'Senior Admin'}</div>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full py-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 bg-slate-950/50 backdrop-blur-sm relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight italic uppercase leading-none">Campus Feed</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} • AI Secure
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-2 rounded-full mx-8">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="SCANNING NETWORK..." 
              className="bg-transparent text-[10px] text-slate-400 font-mono focus:outline-none w-48 uppercase tracking-widest"
            />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.role === 'teacher' && (
              <button 
                onClick={() => onNavigate('create')}
                className="btn-primary"
              >
                + New Notice
              </button>
            )}
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center relative hover:bg-slate-800 cursor-pointer transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]"></span>
            </div>
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
