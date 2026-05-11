import React, { useEffect } from 'react';
import { Notice, OperationType } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Paperclip, 
  ExternalLink, 
  Zap, 
  Sparkles, 
  Eye,
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handler';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function NoticeDetails({ notice, onBack }: { notice: Notice, onBack: () => void }) {
  const expiryDate = notice.expiryDate?.toDate() || new Date();
  const isExpired = expiryDate < new Date();

  useEffect(() => {
    // Increment view count
    const incrementView = async () => {
      try {
        await updateDoc(doc(db, 'notices', notice.id), {
          viewCount: increment(1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notices/${notice.id}`);
      }
    };
    incrementView();
  }, [notice.id]);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-8 h-full text-slate-100">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                notice.priority === 'Urgent' ? 'badge-urgent' : notice.priority === 'Important' ? 'badge-important' : 'badge-normal'
              )}>
                {notice.priority}
              </span>
              <span className="px-2 py-1 bg-white/5 text-slate-400 border border-white/5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {notice.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]">{notice.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-medium pb-8 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <User className="w-4 h-4" />
                </div>
                <span>By {notice.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Posted {notice.createdAt ? format(notice.createdAt.toDate(), 'PPP') : 'Just now'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>{notice.viewCount + 1} views</span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold text-white mb-4">Full Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {notice.description}
              </p>
            </div>

            {notice.simplified && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <Sparkles className="w-4 h-4" /> Student-Friendly Version
                </div>
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {notice.simplified}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className={cn(
            "glass-card p-6 border-white/5 relative overflow-hidden",
            isExpired ? "bg-red-500/5 border-red-500/10" : "bg-blue-600/5 border-blue-500/10"
          )}>
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Deadline Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Date & Time</p>
                  <p className="text-lg font-bold text-white">{notice.expiryDate ? format(notice.expiryDate.toDate(), 'PPP p') : 'No deadline'}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl border text-center",
                  isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-600/10 border-blue-500/20 text-blue-400"
                )}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xl font-black">{isExpired ? 'EXPIRED' : 'ACTIVE'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Links</h3>
            <div className="space-y-3">
              {notice.formLink && (
                <button 
                  onClick={() => !isExpired && window.open(notice.formLink, '_blank')}
                  disabled={isExpired}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Application Form
                </button>
              )}
              {notice.attachmentUrl && (
                <a 
                  href={notice.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex flex-col items-center justify-center p-4 transition-all border border-white/5 group no-underline"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Paperclip className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">Attachment</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-full px-4">
                    {notice.attachmentName || 'View Document'}
                  </span>
                </a>
              )}
              {!notice.formLink && !notice.attachmentUrl && (
                <p className="text-xs text-slate-500 text-center italic py-2">No external links provided.</p>
              )}
            </div>
            {isExpired && (
              <p className="mt-4 flex items-center gap-2 text-[10px] text-red-500/60 font-bold uppercase tracking-widest text-center justify-center bg-red-500/5 py-2 rounded-lg">
                <AlertCircle className="w-3 h-3" /> Note: Form links are disabled after expiry
              </p>
            )}
          </div>

          {notice.summary && (
            <div className="glass-card p-6 border-white/5">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Fast Summary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-blue-500/50 pl-4 py-1">
                "{notice.summary}"
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
