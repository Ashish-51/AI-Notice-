import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const INSTITUTIONAL_EMAIL_REGEX = /^.+@goa\.paruluniversity\.ac\.in$/;

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!INSTITUTIONAL_EMAIL_REGEX.test(email.trim())) {
      setError('Invalid institutional email format');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-[var(--bg-main)] to-indigo-900/10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-10 text-[10px] font-black uppercase tracking-[0.3em] group ml-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO LOGIN
        </button>

        <div className="bg-[var(--card-bg)] backdrop-blur-2xl border border-[var(--border-color)] rounded-[3rem] p-10 shadow-2xl dark:shadow-none">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-3 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Reset Access</h1>
            <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em] text-[10px] opacity-70">Secure Recovery Protocol</p>
          </div>

          {sent ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10 dark:shadow-none">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black italic text-[var(--text-primary)] uppercase tracking-tight mb-3">Transmission Successful</h2>
              <p className="text-[var(--text-secondary)] text-sm font-medium mb-10 px-4">Password reset link sent to your email <span className="text-[var(--text-primary)] block mt-1">{email}</span></p>
              <button 
                onClick={onBack}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-black h-16 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest transition-all transform active:scale-95"
              >
                RETURN TO GATEWAY
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block opacity-70">Registered Campus Email</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors opacity-50" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@goa.paruluniversity.ac.in"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-[var(--text-primary)] font-medium"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-xs font-bold leading-tight"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-black h-16 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest transition-all transform active:scale-95 disabled:opacity-50 shadow-2xl dark:shadow-none"
              >
                {loading ? "PROCESSING..." : "REQUEST RESET LINK"}
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
