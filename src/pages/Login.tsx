import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, UserCheck, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const STUDENT_EMAIL_REGEX = /^\d+@goa\.paruluniversity\.ac\.in$/;
const TEACHER_EMAIL_REGEX = /^.+@goa\.paruluniversity\.ac\.in$/;

export default function Login({ 
  onSwitchToSignup, 
  onSwitchToForgot,
  onBack
}: { 
  onSwitchToSignup: () => void, 
  onSwitchToForgot: () => void,
  onBack?: () => void
}) {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const cleanEmail = email.trim();
    const isStudent = STUDENT_EMAIL_REGEX.test(cleanEmail);
    const isTeacher = TEACHER_EMAIL_REGEX.test(cleanEmail);

    if (!isStudent && !isTeacher) {
      setError('Invalid institutional email format');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmail(cleanEmail, password);
      toast.success("Login Successful 🎉");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid campus email address.');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="top-center" />
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-indigo-900/20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-10 relative">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute left-0 top-0 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20 italic font-black text-3xl text-white">N</div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Welcome Back</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Access your campus priority board</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2 block">Campus Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="2503032020017@goa.paruluniversity.ac.in"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Password</label>
                <button 
                  type="button" 
                  onClick={onSwitchToForgot}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Recovery
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-100 text-slate-950 font-black h-16 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0f172a] px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">IDP Verification</span>
            </div>
          </div>

          <p className="text-center mt-10 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            New to campus?{" "}
            <button 
              onClick={onSwitchToSignup}
              className="text-white hover:text-blue-400 transition-colors underline underline-offset-4 ml-1"
            >
              Register Account
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
