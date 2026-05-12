import React, { useState, useMemo } from 'react';
import { useNotices } from '../hooks/useNotices';
import { useAuth } from '../hooks/useAuth';
import NoticeCard from '../components/NoticeCard';
import { Notice, NoticeCategory } from '../types';
import { 
  Filter, 
  Search, 
  LayoutGrid, 
  LayoutList,
  Bell,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard({ onNavigate }: { onNavigate: (view: string, notice?: Notice) => void }) {
  const { notices, loading, deleteNotice } = useNotices();
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<NoticeCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const CATEGORIES: (NoticeCategory | 'All')[] = [
    'All',
    'Academics', 
    'Events & Activities', 
    'Career & Placements', 
    'Holidays & Leave', 
    'General'
  ];

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    
    let filtered = [...notices];

    if (activeCategory !== 'All') {
      filtered = filtered.filter(n => n.category === activeCategory);
    }

    return filtered;
  }, [notices, activeCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Syncing Network</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-[2px] bg-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Live Intel Feed</span>
           </div>
           <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[var(--text-primary)] leading-none">
             Campus Updates
           </h1>
           <p className="mt-4 text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px]">
             {profile?.role === 'student' 
               ? `${profile.department} • Semester ${profile.semester || 'X'}`
               : `${profile?.institution || 'Academic Staff'}`
             }
           </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-4 backdrop-blur-xl">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Total Updates</p>
                <p className="text-xl font-black text-[var(--text-primary)] italic">{filteredNotices.length}</p>
             </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-4 backdrop-blur-xl">
             <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Verified Filter</p>
                <p className="text-xl font-black text-[var(--text-primary)] italic">Active</p>
             </div>
          </div>
        </div>
      </div>

      {/* Categories & View Mode */}
      <div className="flex flex-col space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
               <Filter className="w-4 h-4" /> Category Filter
            </div>
            <div className="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] p-1 rounded-xl">
               <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
               >
                  <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
               >
                  <LayoutList className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="relative group">
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 transform active:scale-95",
                    activeCategory === cat 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-2xl shadow-blue-600/10' 
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-500/30 hover:text-[var(--text-primary)]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="absolute top-0 right-0 h-[calc(100%-1rem)] w-20 bg-gradient-to-l from-[var(--bg-main)] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
      </div>

      {/* Notice Feed */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          layout
          className={cn(
            "grid gap-8",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          )}
        >
          {filteredNotices.map((notice) => (
            <NoticeCard 
              key={notice.id} 
              notice={notice} 
              onClick={() => onNavigate('details', notice)} 
              onDelete={() => deleteNotice(notice.id, notice.attachmentUrl)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredNotices.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-40 bg-[var(--card-bg)] border-2 border-dashed border-[var(--border-color)] rounded-[3rem]"
        >
          <div className="w-24 h-24 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl dark:shadow-none">
             <Bell className="w-10 h-10 text-[var(--text-secondary)] opacity-20" />
          </div>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-secondary)] opacity-50 mb-2">Signal Interrupted</h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-40">No matching notices found in your current sector.</p>
        </motion.div>
      )}

      {/* Floating Sparkle for Visual interest */}
      <div className="fixed bottom-10 right-10 p-6 bg-blue-600 rounded-full shadow-2xl shadow-blue-500/40 cursor-pointer hover:scale-110 active:scale-95 transition-all z-50 md:hidden">
         <Sparkles className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}
