import React from 'react';
import { Notice } from '../types';
import { 
  Calendar, 
  FileText, 
  ArrowRight,
  Download,
  User,
  Eye,
  Tag,
  Trash2,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface NoticeCardProps {
  notice: Notice;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  key?: string;
}

export default function NoticeCard({ notice, onClick, onDelete }: NoticeCardProps) {
  const { profile, user } = useAuth();
  
  const canDelete = user && (
    profile?.role === 'admin' ||
    profile?.institution === 'Parul University' || 
    user.email?.endsWith('@paruluniversity.ac.in') ||
    notice.authorId === user.uid
  );

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
      className="group relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer overflow-hidden dark:shadow-none"
      onClick={onClick}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] group-hover:bg-blue-600/10 transition-colors pointer-events-none" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getPriorityColor(notice.priority))}>
            {notice.priority}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] px-3 py-1 rounded-full border border-[var(--border-color)] transition-colors">
            <Tag className="w-3 h-3" /> {notice.category}
          </div>
        </div>
        <div className="px-3 py-1 bg-[var(--bg-surface-alt)] rounded-full border border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 italic transition-colors">
          {getAudienceLabel()}
        </div>
      </div>

      {notice.expiryDateTime && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full z-20">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">
            Expires {formatDistanceToNow(notice.expiryDateTime.toDate(), { addSuffix: true })}
          </span>
        </div>
      )}

      <div className="mb-6 relative z-10">
        <h3 className="text-2xl font-black italic text-[var(--text-primary)] uppercase leading-tight group-hover:text-blue-500 transition-colors mb-2">
          {notice.title}
        </h3>
        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed">
          {notice.description}
        </p>
        
        {notice.attachmentUrl && (notice.attachmentType?.startsWith('image/') || notice.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-[var(--border-color)] aspect-video bg-[var(--bg-main)]">
            <img 
              src={notice.attachmentUrl} 
              alt="Preview" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-y-4 gap-x-6 pt-6 border-t border-[var(--border-color)] mt-auto relative z-10">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {notice.createdAt ? formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
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
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] group-hover:gap-4 transition-all">
          View Intel <ArrowRight className="w-4 h-4 text-blue-500" />
        </button>
        <div className="flex items-center gap-2">
           {canDelete && (
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete && window.confirm("Are you sure you want to delete this notice? This action is permanent.")) {
                    onDelete(e);
                  }
                }}
                className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all mr-2"
             >
                <Trash2 className="w-4 h-4" />
             </button>
           )}
           <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-blue-500 transition-colors">
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
