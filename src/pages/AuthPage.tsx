import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPage() {
  const { setRole } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Welcome to SmartNotice</h2>
          <p className="text-slate-400">Please select your role to continue setting up your account.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRole('student')}
            className="group relative glass-card p-8 text-left hover:border-blue-500/50 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl group-hover:bg-blue-600/10 transition-all rounded-full translate-x-10 -translate-y-10"></div>
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <GraduationCap className="w-8 h-8 text-blue-500 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Student</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Track deadlines, view assignments, and get AI-summarized updates for your courses.
            </p>
            <div className="flex items-center text-blue-400 font-semibold group-hover:gap-2 transition-all">
              Continue as Student <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRole('teacher')}
            className="group relative glass-card p-8 text-left hover:border-amber-500/50 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-3xl group-hover:bg-amber-600/10 transition-all rounded-full translate-x-10 -translate-y-10"></div>
            <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <ShieldCheck className="w-8 h-8 text-amber-500 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Teacher / Admin</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Publish notices with AI tools, manage deadlines, and analyze student engagement.
            </p>
            <div className="flex items-center text-amber-400 font-semibold group-hover:gap-2 transition-all">
              Continue as Teacher <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
