import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { ai, MODELS } from '../lib/gemini';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
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
    faculty: '',
    department: '',
    semester: '',
    priority: 'Normal' as NoticePriority,
    expiryDateTime: '',
  });

  useEffect(() => {
    if (profile?.institution && !formData.faculty) {
      setFormData(prev => ({ ...prev, faculty: profile.institution }));
    }
  }, [profile, formData.faculty]);

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
    } catch (err: any) {
      console.error('AI Suggestion Error:', err);
      if (err.message?.includes('429') || err.status === 429) {
        toast.error("AI Quota Exceeded. Using manual settings.", {
          icon: '⏳',
        });
      } else {
        toast.error("AI Assistant is currently unavailable.");
      }
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
      let extractedText = '';

      if (attachment) {
        try {
          console.log(`Starting Cloudinary upload for ${attachment.name}...`);
          toast.loading(`Uploading & Analyzing ${attachment.name}...`, { id: 'upload' });
          
          const result = await uploadToCloudinary(attachment);
          console.log("Cloudinary upload successful:", result);
          
          attachmentUrl = result.secure_url;
          attachmentName = attachment.name;
          attachmentType = attachment.type;

          // AI Extraction Step
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
              };
              reader.readAsDataURL(attachment);
            });

            const base64Data = await base64Promise;

            console.log("Starting AI text extraction...");
            const extractionPrompt = `Extract ALL readable text from this document/image. 
            Identify specifically: 
            - Dates (holidays, exams, deadlines, events)
            - Event titles
            - Contact information
            - Any specific instructions or schedule ranges (e.g. "from 25 May to 15 June").
            
            Format the output clearly for a search index. If it's a schedule, list each date and its corresponding event on a new line.`;

            const aiResponse = await ai.models.generateContent({
              model: MODELS.FLASH,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: extractionPrompt },
                    {
                      inlineData: {
                        mimeType: attachment.type,
                        data: base64Data
                      }
                    }
                  ]
                }
              ]
            });

            extractedText = aiResponse.text || '';
            console.log("AI Extraction complete. Length:", extractedText.length);
          } catch (aiErr: any) {
            console.error("AI Extraction failed:", aiErr);
            if (aiErr.message?.includes('429')) {
              toast.error("AI Extraction quota reached. Using manual description only.", { id: 'upload' });
            } else {
              toast.error("AI Analysis skipped due to technical issues.", { id: 'upload' });
            }
          }
          
          toast.success("Document analyzed", { id: 'upload' });
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
        faculty: formData.faculty || 'Parul University',
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
        expiryDateTime: formData.expiryDateTime ? Timestamp.fromDate(new Date(formData.expiryDateTime)) : null,
        attachmentUrl,
        attachmentName,
        attachmentType,
        extractedText,
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

  const availableDepartments = formData.faculty ? DEPARTMENTS[formData.faculty] || [] : [];
  const isSuperAdmin = profile?.institution === 'Parul University';
  const INSTITUTION_LIST = Object.keys(DEPARTMENTS);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight italic uppercase italic">Create New Notice</h1>
          <p className="text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest mt-1">Authorized for {profile?.institution || 'Administrative Faculty'}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-bold uppercase tracking-widest">
           <Zap className="w-3 h-3 fill-current" /> Nexora AI Active
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Notice Title</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. End Semester Exam Schedule"
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2rem] px-8 py-5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-4 mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block">Description & Details</label>
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
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] px-8 py-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-[var(--text-primary)] leading-relaxed placeholder:text-[var(--text-secondary)]/30"
              />
            </div>

            <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <FileUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic text-[var(--text-primary)] leading-none">Official Document</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase font-bold tracking-widest opacity-50">Visible as PDF/Image preview</p>
                  </div>
               </div>
               
               {!attachment ? (
                 <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--border-color)] hover:border-blue-500/30 rounded-3xl p-10 transition-all flex flex-col items-center gap-4 group bg-[var(--bg-surface-alt)]"
                 >
                    <div className="w-12 h-12 bg-[var(--bg-surface-alt)] rounded-2xl flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <Paperclip className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">Drag & Drop or Click</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase font-bold tracking-widest opacity-50">Images, PDF (Max 20MB)</p>
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
                 <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="shrink-0 w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate uppercase italic">{attachment.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-50">{(attachment.size / (1024 * 1024)).toFixed(2)} MB — Ready</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="w-10 h-10 hover:bg-rose-500/10 rounded-xl text-[var(--text-secondary)] hover:text-rose-400 transition-all flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-[var(--card-bg)] backdrop-blur-2xl border border-[var(--border-color)] rounded-[3rem] p-8 space-y-8 shadow-2xl dark:shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                      <Building2 className="w-3.5 h-3.5" /> Target Faculty
                  </div>
                  <select 
                    value={formData.faculty}
                    onChange={(e) => setFormData(p => ({ ...p, faculty: e.target.value, department: '' }))}
                    disabled={!isSuperAdmin}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none text-[var(--text-primary)] uppercase tracking-widest disabled:opacity-50"
                  >
                    {!formData.faculty && <option value="">Select Faculty</option>}
                    {INSTITUTION_LIST.map(inst => <option key={inst} value={inst} className="bg-[var(--bg-surface)]">{inst}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
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
                            : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-800"
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
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-2 block opacity-50">Target Department</label>
                      <select 
                        required
                        value={formData.department}
                        onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none text-[var(--text-primary)] uppercase tracking-widest"
                      >
                        <option value="">Select Department</option>
                        {availableDepartments.map(d => <option key={d} value={d} className="bg-[var(--bg-surface)]">{d}</option>)}
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
                      <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-2 mb-2 opacity-50">Select Semester</div>
                      {SEMESTERS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, semester: s }))}
                          className={cn(
                            "py-3 rounded-xl border text-[10px] font-black transition-all",
                            formData.semester === s
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)]"
                          )}
                        >
                          S{s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                      <BookOpen className="w-3.5 h-3.5" /> Classification
                  </div>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none text-[var(--text-primary)] uppercase tracking-widest"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[var(--bg-surface)]">{c}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
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
                              : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-slate-800"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                   <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] leading-none ml-2">
                       <AlertCircle className="w-3.5 h-3.5" /> Expiry (Optional)
                   </div>
                   <input 
                    type="datetime-local"
                    value={formData.expiryDateTime}
                    onChange={(e) => setFormData(p => ({ ...p, expiryDateTime: e.target.value }))}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] uppercase tracking-widest block"
                   />
                </div>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-black h-18 rounded-[2rem] flex items-center justify-center gap-3 text-lg uppercase tracking-[0.1em] transition-all transform active:scale-95 shadow-2xl shadow-blue-600/20 group"
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
