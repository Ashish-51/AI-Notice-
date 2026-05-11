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
  Search,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Modality } from "@google/genai";

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
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { notices } = useNotices();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send after a short delay if needed, 
        // but it's better to let user confirm.
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speakText = async (text: string) => {
    if (!ttsEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const response = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
        }

        const float32Data = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          float32Data[i] = bytes[i] / 32768;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

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
      // Create optimized context from notices - only essential info to reduce latency
      const noticesContext = notices.slice(0, 15).map(n => 
        `- [${n.category}] ${n.title}: ${n.summary || n.description.substring(0, 80)}${n.description.length > 80 ? '...' : ''}`
      ).join('\n');

      const systemPrompt = `You are a fast AI Campus Assistant. 
Answer questions using ONLY the notice data provided. 
Be extremely concise (max 2-3 sentences).
If data is missing, say "Information not found".

NOTICES:
${noticesContext}

User: ${userMsg}`;

      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: systemPrompt,
        config: {
          responseModalities: [Modality.TEXT],
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      if (ttsEnabled) {
        speakText(aiResponse);
      }
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
              
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    ttsEnabled ? "text-indigo-400 hover:bg-indigo-500/10" : "text-slate-500 hover:bg-white/5"
                  )}
                  title={ttsEnabled ? "Turn off Voice" : "Turn on Voice"}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
              <button 
                type="button"
                onClick={toggleListening}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isListening 
                    ? "bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/30" 
                    : "text-slate-500 hover:bg-white/5"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask about notices..."}
                className="bg-transparent flex-1 px-3 text-xs focus:outline-none text-white font-medium"
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
