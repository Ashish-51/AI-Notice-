import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  GraduationCap,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';
import { INSTITUTIONS, DEPARTMENTS } from '../constants';
import toast, { Toaster } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

const TEACHER_ACCESS_CODE = 'PARUL01';

const STUDENT_EMAIL_REGEX = /^\d+@goa\.paruluniversity\.ac\.in$/;
const TEACHER_EMAIL_REGEX = /^.+@goa\.paruluniversity\.ac\.in$/;

export default function Signup({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { signUpWithEmail, completeProfile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOAuth = !!user;

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    semester: '',
    staffId: '',
    accessCode: ''
  });

  const availableDepartments = useMemo(() => {
    return formData.institution ? DEPARTMENTS[formData.institution] || [] : [];
  }, [formData.institution]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOAuth) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    // Role-based Email & Code Validation
    if (role === 'student' && !STUDENT_EMAIL_REGEX.test(formData.email.trim())) {
      setError('Invalid institutional email format');
      return;
    }

    if (role === 'teacher') {
      if (!TEACHER_EMAIL_REGEX.test(formData.email.trim())) {
        setError('Invalid teacher email format. Must end with @goa.paruluniversity.ac.in');
        return;
      }
      if (formData.accessCode !== TEACHER_ACCESS_CODE) {
        setError('Invalid authorized key');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (isOAuth) {
        await completeProfile({
          displayName: formData.name,
          role,
          institution: formData.institution,
          email: formData.email.trim(),
          staffId: role === 'teacher' ? formData.staffId : undefined,
          department: formData.department || 'General',
          semester: role === 'student' ? formData.semester : undefined
        });
      } else {
        await signUpWithEmail(formData.email.trim(), formData.password, {
          displayName: formData.name,
          role,
          institution: formData.institution,
          email: formData.email.trim(),
          staffId: role === 'teacher' ? formData.staffId : undefined,
          department: formData.department || 'General',
          semester: role === 'student' ? formData.semester : undefined
        });
      }
      toast.success("Account Created Successfully 🎉");
    } catch (err: any) {
      console.warn('Firebase Auth:', err.code);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Registration is currently disabled. Please enable "Email/Password" in your Firebase Auth Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid campus email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 8 characters long.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('The server rejected the registration attempt. This often happens if the Email/Password sign-in method is not enabled in the Firebase Console.');
      } else {
        setError(err.message || 'Signup failed. Please check your network connection.');
      }
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <Toaster position="top-center" />
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
      <div className="absolute top-0 right-0 p-8 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-3 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Create Account</h1>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em] text-[10px]">Campus Notice Board Security Protocol</p>
        </div>

        <div className="glass-card p-10 shadow-2xl dark:shadow-none relative overflow-hidden">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step >= s ? "bg-blue-500 w-full" : "bg-slate-800 w-4"
                )}
              />
            ))}
          </div>

          <form onSubmit={handleSignup} className="mt-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Step 1 — Identify your role</p>
                    <h2 className="text-xl font-bold italic text-[var(--text-primary)] uppercase italic">Who are you?</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setRole('student')}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-center group",
                        role === 'student' 
                          ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/10" 
                          : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-slate-700"
                      )}
                    >
                      <GraduationCap className={cn("w-10 h-10 mx-auto mb-4 transition-colors", role === 'student' ? "text-blue-500" : "text-[var(--text-secondary)] group-hover:text-slate-400")} />
                      <div className={cn("font-bold uppercase tracking-tighter italic", role === 'student' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>Student</div>
                      <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mt-1 opacity-50">Direct Access</div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-center group",
                        role === 'teacher' 
                          ? "bg-purple-600/10 border-purple-500/50 shadow-lg shadow-purple-600/10" 
                          : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-slate-700"
                      )}
                    >
                      <ShieldCheck className={cn("w-10 h-10 mx-auto mb-4 transition-colors", role === 'teacher' ? "text-purple-500" : "text-[var(--text-secondary)] group-hover:text-slate-400")} />
                      <div className={cn("font-bold uppercase tracking-tighter italic", role === 'teacher' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>Teacher / Admin</div>
                      <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mt-1 opacity-50">Verified Role</div>
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={nextStep}
                    className="w-full btn-primary py-4 mt-6 flex items-center justify-center gap-2 group"
                  >
                    CONTINUE <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Step 2 — Personal Details</p>
                    <h2 className="text-xl font-bold italic text-[var(--text-primary)] uppercase tracking-tighter">Enter profile information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="John Doe"
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Email Address</label>
                       <div className="relative group">
                         <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                         <input 
                           type="email"
                           required
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           placeholder={role === 'student' ? "2503032020017@goa.paruluniversity.ac.in" : "name@goa.paruluniversity.ac.in"}
                           className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium"
                         />
                       </div>
                       <p className="text-[9px] text-[var(--text-secondary)] mt-2 ml-4 uppercase tracking-tight font-bold opacity-50">
                         {role === 'student' ? 'Must follow numeric format: (ID)@goa.paruluniversity.ac.in' : 'Must end with @goa.paruluniversity.ac.in'}
                       </p>
                    </div>

                    <div className="md:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Institution</label>
                      <div className="relative group">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                        <select 
                          required
                          value={formData.institution}
                          onChange={(e) => setFormData({...formData, institution: e.target.value, department: ''})}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-10 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium appearance-none"
                        >
                          <option value="">Select Faculty</option>
                          {INSTITUTIONS.map(inst => <option key={inst} value={inst} className="bg-[var(--bg-surface)]">{inst}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Department</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                        <select 
                          required
                          disabled={!formData.institution}
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-10 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium appearance-none disabled:opacity-50"
                        >
                          <option value="">Select Dept.</option>
                          {availableDepartments.map(dept => <option key={dept} value={dept} className="bg-[var(--bg-surface)]">{dept}</option>)}
                        </select>
                      </div>
                    </div>

                    {role === 'student' && (
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Semester</label>
                        <div className="relative group">
                          <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                          <select 
                            required
                            value={formData.semester}
                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-10 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium appearance-none"
                          >
                            <option value="">Select Sem.</option>
                            {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <option key={s} value={s} className="bg-[var(--bg-surface)]">Semester {s}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {!isOAuth && (
                      <>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Password</label>
                          <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                            <input 
                              type="password"
                              required
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-2 block">Confirm</label>
                          <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                            <input 
                              type="password"
                              required
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 text-[var(--text-primary)] font-medium"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={prevStep}
                      className="btn-secondary w-1/3 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> BACK
                    </button>
                    <button 
                      type="button"
                      onClick={role === 'teacher' ? nextStep : handleSignup}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {role === 'teacher' ? "NEXT" : "CREATE ACCOUNT"} 
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && role === 'teacher' && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">Step 3 — Security Verification</p>
                    <h2 className="text-xl font-bold italic text-[var(--text-primary)] uppercase italic">Teacher Validation</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-4 mb-1.5 block">Staff / Employee ID</label>
                      <input 
                        type="text"
                        required
                        value={formData.staffId}
                        onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                        placeholder="STAFF-202X or EMP-001"
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3.5 px-6 focus:outline-none focus:border-purple-500/50 text-[var(--text-primary)] uppercase"
                      />
                      <p className="text-[9px] text-[var(--text-secondary)] mt-2 ml-4 uppercase tracking-tight font-bold opacity-50">Your unique staff or employee identification number</p>
                    </div>

                  <div className="p-8 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)] border-dashed rounded-[2.5rem]">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-4 block text-center">Enter Authorized Key</label>
                      <input 
                        type="password"
                        required
                        value={formData.accessCode}
                        onChange={(e) => setFormData({...formData, accessCode: e.target.value})}
                        placeholder="Enter authorized key"
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-5 px-6 focus:outline-none focus:border-purple-500/50 text-[var(--text-primary)] text-center font-mono text-xl tracking-[0.5em]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-6">
                      <div className="flex items-center gap-3 text-rose-400 text-xs font-bold leading-tight mb-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                      {error.includes('already registered') && (
                        <button 
                          onClick={onSwitchToLogin}
                          className="w-full mt-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all"
                        >
                          Switch to Login
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={prevStep}
                      className="btn-secondary w-1/3 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> BACK
                    </button>
                    <button 
                      type="button"
                      onClick={handleSignup}
                      disabled={loading}
                      className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 border-none hover:from-purple-500 hover:to-indigo-500 h-[3.25rem]"
                    >
                      {loading ? "VALIDATING..." : "FINISH REGISTRATION"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center mt-10 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
            Already have an account?{" "}
            <button 
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:text-blue-400 transition-colors ml-1"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
