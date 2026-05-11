import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, getStorageInstance } from '../lib/firebase';
import { ai, MODELS } from '../lib/gemini';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ArrowLeft, 
  Send, 
  Zap, 
  Sparkles, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Paperclip,
  X,
  FileUp
} from 'lucide-react';
import { NoticeCategory, NoticePriority, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function CreateNotice({ onBack }: { onBack: () => void }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    summary: '',
    simplified: '',
    category: 'Other' as NoticeCategory,
    priority: 'Normal' as NoticePriority,
    expiryDate: '',
    expiryTime: '23:59',
    formLink: '',
    isPinned: false
  });

  const CATEGORIES: NoticeCategory[] = [
    'Assignment', 'Event', 'Exam', 'Workshop', 'Holiday', 
    'Placement', 'Urgent', 'Circular', 'Competition', 
    'Seminar', 'Club Activity', 'Other'
  ];

  // Auto-category suggestion
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.title.length > 5) {
        try {
          const prompt = `Analyze the notice title: "${formData.title}". 
          Suggest the most relevant category from: ${CATEGORIES.join(', ')}. 
          Return ONLY the category name. If unclear, return "Other".`;
          
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

  const handleAiAction = async (action: 'summarize' | 'simplify' | 'suggest') => {
    if (!formData.description && !formData.title) return;
    setAiLoading(true);
    try {
      let prompt = "";
      if (action === 'summarize') {
        prompt = `Summarize the following notice in 2 sentences. Make it clear and actionable.\nTitle: ${formData.title}\nDescription: ${formData.description}`;
        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: prompt
        });
        setFormData(prev => ({ ...prev, summary: response.text || '' }));
      } else if (action === 'simplify') {
        prompt = `Rewrite this notice for students using simple, friendly language and bullet points if needed.\nTitle: ${formData.title}\nDescription: ${formData.description}`;
         const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: prompt
        });
        setFormData(prev => ({ ...prev, simplified: response.text || '' }));
      } else if (action === 'suggest') {
        prompt = `Based on the following notice title and description, suggest the most appropriate category (${CATEGORIES.join(', ')}) and priority (Normal, Important, Urgent). Return ONLY valid JSON: {"category": "...", "priority": "..."}.\nTitle: ${formData.title}\nDescription: ${formData.description}`;
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
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
      const expiryDateTime = new Date(`${formData.expiryDate}T${formData.expiryTime}`);
      
      let attachmentUrl = '';
      let attachmentName = '';
      let attachmentType = '';

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storage = getStorageInstance();
        if (!storage) throw new Error("Firebase Storage is not available. Please contact admin to enable storage.");
        
        const storageRef = ref(storage, `notices/${user.uid}/${fileName}`);
        
        toast.loading("Uploading attachment...", { id: 'upload' });
        const snapshot = await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        attachmentName = attachment.name;
        attachmentType = attachment.type;
        toast.success("Attachment uploaded", { id: 'upload' });
      }

      const noticeData = {
        title: formData.title,
        description: formData.description,
        summary: formData.summary,
        simplified: formData.simplified,
        category: formData.category,
        priority: formData.priority,
        expiryDate: Timestamp.fromDate(expiryDateTime),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorId: user.uid,
        authorName: user.displayName || 'Teacher',
        isPinned: formData.isPinned,
        formLink: formData.formLink,
        attachmentUrl,
        attachmentName,
        attachmentType,
        viewCount: 0
      };

      await addDoc(collection(db, 'notices'), noticeData);
      toast.success("Notice published successfully 🎉");
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notices');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-4xl font-bold text-white tracking-tight">Create New Notice</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest">
           <Zap className="w-3 h-3 fill-current" /> AI Assistant Enabled
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 text-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Title</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notice title (e.g. End Semester Exam Schedule)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 text-slate-100">
                <label className="text-sm font-semibold">Description</label>
                <button 
                  type="button"
                  onClick={() => handleAiAction('suggest')}
                  disabled={aiLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 uppercase tracking-wider"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Categorize
                </button>
              </div>
              <textarea 
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide all relevant details here..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="glass-card p-4 border-blue-500/10 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4 relative z-10 text-slate-100">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">AI Summary</h3>
                  <button 
                    type="button"
                    onClick={() => handleAiAction('summarize')}
                    disabled={aiLoading}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all"
                  >
                    <Zap className={cn("w-4 h-4 text-blue-400", aiLoading && "animate-pulse")} />
                  </button>
                </div>
                <textarea 
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="AI will generate a summary..."
                  className="w-full bg-transparent text-sm text-slate-300 focus:outline-none resize-none min-h-[100px]"
                />
              </div>

              <div className="glass-card p-4 border-indigo-500/10 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4 relative z-10 text-slate-100">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Student Friendly</h3>
                  <button 
                    type="button"
                    onClick={() => handleAiAction('simplify')}
                    disabled={aiLoading}
                    className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-all"
                  >
                    <Sparkles className={cn("w-4 h-4 text-indigo-400", aiLoading && "animate-pulse")} />
                  </button>
                </div>
                <textarea 
                  value={formData.simplified}
                  onChange={(e) => setFormData(prev => ({ ...prev, simplified: e.target.value }))}
                  placeholder="AI will simplify content..."
                  className="w-full bg-transparent text-sm text-slate-300 focus:outline-none resize-none min-h-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6 text-slate-100">
             <div className="glass-card p-6 space-y-6 border-white/5 bg-slate-900/40">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                      <Calendar className="w-3.5 h-3.5" /> Expiry Date
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <input 
                        required
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none "
                      />
                      <input 
                        required
                        type="time"
                        value={formData.expiryTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryTime: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                      <FileText className="w-3.5 h-3.5" /> Category
                  </div>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-blue-500/50 appearance-none text-white font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                      <AlertCircle className="w-3.5 h-3.5" /> Priority
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {['Normal', 'Important', 'Urgent'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: p as any }))}
                          className={cn(
                            "py-2 text-[10px] font-bold uppercase tracking-widest border rounded-lg transition-all",
                            formData.priority === p 
                              ? "bg-blue-600/20 text-blue-400 border-blue-500/50" 
                              : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={formData.isPinned}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Pin to top of board</span>
                   </label>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                      <Paperclip className="w-3.5 h-3.5" /> Attachment
                   </div>
                   {!attachment ? (
                     <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all flex flex-col items-center gap-3 group"
                     >
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                          <FileUp className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Click to upload doc</p>
                          <p className="text-[10px] text-slate-500 mt-1">Images, PDF, Word (Max 10MB)</p>
                        </div>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                        />
                     </button>
                   ) : (
                     <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{attachment.name}</p>
                            <p className="text-[10px] text-slate-400">{(attachment.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                      <LinkIcon className="w-3.5 h-3.5" /> External Form Link
                   </div>
                   <input 
                      type="url"
                      value={formData.formLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, formLink: e.target.value }))}
                      placeholder="https://forms.google.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none"
                   />
                </div>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
             >
                {loading ? 'Publishing...' : (
                  <>
                    Publish Notice
                    <Send className="w-5 h-5" />
                  </>
                )}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
