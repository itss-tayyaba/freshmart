import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo } = useStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = adminLogin(username, password);
      if (!result.success) {
        setErrorMessage('Invalid username or password. Please verify credentials.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to store link */}
      <button
        onClick={() => navigateTo('home')}
        className="absolute top-6 left-6 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-800 transition-colors cursor-pointer z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Storefront</span>
      </button>

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 text-slate-100 animate-in zoom-in-95 duration-300 z-10">
        
        {/* Header with Admin Shield */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 text-3xl font-black">
            🛡️
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Restricted Area
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin Suite Login
            </h1>
            <p className="text-xs text-slate-400">
              Enter authorized administrator credentials to manage products, categories, orders & discounts.
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Admin Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or admin@freshmart.pk"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-white text-xs focus:outline-none focus:border-emerald-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-white text-xs focus:outline-none focus:border-emerald-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Hint */}
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium block">Default Credentials:</span>
              <span className="font-mono text-emerald-400 font-bold">admin / admin123</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-700"
            >
              Autofill
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Sign In to Admin Suite</span>
              </>
            )}
          </button>

        </form>

        {/* Security Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit Encrypted Session • Authorized Admin Access Only</span>
        </div>

      </div>

    </div>
  );
};
