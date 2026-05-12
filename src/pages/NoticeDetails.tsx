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
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handler';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function NoticeDetails({ notice, onBack }: { notice: Notice, onBack: () => void }) {
  const { profile, user } = useAuth();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const expiryDate = notice.expiryDateTime?.toDate();
  const isExpired = expiryDate ? expiryDate < new Date() : false;

  const canDelete = user && (
    profile?.role === 'admin' ||
    profile?.institution === 'Parul University' || 
    user.email?.endsWith('@paruluniversity.ac.in') ||
    notice.authorId === user.uid
  );

  useEffect(() => {
    if (isExpired && profile?.role === 'student') return;
    
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
  }, [notice.id, isExpired, profile]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'notices', notice.id));
      toast.success("Notice deleted");
      onBack();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notice");
    }
  };

  if (isExpired && profile?.role === 'student') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8">
        <div className="w-20 h-20 bg-[var(--card-bg)] border border-rose-500/20 rounded-full flex items-center justify-center mb-6 shadow-2xl dark:shadow-none">
          <Clock className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-primary)] mb-2">Intel Expired</h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-md font-bold uppercase tracking-widest leading-loose">
          This notice reached its terminal expiry time and is no longer accessible to students.
        </p>
        <button onClick={onBack} className="mt-8 px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-main)] font-black uppercase tracking-widest rounded-xl text-[10px]">
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-8 h-full text-[var(--text-primary)]">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {canDelete && (
          <div className="relative flex">
            {showConfirm && (
                 <div className="absolute top-full mt-2 right-0 bg-[var(--card-bg)] border border-rose-500/20 p-2 rounded-xl shadow-xl flex items-center gap-2 w-max z-50">
                   <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mx-2">Confirm?</span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setShowConfirm(false); handleDelete(); }}
                     className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase"
                   >
                     Yes
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                     className="px-3 py-1 bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] rounded-lg text-[9px] font-black uppercase"
                   >
                     No
                   </button>
                 </div>
               )}
            <button 
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete Notice
            </button>
          </div>
        )}
      </div>

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
              <span className="px-2 py-1 bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-md text-[10px] font-bold uppercase tracking-wider">
                {notice.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-[1.1] italic uppercase tracking-tighter">{notice.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-[var(--text-secondary)] text-sm font-medium pb-8 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <User className="w-4 h-4" />
                </div>
                <span>By {notice.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)] opacity-50" />
                <span>Posted {notice.createdAt ? format(notice.createdAt.toDate(), 'PPP') : 'Just now'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--text-secondary)] opacity-50" />
                <span>{notice.viewCount} views</span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2rem] text-[var(--text-secondary)] opacity-50 mb-4">Intel Briefing</h3>
              <p className="text-[var(--text-primary)] opacity-90 leading-relaxed whitespace-pre-wrap font-medium">
                {notice.description}
              </p>
            </div>

            {notice.simplified && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-8"
              >
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
                  <Sparkles className="w-4 h-4" /> Nexora Summary
                </div>
                <div className="text-[var(--text-primary)] opacity-80 text-sm leading-relaxed whitespace-pre-wrap">
                  {notice.simplified}
                </div>
              </motion.div>
            )}
            
            {notice.attachmentUrl && (
              <div className="space-y-4 pt-8 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2rem] text-[var(--text-secondary)] opacity-50">Secured Attachment</h3>
                  {notice.extractedText && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> Data Scanned
                    </div>
                  )}
                </div>
                
                {notice.attachmentType?.startsWith('image/') || notice.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-6 backdrop-blur-3xl shadow-2xl dark:shadow-none">
                    <img 
                      src={notice.attachmentUrl} 
                      alt={notice.attachmentName || 'Attachment'} 
                      className="w-full h-auto max-h-[800px] object-contain rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-[var(--border-color)] rounded-[3rem] text-center bg-[var(--card-bg)] backdrop-blur-3xl">
                    <div className="w-16 h-16 bg-[var(--bg-surface-alt)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-[var(--border-color)]">
                       <Paperclip className="w-8 h-8 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-[var(--text-primary)] font-black italic uppercase tracking-tight mb-2 truncate max-w-full px-4">{notice.attachmentName}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mb-8 opacity-50">Official Document Interface</p>
                    
                    <div className="flex items-center justify-center gap-4">
                      <a 
                        href={(() => {
                          let url = notice.attachmentUrl;
                          if (url.includes('/raw/upload/')) {
                            return url.replace('/fl_attachment/', '/');
                          }
                          return url;
                        })()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] border border-[var(--border-color)] font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl text-[10px] hover:bg-[var(--bg-surface)]"
                      >
                        <ExternalLink className="w-4 h-4" /> Open PDF
                      </a>
                      <a 
                        href={(() => {
                          let url = notice.attachmentUrl;
                          
                          // If it's a raw upload (like PDFs), Cloudinary does not support image transformations like fl_attachment.
                          // Remove fl_attachment if it somehow got in there (due to buggy previous saves)
                          if (url.includes('/raw/upload/')) {
                            return url.replace('/fl_attachment/', '/');
                          }
                          
                          // For images, we can add fl_attachment to force download instead of viewing in browser
                          if (url.includes('/image/upload/') && !url.includes('fl_attachment')) {
                            return url.replace('/image/upload/', '/image/upload/fl_attachment/');
                          }
                          
                          return url;
                        })()}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--text-primary)] text-[var(--bg-main)] font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl text-[10px]"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className={cn(
            "rounded-[2.5rem] p-8 border backdrop-blur-3xl shadow-2xl dark:shadow-none relative overflow-hidden",
            isExpired ? "bg-rose-500/5 border-rose-500/10" : "bg-blue-600/5 border-blue-500/10"
          )}>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black italic text-[var(--text-secondary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Notice Lifecycle
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest leading-none mb-2">Expiry Timestamp</p>
                  <p className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter tabular-nums">
                    {notice.expiryDateTime ? format(notice.expiryDateTime.toDate(), 'PPP p') : 'Permanent'}
                  </p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border text-center",
                  isExpired ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-50">Current Status</p>
                  <p className="text-2xl font-black italic uppercase leading-none">{isExpired ? 'EXPIRED' : 'ACTIVE'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-2xl dark:shadow-none">
            <h3 className="text-[10px] font-black italic text-[var(--text-secondary)] uppercase tracking-widest mb-6">Action Hub</h3>
            <div className="space-y-4">
              {notice.formLink && (
                <button 
                  onClick={() => !isExpired && window.open(notice.formLink, '_blank')}
                  disabled={isExpired}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 shadow-2xl",
                    isExpired ? "bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  Access Application Form
                </button>
              )}
              {notice.attachmentUrl && (
                <a 
                  href={notice.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[var(--bg-surface-alt)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl flex flex-col items-center justify-center p-6 transition-all border border-[var(--border-color)] group no-underline shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-tight italic">Attachment</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold truncate max-w-full px-4 uppercase tracking-widest">
                    {notice.attachmentName || 'Download doc'}
                  </span>
                </a>
              )}
            </div>
            {isExpired && (
              <p className="mt-6 flex items-center gap-2 text-[8px] text-rose-500/60 font-black uppercase tracking-widest text-center justify-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/10">
                <AlertCircle className="w-3 h-3" /> External links locked after expiry
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
