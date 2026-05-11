import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { ai, MODELS } from '../lib/gemini';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { 
  ArrowLeft, 
  ArrowRight,
  Send, 
  Zap, 
  Sparkles, 
  AlertCircle,
  FileText,
  Paperclip,
  X,
  FileUp,
  Users,
  Building2,
  BookOpen
} from 'lucide-react';
import { NoticeCategory, NoticePriority, OperationType, AudienceType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { DEPARTMENTS, SEMESTERS } from '../constants';

export default function CreateNotice({ onBack }: { onBack: () => void }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General' as NoticeCategory,
    audienceType: 'Entire Faculty' as AudienceType,
    department: '',
    semester: '',
    priority: 'Normal' as NoticePriority,
  });

  const CATEGORIES: NoticeCategory[] = [
    'Academics', 
    'Events & Activities', 
    'Career & Placements', 
    'Holidays & Leave', 
    'General'
  ];

  const AUDIENCE_TYPES: AudienceType[] = [
    'Everyone',
    'Entire Faculty',
    'Specific Course',
    'Specific Semester'
  ];

  // Auto-category suggestion
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.title.length > 5) {
        try {
          const prompt = `Analyze the notice title: "${formData.title}". 
          Suggest the most relevant category from: ${CATEGORIES.join(', ')}. 
          Return ONLY the category name. If unclear, return "General".`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
          });
          
          const suggested = response.text?.trim() as NoticeCategory;
          if (CATEGORIES.includes(suggested)) {
            setFormData(prev => ({ ...prev, category: suggested }));
          }
        } catch (err) {
          console.error('AI Suggestion Error:', err);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.title]);

  const handleAiAction = async (action: 'suggest') => {
    if (!formData.description && !formData.title) return;
    setAiLoading(true);
    try {
      if (action === 'suggest') {
        const prompt = `Based on the following notice title and description, suggest the most appropriate category (${CATEGORIES.join(', ')}) and priority (Normal, Important, Urgent). Return ONLY valid JSON: {"category": "...", "priority": "..."}.\nTitle: ${formData.title}\nDescription: ${formData.description}`;
         const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const suggestion = JSON.parse(response.text || '{}');
        setFormData(prev => ({ 
          ...prev, 
          category: suggestion.category || prev.category,
          priority: suggestion.priority || prev.priority
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast.error("File size must be less than 20MB");
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);

    try {
      let attachmentUrl = '';
      let attachmentName = '';
      let attachmentType = '';

      if (attachment) {
        try {
          console.log(`Starting Cloudinary upload for ${attachment.name}...`);
          toast.loading(`Uploading ${attachment.name}...`, { id: 'upload' });
          
          const result = await uploadToCloudinary(attachment);
          console.log("Cloudinary upload successful:", result);
          
          attachmentUrl = result.secure_url;
          attachmentName = attachment.name;
          attachmentType = attachment.type;
          
          toast.success("Attachment ready", { id: 'upload' });
        } catch (uploadError: any) {
          console.error("Cloudinary Upload Error:", uploadError);
          toast.error(`Upload failed: ${uploadError.message || 'Check Cloudinary configuration'}`, { id: 'upload' });
          setLoading(false);
          return;
        }
      }

      const noticeData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        audienceType: formData.audienceType,
        faculty: profile.institution || 'Parul University',
        department: formData.audienceType === 'Specific Course' || formData.audienceType === 'Specific Semester' ? formData.department || null : null,
        semester: formData.audienceType === 'Specific Semester' ? formData.semester || null : null,
        priority: formData.priority,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorId: user.uid,
        authorName: user.displayName || 'Teacher',
        uploadedBy: user.uid,
        uploaderRole: profile.role || 'teacher',
        visibilityScope: formData.audienceType,
        attachmentUrl,
        attachmentName,
        attachmentType,
        viewCount: 0,
        isPinned: false
      };

      await addDoc(collection(db, 'notices'), noticeData);
      toast.success("Notice published successfully 🎉");
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (error: any) {
      console.error("Publishing Error:", error);
      toast.error(`Failed to publish notice: ${error.message || 'Unknown error'}`);
      handleFirestoreError(error, OperationType.CREATE, 'notices');
    } finally {
      setLoading(false);
    }
  };

  const availableDepartments = profile?.institution ? DEPARTMENTS[profile.institution] || [] : [];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight italic uppercase italic">Create New Notice</h1>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Authorized for {profile?.institution || 'Administrative Faculty'}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-bold uppercase tracking-widest">
           <Zap className="w-3 h-3 fill-current" /> AI Assistant Active
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Notice Title</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. End Semester Exam Schedule"
                className="w-full bg-slate-900/60 border border-white/5 rounded-[2rem] px-8 py-5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-4 mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Description & Details</label>
                <button 
                  type="button"
                  onClick={() => handleAiAction('suggest')}
                  disabled={aiLoading}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-black flex items-center gap-1 uppercase tracking-widest"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Assist
                </button>
              </div>
              <textarea 
                required
                rows={10}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Break down your announcement here. Start with essential info then details. AI assistance will automatically check for clarity."
                className="w-full bg-slate-900/60 border border-white/5 rounded-[2.5rem] px-8 py-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white leading-relaxed placeholder:text-slate-700"
              />
            </div>

            <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <FileUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic text-white leading-none">Official Document</h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Visible as PDF/Image preview</p>
                  </div>
               </div>
               
               {!attachment ? (
                 <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/5 hover:border-blue-500/30 rounded-3xl p-10 transition-all flex flex-col items-center gap-4 group bg-slate-950/40"
                 >
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <Paperclip className="w-6 h-6 text-slate-500 group-hover:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-300 group-hover:text-white transition-colors uppercase tracking-widest">Drag & Drop or Click</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Images, PDF (Max 20MB)</p>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                 </button>
               ) : (
                 <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="shrink-0 w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-white truncate uppercase italic">{attachment.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(attachment.size / (1024 * 1024)).toFixed(2)} MB — Ready</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="w-10 h-10 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-400 transition-all flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 space-y-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                      <Users className="w-3.5 h-3.5" /> Audience
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {AUDIENCE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, audienceType: type }))}
                        className={cn(
                          "w-full px-5 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group",
                          formData.audienceType === type 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                            : "bg-slate-950 border-white/5 text-slate-500 hover:border-slate-800"
                        )}
                      >
                        {type}
                        <ArrowRight className={cn("w-4 h-4 opacity-0 transition-all", formData.audienceType === type ? "opacity-100 translate-x-0" : "-translate-x-2 group-hover:opacity-100")} />
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {(formData.audienceType === 'Specific Course' || formData.audienceType === 'Specific Semester') && (
                    <motion.div 
                      key="dept-select"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Target Department</label>
                      <select 
                        required
                        value={formData.department}
                        onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none text-white uppercase tracking-widest"
                      >
                        <option value="">Select Department</option>
                        {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </motion.div>
                  )}

                  {formData.audienceType === 'Specific Semester' && (
                    <motion.div 
                      key="sem-select"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-4 gap-2 overflow-hidden"
                    >
                      <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2">Select Semester</div>
                      {SEMESTERS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, semester: s }))}
                          className={cn(
                            "py-3 rounded-xl border text-[10px] font-black transition-all",
                            formData.semester === s
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-slate-950 border-white/5 text-slate-500"
                          )}
                        >
                          S{s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                      <BookOpen className="w-3.5 h-3.5" /> Classification
                  </div>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none text-white uppercase tracking-widest"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Priority Level
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {['Normal', 'Important', 'Urgent'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: p as any }))}
                          className={cn(
                            "py-3 text-[9px] font-black uppercase tracking-widest border rounded-xl transition-all",
                            formData.priority === p 
                              ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20" 
                              : "bg-slate-950 text-slate-500 border-white/5 hover:border-slate-800"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-50 text-slate-950 font-black h-18 rounded-[2rem] flex items-center justify-center gap-3 text-lg uppercase tracking-[0.1em] hover:bg-white transition-all transform active:scale-95 shadow-2xl shadow-blue-600/20 group"
             >
                {loading ? 'PROCESSING...' : (
                  <>
                    <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    Publish Now
                  </>
                )}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
