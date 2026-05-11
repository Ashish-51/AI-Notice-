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

const TEACHER_ACCESS_CODE = 'CAMPUS-2026-ADMIN';

const INSTITUTIONS = [
  "Faculty of Information Technology",
  "Faculty of Engineering",
  "Faculty of IT & Computer Science",
  "Faculty of Nursing",
  "Faculty of Pharmacy",
  "Faculty of Management"
];

const DEPARTMENTS: Record<string, string[]> = {
  "Faculty of Information Technology": ["BTech", "MTech", "MCA", "BCA", "Diploma in CS"],
  "Faculty of Engineering": ["BTech", "MTech", "Diploma in Engineering"],
  "Faculty of IT & Computer Science": ["BTech", "MTech", "MCA", "BCA", "Diploma in CS"],
  "Faculty of Nursing": ["GNM", "BSc Nursing", "OT Technology (OTT)", "Physiotherapy"],
  "Faculty of Pharmacy": ["D.Pharm", "B.Pharm", "M.Pharm", "Pharmaceutical Sciences"],
  "Faculty of Management": ["MBA", "BBA", "BMS", "Finance", "HR", "Marketing"]
};

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
    staffId: '',
    accessCode: ''
  });

  const availableDepartments = useMemo(() => {
    return formData.institution ? DEPARTMENTS[formData.institution] || [] : [];
  }, [formData.institution]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOAuth && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (role === 'teacher' && formData.accessCode !== TEACHER_ACCESS_CODE) {
      setError('Invalid Teacher Access Code. Please use the administrative code CAMPUS-2026-ADMIN for this demo.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isOAuth) {
        await completeProfile({
          displayName: formData.name,
          role,
          institution: formData.institution,
          department: formData.department,
          staffId: role === 'teacher' ? formData.staffId : undefined,
          email: formData.email.trim(),
        });
      } else {
        await signUpWithEmail(formData.email.trim(), formData.password, {
          displayName: formData.name,
          role,
          institution: formData.institution,
          department: formData.department,
          staffId: role === 'teacher' ? formData.staffId : undefined,
          email: formData.email.trim(),
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console. Please enable it in the Authentication > Sign-in method tab.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid campus email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Signup failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Create Account</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Join your campus notice board system</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
             <motion.div 
               className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,1)]"
               initial={{ width: '0%' }}
               animate={{ width: `${(step / (role === 'teacher' ? 3 : 2)) * 100}%` }}
             />
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
                    <h2 className="text-xl font-bold italic text-white uppercase italic">Who are you?</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setRole('student')}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-center group",
                        role === 'student' 
                          ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/10" 
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <GraduationCap className={cn("w-10 h-10 mx-auto mb-4 transition-colors", role === 'student' ? "text-blue-500" : "text-slate-600 group-hover:text-slate-400")} />
                      <div className={cn("font-bold uppercase tracking-tighter italic", role === 'student' ? "text-white" : "text-slate-500")}>Student</div>
                      <div className="text-[9px] uppercase tracking-widest text-slate-600 mt-1">Direct Access</div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-center group",
                        role === 'teacher' 
                          ? "bg-purple-600/10 border-purple-500/50 shadow-lg shadow-purple-600/10" 
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <ShieldCheck className={cn("w-10 h-10 mx-auto mb-4 transition-colors", role === 'teacher' ? "text-purple-500" : "text-slate-600 group-hover:text-slate-400")} />
                      <div className={cn("font-bold uppercase tracking-tighter italic", role === 'teacher' ? "text-white" : "text-slate-500")}>Teacher / Admin</div>
                      <div className="text-[9px] uppercase tracking-widest text-slate-600 mt-1">Verified Role</div>
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
                    <h2 className="text-xl font-bold italic text-white uppercase tracking-tighter">Enter profile information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Dr. Sarah Johnson"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 shadow-inner focus:outline-none focus:border-blue-500/50 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Institution</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select 
                          required
                          value={formData.institution}
                          onChange={(e) => setFormData({...formData, institution: e.target.value, department: ''})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 shadow-inner focus:outline-none focus:border-blue-500/50 text-white appearance-none"
                        >
                          <option value="">Select Faculty</option>
                          {INSTITUTIONS.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Department</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select 
                          required
                          disabled={!formData.institution}
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 shadow-inner focus:outline-none focus:border-blue-500/50 text-white disabled:opacity-50 appearance-none"
                        >
                          <option value="">Select Dept.</option>
                          {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Email Address</label>
                       <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                         <input 
                           type="email"
                           required
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           placeholder="staff@college.edu"
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 focus:outline-none focus:border-blue-500/50 text-white"
                         />
                       </div>
                    </div>

                    {!isOAuth && (
                      <>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="password"
                              required
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 focus:outline-none focus:border-blue-500/50 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Confirm</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="password"
                              required
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 focus:outline-none focus:border-blue-500/50 text-white"
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
                    <h2 className="text-xl font-bold italic text-white uppercase italic">Teacher Validation</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-4 mb-1.5 block">Staff / Employee ID</label>
                      <input 
                        type="text"
                        required
                        value={formData.staffId}
                        onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                        placeholder="STAFF-202X or EMP-001"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-6 focus:outline-none focus:border-purple-500/50 text-white uppercase"
                      />
                      <p className="text-[9px] text-slate-600 mt-2 ml-4 uppercase tracking-tight">Your unique staff or employee identification number</p>
                    </div>

                    <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-[2rem] border-dashed">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-3 block text-center">Teacher Access Code</label>
                      <input 
                        type="password"
                        required
                        value={formData.accessCode}
                        onChange={(e) => setFormData({...formData, accessCode: e.target.value})}
                        placeholder="ENTER AUTH CODE"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-purple-500/50 text-white text-center font-mono tracking-widest uppercase placeholder:text-slate-800"
                      />
                      <p className="text-[9px] text-slate-600 mt-2 text-center uppercase tracking-tight">Code: <span className="text-slate-400 select-all">CAMPUS-2026-ADMIN</span></p>
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

          <p className="text-center mt-10 text-xs font-bold text-slate-600 uppercase tracking-widest">
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
