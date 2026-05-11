import React, { useState, useRef, useEffect } from 'react';
import { useNotices } from '../hooks/useNotices';
import { ai, MODELS } from '../lib/gemini';
import { 
  MessageSquare, 
  X, 
  Send, 
  Zap, 
  User, 
  Sparkles,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! I'm your SmartNotice Assistant. How can I help you find information about campus notices today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { notices } = useNotices();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Create context from notices
      const noticesContext = notices.map(n => 
        `- [${n.category}] ${n.title}: ${n.description}. Deadline: ${n.expiryDate.toDate().toLocaleString()}. Priority: ${n.priority}`
      ).join('\n');

      const systemPrompt = `You are an AI Campus Assistant for a college notice management system.
Your job is to answer student questions based ONLY on the provided notice board data.
If you don't know the answer or it's not in the data, politely say you don't have that information.
Be concise, helpful, and friendly.

CURRENT NOTICES:
${noticesContext}

User Question: ${userMsg}`;

      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: systemPrompt
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't generate a response." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all z-50 border border-white/10"
      >
        <MessageSquare className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] bg-slate-900/60 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-6 flex flex-col z-50 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              <h2 className="text-lg font-black uppercase italic tracking-tighter">AI Assistant</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="ml-auto p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-widest ml-3 mb-0.5",
                    msg.role === 'ai' ? "text-indigo-400" : "text-slate-600"
                  )}>
                    {msg.role === 'ai' ? 'Assistant' : 'User'}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs leading-relaxed max-w-[90%]",
                    msg.role === 'ai' 
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tl-none" 
                      : "bg-slate-800/80 text-white rounded-tr-none"
                  )}>
                    {msg.role === 'ai' && <span className="font-bold text-indigo-300 block mb-1">DATA SCANNED:</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-3">Assistant</div>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="mt-4 p-1 bg-slate-950 rounded-full border border-slate-800 flex items-center shrink-0">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about notices..."
                className="bg-transparent flex-1 px-4 text-xs focus:outline-none text-white font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
