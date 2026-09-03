import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CustomerAuth = ({ initialMode = 'login', onAuthSuccess }) => {
  const { loginCustomer, registerCustomer, navigateTo } = useStore();
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('aimenyasin320@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form
  const [regForm, setRegForm] = useState({
    name: 'Aimen Yasin',
    email: 'aimenyasin320@gmail.com',
    phone: '03206551699',
    city: 'Lahore, Pakistan',
    address: '123, Block A, Gulberg 3, Lahore',
    password: 'password123'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setIsLoading(true);
    const success = await loginCustomer(loginEmail, loginPassword);
    setIsLoading(false);
    if (success) {
      if (onAuthSuccess) onAuthSuccess();
      navigateTo('customer-portal');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.password) return;
    setIsLoading(true);
    const success = await registerCustomer(regForm);
    setIsLoading(false);
    if (success) {
      if (onAuthSuccess) onAuthSuccess();
      navigateTo('customer-portal');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-in fade-in duration-300 font-sans">
      
      {/* Card matching screenshot 1 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ded1] shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#faf6f0] border border-[#e8ded1] flex items-center justify-center text-xl shadow-2xs">
              🛒
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>FreshMart</span>
              <span className="text-[#a36829] text-xl font-sans font-bold">&</span>
              <span>Grocery</span>
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sign in to track orders, view delivery OTP codes, reserve deals, and manage complaints.
          </p>
        </div>

        {/* Side-by-Side Tabs matching screenshot 1 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
              authMode === 'login'
                ? 'bg-[#fbf8f3] border-2 border-[#a36829] text-[#8c5720] shadow-xs'
                : 'bg-[#f6f2ec] border border-[#e8ded1] text-slate-700 hover:bg-[#ede6dc]'
            }`}
          >
            Sign In
          </button>
          
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
              authMode === 'register'
                ? 'bg-[#fbf8f3] border-2 border-[#a36829] text-[#8c5720] shadow-xs'
                : 'bg-[#f6f2ec] border border-[#e8ded1] text-slate-700 hover:bg-[#ede6dc]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1.5 text-xs">
                Email or Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. aimenyasin320@gmail.com or 03206551699"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1.5 text-xs">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button matching screenshot 1 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#a36829] hover:bg-[#8c5720] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>
        ) : (
          /* Create Account Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1 text-xs">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aimen Yasin"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1 text-xs">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="aimenyasin320@gmail.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-800 block mb-1 text-xs">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="03206551699"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-3 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1 text-xs">
                  City
                </label>
                <select
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-3 py-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs cursor-pointer"
                >
                  <option>Lahore, Pakistan</option>
                  <option>Karachi, Pakistan</option>
                  <option>Islamabad, Pakistan</option>
                  <option>Rawalpindi, Pakistan</option>
                  <option>Faisalabad, Pakistan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1 text-xs">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
              />
            </div>

            {/* Create Account Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#a36829] hover:bg-[#8c5720] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Back Link matching screenshot 1 */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (onAuthSuccess) onAuthSuccess();
              navigateTo('home');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-[#a36829] transition-colors cursor-pointer"
          >
            ← Back to FreshMart Website
          </button>
        </div>

      </div>
    </div>
  );
};
