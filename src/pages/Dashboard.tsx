import React, { useState } from 'react';
import { useNotices } from '../hooks/useNotices';
import { useAuth } from '../hooks/useAuth';
import NoticeCard from '../components/NoticeCard';
import { Notice } from '../types';
import { Filter, Search, SortAsc, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard({ onNavigate }: { onNavigate: (view: string, notice?: Notice) => void }) {
  const { notices, loading } = useNotices();
  const { profile } = useAuth();
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Exam', 'Event', 'Placement', 'Assignment', 'Other'];

  const filteredNotices = filter === 'All' 
    ? notices 
    : notices.filter(n => n.category === filter);

  const urgentCount = notices.filter(n => n.priority === 'Urgent').length;
  const activeCount = notices.filter(n => {
    const expiry = n.expiryDate?.toDate();
    return expiry ? expiry > new Date() : false;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl hover:border-slate-700 transition-colors">
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Notices</div>
          <div className="text-4xl font-black italic">{activeCount}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl hover:border-slate-700 transition-colors">
          <div className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-1">Urgent Priority</div>
          <div className="text-4xl font-black italic text-rose-500">{urgentCount < 10 ? `0${urgentCount}` : urgentCount}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl hover:border-slate-700 transition-colors">
          <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">AI Summarized</div>
          <div className="text-4xl font-black italic text-emerald-500">100%</div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                filter === cat 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center text-slate-600">
            <ListIcon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Notice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredNotices.map((notice) => (
            <NoticeCard 
              key={notice.id} 
              notice={notice} 
              onClick={() => onNavigate('details', notice)} 
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-24 glass-card border-dashed">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <BellIcon className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-2xl font-black italic mb-2">No updates scans</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Network is currently quiet.</p>
        </div>
      )}
    </div>
  );
}

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
