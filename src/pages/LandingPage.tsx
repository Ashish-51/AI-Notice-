import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Shield, GraduationCap, ChevronRight, Zap, Clock, Search as SearchIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#020617] selection:bg-blue-500/30 font-sans tracking-tight">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center italic font-black text-2xl shadow-lg shadow-blue-500/20">N</div>
          <span className="font-bold text-xl tracking-tighter text-white uppercase italic">SmartNotice</span>
        </div>
        <button 
          onClick={onStart}
          className="px-8 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full transition-all backdrop-blur-sm text-[10px] uppercase font-black tracking-widest"
        >
          Portal Login
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" />
              AI-Powered Campus Feed
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-6 uppercase italic leading-[0.9]">
              The Future of <span className="text-blue-500">Notice Boards</span> is here.
            </h1>
            <p className="text-slate-500 text-lg mb-10 max-w-lg leading-relaxed font-medium">
              Streamline college communication with AI-generated summaries, smart prioritization, and real-time tracking. Zero latency. Zero missed deadlines.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onStart}
                className="btn-primary flex items-center gap-2 px-10 py-5"
              >
                Access Portal
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-5 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                System Overview
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
              <div>
                <p className="text-3xl font-bold text-white mb-1">99%</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Efficiency</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">0%</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Missed Deadlines</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">24/7</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Support</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 glass-card p-4 aspect-[4/3] flex items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
                  <div className="w-32 h-4 bg-white/10 rounded mb-3"></div>
                  <div className="w-full h-12 bg-white/10 rounded"></div>
                </div>
                <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-24 h-4 bg-blue-500/20 rounded"></div>
                    <div className="w-16 h-4 bg-red-500/20 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-blue-500/30 rounded"></div>
                    <div className="w-3/4 h-3 bg-blue-500/30 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Aesthetic Background Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full"></div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
