import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login({ onSwitchToSignup, onSwitchToForgot }: { onSwitchToSignup: () => void, onSwitchToForgot: () => void }) {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again or sign up if you don\'t have an account.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid campus email address.');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20 italic font-black text-3xl">N</div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sign in to access your notice board</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-1.5 block">Email / Student ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 px-4 text-[10px] font-black uppercase tracking-widest">
                <label className="text-slate-500">Password</label>
                <button 
                  type="button" 
                  onClick={onSwitchToForgot}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 text-rose-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 mt-2 flex items-center justify-center gap-2 group"
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0f172a] px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">Secure Gateway</span>
            </div>
          </div>

          <button 
            onClick={() => signInWithGoogle()}
            className="w-full bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-2xl py-3.5 px-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            IDP Login
          </button>

          <p className="text-center mt-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Don't have an account?{" "}
            <button 
              onClick={onSwitchToSignup}
              className="text-blue-500 hover:text-blue-400 transition-colors ml-1"
            >
              Sign Up
            </button>
          </p>

          <div className="mt-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Demo Credentials</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Teacher / Admin</p>
                <code className="text-[10px] text-slate-400">sarah.johnson@college.edu / teacher123</code>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Student</p>
                <code className="text-[10px] text-slate-400">alex.kumar@student.edu / student123</code>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
