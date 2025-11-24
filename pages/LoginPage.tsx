
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { db } from '../services/db';
import { ArrowRight, Shield, GraduationCap, AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button, InputField } from '../components/Common';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db_firestore } from '../firebaseConfig';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// Google Logo Component for authentic branding
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetStatus, setResetStatus] = useState<'idle' | 'success'>('idle');

  const handleGoogleLogin = async () => {
      setError('');
      setIsLoading(true);
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;

          // 1. Save/Update user in Firestore (Real DB)
          const userRef = doc(db_firestore, "users", firebaseUser.uid);
          await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              lastLogin: new Date()
          }, { merge: true });

          // 2. Sync with local Mock DB (for existing app architecture compatibility)
          const appUser = db.users.syncGoogleUser(firebaseUser);
          
          // 3. Complete Login
          onLogin(appUser);
      } catch (err: any) {
          console.error("Google Auth Error", err);
          setError(err.message || "Failed to sign in with Google.");
          setIsLoading(false);
      }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Legacy Mock Login Logic (kept for demo users)
    setTimeout(() => {
      const user = db.users.find(email);
      if (user && (user.password === password || (!user.password && password === 'password123'))) {
          onLogin(user);
      } else {
          setError('Invalid email or password. Try "Google Sign In" or demo accounts below.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      setTimeout(() => {
          const user = db.users.find(email);
          console.log(`[DEMO] Password reset requested for: ${email}. User exists: ${!!user}`);
          setResetStatus('success');
          setIsLoading(false);
      }, 1500);
  };

  const demoLogin = (role: UserRole) => {
    const users = db.users.getAll();
    const user = users.find(u => u.role === role);
    if (user) {
        setEmail(user.email || '');
        setPassword(user.password || 'password123');
        setError('');
        setView('login'); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center p-4">
      <div className="max-w-[1000px] w-full bg-white rounded-[28px] shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        
        {/* Left Side - Info */}
        <div className="hidden md:flex md:w-1/2 bg-[#f8fafe] p-12 flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 text-2xl font-normal text-[#1f1f1f] mb-8">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
                 Lumina
              </div>
              <h1 className="text-4xl font-normal text-[#1f1f1f] mb-6 leading-tight">
                  Learn anywhere,<br /> anytime.
              </h1>
              <p className="text-slate-600 mb-8 max-w-xs">
                  Join the next generation of learners on Lumina's secure, interactive platform.
              </p>
           </div>
           
           <div className="grid gap-6">
               <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <GraduationCap size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Interactive Classes</span>
               </div>
               <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Shield size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Secure & Verified</span>
               </div>
           </div>
        </div>

        {/* Right Side - Form (Google Style) */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            
            {/* Logo Mobile */}
            <div className="md:hidden flex justify-center mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
            </div>

            {view === 'login' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-normal text-[#1f1f1f] mb-2">Sign in</h2>
                        <p className="text-sm text-slate-500">Use your Lumina Account</p>
                    </div>

                    {/* Google Sign In Button */}
                    <button 
                      onClick={handleGoogleLogin}
                      type="button"
                      className="w-full bg-white border border-slate-300 rounded-full py-2.5 px-4 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm mb-6 relative overflow-hidden group"
                    >
                      <GoogleLogo />
                      <span className="font-medium text-slate-700">Sign in with Google</span>
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                       <div className="h-px bg-slate-200 flex-1"></div>
                       <span className="text-xs text-slate-500 uppercase">Or with email</span>
                       <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <InputField 
                                label="Email" 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <InputField 
                                label="Password" 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-between items-center">
                             <button 
                                type="button"
                                onClick={() => { setView('forgot'); setResetStatus('idle'); setError(''); }} 
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <Button type="submit" className="w-full" isLoading={isLoading}>Sign In</Button>
                        </div>
                    </form>

                    {/* Demo Section */}
                    <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 mb-4">DEMO ACCESS</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => demoLogin('admin')} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200">Admin</button>
                            <button onClick={() => demoLogin('teacher')} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200">Teacher</button>
                            <button onClick={() => demoLogin('student')} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200">Student</button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'forgot' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {resetStatus === 'idle' ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-normal text-[#1f1f1f] mb-2">Account Recovery</h2>
                                <p className="text-sm text-slate-500">Enter your email to continue</p>
                            </div>

                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                 <InputField 
                                    label="Email" 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="flex justify-between items-center pt-4">
                                    <button type="button" onClick={() => setView('login')} className="text-blue-600 font-medium text-sm hover:bg-blue-50 px-3 py-2 rounded-full">Back</button>
                                    <Button type="submit" isLoading={isLoading}>Next</Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-normal text-[#1f1f1f] mb-2">Check your email</h2>
                            <p className="text-slate-500 mb-8 text-sm">
                                We sent a link to <span className="font-medium text-slate-800">{email}</span>
                            </p>
                            <Button variant="secondary" className="w-full" onClick={() => setView('login')}>
                                Back to Sign In
                            </Button>
                        </div>
                    )}
                 </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
