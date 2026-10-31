import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode,
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail 
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authModalMode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please verify your credentials or try Google Sign-In.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please switch to Sign In.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password provider is not yet turned on in your Firebase Console. Please click "Continue with Google" or enable Email/Password in Firebase Console -> Authentication -> Sign-in method.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please use at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in popup was closed before completing.');
      } else {
        setErrorMsg(err.message || 'Could not sign in with Google. Check popup permissions.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div 
        className="bg-gradient-to-b from-[#17171D] via-[#121218] to-[#0D0D14] border border-white/10 rounded-2xl sm:rounded-[28px] max-w-md w-full p-4 sm:p-7 space-y-4 sm:space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-52 h-52 bg-[#7C5CFF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-[#3DDC97]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9A9AA5] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 relative z-10 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-1">
            <img 
              src="/assets/aistudio/image_05f63413.png" 
              alt="Budgio" 
              className="w-8 h-8 rounded-lg object-contain drop-shadow"
            />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {authModalMode === 'signin' ? 'Welcome Back to Budgio' : 'Create Your Student Account'}
          </h3>
          <p className="text-xs text-[#9A9AA5]">
            {authModalMode === 'signin' 
              ? 'Access your saved expenses, budget limits, and cloud backups.' 
              : 'Sync student spending effortlessly across your phone and laptop.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#0B0B0F] border border-white/10 rounded-xl text-xs font-semibold relative z-10">
          <button
            type="button"
            onClick={() => { setAuthModalMode('signin'); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'signin'
                ? 'bg-[#7C5CFF] text-white shadow-sm'
                : 'text-[#9A9AA5] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthModalMode('signup'); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'signup'
                ? 'bg-[#7C5CFF] text-white shadow-sm'
                : 'text-[#9A9AA5] hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs flex items-start gap-2.5 relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Google Sign In (Recommended) */}
        <div className="space-y-3 relative z-10">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {/* Google G SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#121218] px-3 text-[11px] font-medium text-[#9A9AA5] shrink-0 uppercase tracking-wider">
              Or with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs relative z-10">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-[#9A9AA5] mb-1 font-medium">Your Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#9A9AA5]" />
                <input
                  type="text"
                  placeholder="e.g. Maya Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#9A9AA5] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#9A9AA5] mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#9A9AA5]" />
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#9A9AA5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#9A9AA5] mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#9A9AA5]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl pl-9 pr-10 py-2 text-white placeholder-[#9A9AA5] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9A9AA5] hover:text-white"
                aria-label="Toggle password view"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 font-bold text-xs text-white bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] hover:opacity-95 rounded-xl shadow-[0_0_20px_rgba(124,92,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : authModalMode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/5 text-center text-[11px] text-[#9A9AA5] flex items-center justify-center gap-1.5 relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3DDC97]" />
          <span>Connected to Firebase: student-expense-analyzer</span>
        </div>
      </div>
    </div>
  );
};
