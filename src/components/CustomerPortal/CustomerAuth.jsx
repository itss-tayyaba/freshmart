import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
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

  // Login form
  const [loginEmail, setLoginEmail] = useState('aimen.yasin@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form
  const [regForm, setRegForm] = useState({
    name: 'Aimen Yasin',
    email: '',
    phone: '+92 300 1234567',
    city: 'Lahore, Pakistan',
    address: '123, Block A, Gulberg 3, Lahore',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setIsLoading(true);
    const success = await loginCustomer(loginEmail, loginPassword);
    setIsLoading(false);
    if (success && onAuthSuccess) onAuthSuccess();
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.password) return;
    setIsLoading(true);
    const success = await registerCustomer(regForm);
    setIsLoading(false);
    if (success && onAuthSuccess) onAuthSuccess();
  };


  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-in fade-in duration-300">
      
      {/* Back to store button */}
      <button
        onClick={() => navigateTo('home')}
        className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Storefront</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">

        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20 text-2xl">
            🛒
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {authMode === 'login'
              ? 'Access your orders, saved addresses, wallet & rewards'
              : 'Join FreshMart for 10-minute grocery deliveries and discounts'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Email / Phone</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="name@email.com or 0300-XXXXXXX"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setLoginPassword('password123')}
                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Customer Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Create one for free
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Aimen Yasin"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="aimen.yasin@gmail.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 font-medium"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <select
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
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
              <label className="font-bold text-slate-700 block mb-1">Street Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="123, Block A, Gulberg 3, Lahore"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-slate-500">Already registered? </span>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
