import React from 'react';
import { Notice } from '../types';
import { 
  Calendar, 
  Clock, 
  Paperclip, 
  ExternalLink, 
  Zap, 
  ChevronRight, 
  Pin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface NoticeCardProps {
  notice: Notice;
  onClick: () => void;
  key?: string;
}

export default function NoticeCard({ notice, onClick }: NoticeCardProps) {
  const expiryDate = notice.expiryDate?.toDate() || new Date();
  const isExpired = expiryDate < new Date();
  
  const priorityStyles = {
    Urgent: 'badge-urgent',
    Important: 'badge-important',
    Normal: 'badge-normal',
  };

  const categoryIcons = {
    Exam: '📝',
    Event: '🎉',
    Placement: '💼',
    Assignment: '📚',
    Other: '🔔',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "notice-card relative overflow-hidden group border-slate-800",
        notice.isPinned && "border-blue-500/30",
        isExpired && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-600/5 blur-[60px] pointer-events-none transition-all group-hover:bg-blue-600/10"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex gap-2 items-center flex-wrap">
          <span className={cn("badge", priorityStyles[notice.priority])}>{notice.priority}</span>
          <span className="badge bg-slate-800 text-slate-300 border-slate-700">
            {notice.category}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">
            {isExpired ? 'DEADLINE REACHED' : 'EXPIRES IN'}
          </span>
          <span className="text-sm font-mono font-bold text-blue-400">
            {isExpired ? 'EXPIRED' : formatDistanceToNow(expiryDate, { addSuffix: false })}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors leading-tight italic">
        {notice.title}
      </h3>

      {notice.summary && (
        <div className="bg-slate-950/50 border-l-2 border-emerald-500/50 p-4 rounded-xl mb-4">
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            <span className="text-emerald-500 font-black uppercase mr-2 italic tracking-tighter">AI Summary:</span>
            {notice.summary}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-800/50 relative z-10">
        <div className="flex items-center gap-3">
          <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline">Details</button>
          {notice.attachmentUrl && <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:underline">PDF</button>}
        </div>
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          {notice.authorName} • {notice.createdAt ? formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true }) : 'just now'}
        </span>
      </div>
    </motion.div>
  );
}
