import React, { useState, useRef, useEffect } from 'react';
import { useNotices } from '../hooks/useNotices';
import { ai, MODELS, isQuotaExceeded } from '../lib/gemini';
import { Logo } from './Logo';
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
    { role: 'ai', text: "Hello! I'm Nexora AI, your SmartNotice Assistant. How can I help you find information about campus notices today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // New state for Voice Mode toggle
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { notices } = useNotices();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize Speech Recognition
  const initRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Inappropriate language filter
    const inappropriateWords = ['badword1', 'badword2', 'offensive']; // Add real filters as needed
    const containsInappropriateContent = (text: string) => {
      return inappropriateWords.some(word => text.toLowerCase().includes(word));
    };

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Nexora AI: Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      
      // Filter inappropriate content early
      if (containsInappropriateContent(currentText)) {
        console.warn('Nexora AI: Inappropriate content detected. Ignoring.');
        return;
      }

      if (currentText) {
        console.log('Nexora AI: Hearing...', currentText);
        setInput(currentText);
      }

      if (finalTranscript) {
        console.log('Nexora AI: Final speech detected:', finalTranscript);
        setIsListening(false);
        
        // Just populate input and stop listening, do NOT auto-send
        try { recognition.stop(); } catch (e) {}
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Nexora AI: Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        alert("Nexora AI: Microphone access was denied. Please allow microphone access in your browser settings.");
        setIsVoiceMode(false);
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        console.log("Nexora AI: No speech detected.");
        // Don't stop listening immediately, maybe it's just a pause
      } else if (event.error === 'network') {
        console.warn("Nexora AI: Network error in recognition.");
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Nexora AI: Voice recognition ended');
    };

    return recognition;
  };

  useEffect(() => {
    // Basic check for support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const resumeAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const startListening = () => {
    try {
      // Small safety delay to ensure previous instance is cleaned up by the browser
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      
      // Create a fresh instance for reliability
      const recognition = initRecognition();
      if (!recognition) return;
      
      recognitionRef.current = recognition;
      console.log('Nexora AI: Requesting browser to start microphone listener...');
      recognition.start();
    } catch (err: any) {
      console.warn('Nexora AI: Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  // Helper to handle sending from voice or button
  const handleSendWithText = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    if (isVoiceMode || ttsEnabled) resumeAudioContext();

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const noticesContext = notices.slice(0, 20).map(n => {
        let content = `- [${n.category}] ${n.title}: ${n.description}`;
        if (n.extractedText) {
          content += `\n  AI-EXTRACTED CONTENT: ${n.extractedText}`;
        }
        return content;
      }).join('\n\n');

      const systemPrompt = `You are Nexora AI, a Smart University Notice Assistant.

Your job is to answer ONLY from uploaded notices, PDFs, images, or extracted OCR text provided below.

CORE RULES:
1. ALWAYS search uploaded content first before answering.
2. NEVER say information is missing if it exists in any notice.
3. NEVER repeat raw scanned text or dump full notices unless user asks.
4. Keep answers clean, structured, and student-friendly.
5. Avoid messy or duplicated outputs.

ANSWER FORMAT RULE:
Always respond in ONE of these formats:
A) SHORT ANSWER (default): direct, clean response.
B) BULLET SUMMARY: when multiple details exist.
C) STRUCTURED FORMAT: when notice is big or complex.

EXAMPLE OUTPUT STYLE:
User: When is tour?
AI:
🚌 Educational Tour (MCA)
📍 Goa Trip
• Dates: 20 June 2026 – 24 June 2026
• Deadline: 5 June 2026
• Fee: ₹4,500

User: dates?
AI:
📅 Important MCA Dates:
• Summer Vacation: 25 May – 15 June 2026
• Classes Resume: 16 June 2026
• Tour: 20–24 June 2026
• Deadline: 5 June 2026

STRICT RULES:
❌ Do NOT repeat full notice text.
❌ Do NOT mix multiple styles randomly.
❌ Do NOT say "DATA SCANNED" in the output.
❌ Do NOT be verbose or messy.
✔ Be clean, structured, and student-friendly.
✔ Be consistent across all answers.

NOTICES:
${noticesContext}

User Question: ${textToSend}`;

      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: systemPrompt,
        config: {
          responseModalities: [Modality.TEXT],
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      // Handle Voice Response
      if (ttsEnabled) {
        await speakText(aiResponse);
      }

      // After responding, if user was in Voice Input Mode, resume listening
      if (isVoiceMode && isOpen) {
        setTimeout(() => {
          if (isVoiceMode && !isListening) startListening();
        }, 300);
      }
    } catch (err: any) {
      console.warn('Chatbot AI Error:', err);
      let errorMsg = "I'm having trouble connecting. Please try again!";
      
      if (isQuotaExceeded(err)) {
        errorMsg = "I've reached my daily message limit (Quota Exceeded). Please try again in 24 hours or check back later!";
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceMode = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    if (isVoiceMode) {
      // Transitioning to OFF
      setIsVoiceMode(false);
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (e) {}
        activeSourceRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      // Transitioning to ON
      try {
        // Stop any current speaking before starting listen
        if (activeSourceRef.current) {
          try { activeSourceRef.current.stop(); } catch (e) {}
          activeSourceRef.current = null;
        }
        setIsSpeaking(false);

        // Prime microphone permission - but stop it immediately
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setIsVoiceMode(true);
        // Note: we don't force ttsEnabled here anymore, it's controlled by the sound icon
        resumeAudioContext();
        startListening();
      } catch (err: any) {
        console.error("Microphone permission check failed:", err);
        
        const isPermissionError = 
          err.name === 'NotAllowedError' || 
          err.name === 'PermissionDeniedError' || 
          err.message?.toLowerCase().includes('denied') ||
          err.message?.toLowerCase().includes('allowed');

        if (isPermissionError) {
          alert("Nexora AI: Microphone access is blocked. \n\nTo fix this:\n1. Click the lock/settings icon in your browser's address bar.\n2. Enable 'Microphone'.\n3. Refresh the page.");
        } else {
          alert(`Nexora AI: Could not access microphone (${err.name}). Please ensure your mic is connected and try refreshing.`);
        }
        setIsVoiceMode(false);
      }
    }
  };

  const speakText = async (text: string) => {
    if (!ttsEnabled) return;

    try {
      // Step 1: Stop any existing AI speech before starting new one
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        activeSourceRef.current = null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsSpeaking(true);

      // Clean up text for TTS (remove markdown and emojis for cleaner speech)
      const cleanText = text
        .replace(/[*_#`]/g, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .trim();

      const response = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text: cleanText || "Here is your answer." }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Stable Female Voice
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

        return new Promise<void>((resolve) => {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current!.destination);
          
          source.onended = () => {
            setIsSpeaking(false);
            activeSourceRef.current = null;
            resolve();
          };

          activeSourceRef.current = source;
          source.start();
        });
      } else {
        setIsSpeaking(false);
      }
    } catch (err: any) {
      console.warn('TTS error:', err);
      setIsSpeaking(false);
      if (isQuotaExceeded(err)) {
        setTtsEnabled(false);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendWithText(input);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all z-50 border border-white/10"
      >
        <MessageSquare className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[var(--bg-main)] rounded-full"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] rounded-[2.5rem] p-6 flex flex-col z-50 overflow-hidden shadow-2xl dark:shadow-none"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <Logo 
                className={cn(
                  "w-8 h-8",
                  isSpeaking ? "animate-[pulse_1.5s_ease-in-out_infinite] scale-110 ring-2 ring-indigo-400/50 rounded-full" : ""
                )} 
              />
              <div className="flex flex-col">
                <h2 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-primary)] leading-none">Nexora AI</h2>
                {isSpeaking && <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter animate-pulse">Speaking...</span>}
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                {/* AI Voice Output Toggle (Mute/Unmute) */}
                <button 
                  onClick={() => {
                    const nextMuteState = !ttsEnabled;
                    setTtsEnabled(nextMuteState);
                    
                    if (nextMuteState) {
                      resumeAudioContext();
                    } else if (activeSourceRef.current) {
                      // If muting, stop current playback immediately
                      try {
                        activeSourceRef.current.stop();
                      } catch (e) {}
                      activeSourceRef.current = null;
                      setIsSpeaking(false);
                    }
                  }}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    ttsEnabled 
                      ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-lg shadow-indigo-500/10 scale-110" 
                      : "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                  )}
                  title={ttsEnabled ? "AI Voice is ON" : "AI Voice is MUTED"}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={ttsEnabled ? 'on' : 'off'}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {ttsEnabled ? (
                        <div className="relative">
                          <Volume2 className="w-4 h-4" />
                          {isSpeaking && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                          )}
                        </div>
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </button>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[var(--text-primary)]/5 rounded-xl transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                    msg.role === 'ai' ? "text-indigo-400" : "text-[var(--text-secondary)]"
                  )}>
                    {msg.role === 'ai' ? 'Nexora AI' : 'User'}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap",
                    msg.role === 'ai' 
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-[var(--text-primary)] rounded-tl-none" 
                      : "bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-tr-none border border-[var(--border-color)]"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col gap-1 items-start">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-3">Nexora AI</div>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="mt-4 flex flex-col gap-2 shrink-0">
              <AnimatePresence>
                {isVoiceMode && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isListening ? "bg-red-500 animate-pulse" : "bg-indigo-300"
                    )}></div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {isListening ? "Nexora is listening..." : isSpeaking ? "Nexora is speaking..." : "Voice Mode Active"}
                    </span>
                    {isListening && (
                      <div className="flex gap-0.5 ml-auto">
                        <div className="w-1 h-3 bg-red-500/40 rounded-full animate-[bounce_1s_infinite]"></div>
                        <div className="w-1 h-5 bg-red-500/60 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                        <div className="w-1 h-2 bg-red-500/40 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <form onSubmit={handleSend} className={cn(
                "p-1 bg-[var(--bg-main)] rounded-full border flex items-center transition-all duration-300",
                isListening ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-[1.02]" : "border-[var(--border-color)]"
              )}>
                <button 
                  type="button"
                  onClick={toggleVoiceMode}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isVoiceMode 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5"
                  )}
                  title={isVoiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                >
                  <div className="relative">
                    {isVoiceMode ? (
                      isListening ? (
                        <Mic className="w-4 h-4 animate-[pulse_1s_ease-in-out_infinite] text-red-500 fill-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <>
                        <Mic className="w-4 h-4 opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[1px] h-5 bg-[var(--text-secondary)] rotate-45 transform origin-center"></div>
                        </div>
                      </>
                    )}
                  </div>
                </button>
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening... Speak now" : isSpeaking ? "Nexora is reading..." : "Ask about notices..."}
                  className={cn(
                    "bg-transparent flex-1 px-3 text-xs focus:outline-none text-[var(--text-primary)] font-medium transition-all",
                    isListening ? "text-indigo-500 font-bold" : ""
                  )}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
