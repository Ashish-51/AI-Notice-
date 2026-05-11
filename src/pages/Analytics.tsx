import React from 'react';
import { useNotices } from '../hooks/useNotices';
import { 
  BarChart3, 
  Eye, 
  Bell, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { notices, loading } = useNotices();

  const totalViews = notices.reduce((acc, n) => acc + (n.viewCount || 0), 0);
  const urgentCount = notices.filter(n => n.priority === 'Urgent').length;
  const activeCount = notices.filter(n => {
    const expiry = n.expiryDate?.toDate();
    return expiry ? expiry > new Date() : false;
  }).length;
  const mostViewed = [...notices].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0];

  if (loading) return null;

  const stats = [
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Urgent Notices', value: urgentCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Active Notices', value: activeCount, icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pinned Notices', value: notices.filter(n => n.isPinned).length, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
        <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400">
          <BarChart3 className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl hover:border-slate-700 transition-colors"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-slate-950/50 border border-slate-800", stat.color)}>
               <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-4xl font-black italic text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black italic text-white mb-8 uppercase tracking-tighter">Engagement Pulse</h3>
          <div className="space-y-4">
            {notices.slice(0, 5).map((notice, i) => (
              <div key={notice.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black italic text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px] italic">{notice.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{notice.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black italic text-blue-400 leading-none">{notice.viewCount || 0}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-2 opacity-80 italic">
                   <TrendingUp className="w-4 h-4" /> Top Performer
                </div>
                {mostViewed ? (
                  <>
                    <h4 className="text-2xl font-black text-white italic leading-tight mb-4">{mostViewed.title}</h4>
                    <div className="text-sm text-indigo-100 font-medium mb-6 opacity-90 leading-relaxed">
                      Generated <span className="text-white font-black">{mostViewed.viewCount}</span> interactions active since posting.
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-indigo-200">Network Reach</span>
                       <span className="text-white bg-white/20 px-2 py-0.5 rounded-md">Excellent</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-indigo-100">Scanning network for data...</p>
                )}
             </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 italic">System Vitality</h3>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Firebase Core</span>
                   </div>
                   <span className="text-[10px] text-slate-600 font-bold uppercase">Online</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)] shadow-[animation-delay:0.5s]"></div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Gemini Engine</span>
                   </div>
                   <span className="text-[10px] text-slate-600 font-bold uppercase">Ready</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatDistanceToNow = (date: Date | undefined) => {
  if (!date) return 'Recently';
  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  return `${days} days ago`;
};
