import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { db } from '../services/db';
import { ArrowRight, Shield, GraduationCap, AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button, InputField } from '../components/Common';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetStatus, setResetStatus] = useState<'idle' | 'success'>('idle');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      const user = db.users.find(email);
      if (user && (user.password === password || (!user.password && password === 'password123'))) {
          onLogin(user);
      } else {
          setError('Invalid email or password.');
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
        
        {/* Left Side - Info (Simplified) */}
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

                        <div className="flex flex-col gap-3 mt-8">
                            <Button type="submit" className="w-full" isLoading={isLoading}>Sign In</Button>
                            <button type="button" className="w-full py-2.5 text-blue-600 font-medium text-sm rounded-full hover:bg-blue-50 transition-colors">
                                Create account
                            </button>
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