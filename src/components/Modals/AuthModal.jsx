import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, user, setUser, addToast } = useStore();
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState(user.email || 'alex.morgan@example.com');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Alex Morgan');

  if (!isAuthOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser({
      name: name || 'Alex Morgan',
      email: email || 'alex.morgan@example.com',
      isLoggedIn: true
    });
    setIsAuthOpen(false);
    addToast('Welcome to Grocery Shop! 👋', `Logged in as ${name || 'Alex Morgan'}`);
  };

  const handleLogout = () => {
    setUser({
      name: '',
      email: '',
      isLoggedIn: false
    });
    setIsAuthOpen(false);
    addToast('Logged Out', 'You have been signed out.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAuthOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-brand-green text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center">
              <User className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {user.isLoggedIn ? 'Your Account Profile' : tab === 'login' ? 'Customer Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-emerald-200">
                {user.isLoggedIn ? 'Manage orders & delivery addresses' : 'Access orders, wishlist & member discounts'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {user.isLoggedIn ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-green font-black text-xl flex items-center justify-center mx-auto mb-2">
                  {user.name.charAt(0)}
                </div>
                <h3 className="text-base font-bold text-slate-800">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Prime Member</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setIsAuthOpen(false)}
                  className="w-full py-2.5 px-4 bg-brand-green text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Tabs */}
              <div className="flex border-b border-slate-100 mb-6">
                <button
                  onClick={() => setTab('login')}
                  className={`flex-1 pb-3 text-xs font-bold transition-colors border-b-2 ${
                    tab === 'login'
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setTab('register')}
                  className={`flex-1 pb-3 text-xs font-bold transition-colors border-b-2 ${
                    tab === 'register'
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Register Free
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        required
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{tab === 'login' ? 'Sign In Instantly' : 'Create Free Account'}</span>
                </button>

                {/* 1-Click Demo Login Helper */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUser({ name: 'Alex Morgan', email: 'alex.morgan@example.com', isLoggedIn: true });
                      setIsAuthOpen(false);
                      addToast('Logged In as Demo User! 🎉', 'Welcome Alex Morgan!');
                    }}
                    className="text-xs text-brand-green hover:underline font-semibold"
                  >
                    Quick Demo 1-Click Login →
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
