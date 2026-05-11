import React from 'react';
import { Notice } from '../types';
import { 
  Calendar, 
  FileText, 
  ArrowRight,
  Download,
  User,
  Eye,
  Tag
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
  const getAudienceLabel = () => {
    switch (notice.audienceType) {
      case 'Everyone':
        return 'FOR ALL';
      case 'Entire Faculty':
        return `FOR ${notice.faculty.split(' ').map(w => w[0]).join('')}`;
      case 'Specific Course':
        return `FOR ${notice.department}`;
      case 'Specific Semester':
        return `FOR ${notice.department} S${notice.semester}`;
      default:
        return 'NOTICE';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Important': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] group-hover:bg-blue-600/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getPriorityColor(notice.priority))}>
            {notice.priority}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Tag className="w-3 h-3" /> {notice.category}
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-950/50 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic">
          {getAudienceLabel()}
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <h3 className="text-2xl font-black italic text-white uppercase italic leading-tight group-hover:text-blue-400 transition-colors mb-2">
          {notice.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
          {notice.description}
        </p>
        
        {notice.attachmentUrl && (notice.attachmentType?.startsWith('image/') || notice.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-950/50">
            <img 
              src={notice.attachmentUrl} 
              alt="Preview" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-y-4 gap-x-6 pt-6 border-t border-white/5 mt-auto relative z-10">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {notice.createdAt ? formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <User className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">
            {notice.authorName}
          </span>
        </div>

        {notice.attachmentUrl && (
          <div className="flex items-center gap-2 text-blue-500 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10 ml-auto">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">ATTACHED</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between relative z-10">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white group-hover:gap-4 transition-all">
          View Intel <ArrowRight className="w-4 h-4 text-blue-500" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
              <Eye className="w-4 h-4" />
           </div>
           {notice.attachmentUrl && (
              <a 
                href={notice.attachmentUrl} 
                target="_blank" 
                rel="no-referrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
              </a>
           )}
        </div>
      </div>
    </motion.div>
  );
}
