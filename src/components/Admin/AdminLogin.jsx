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
  CheckCircle2,
  Package,
  Bike,
  Shield,
  Truck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo } = useStore();
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'supplier' | 'rider'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: 'admin',
      label: 'Admin',
      icon: '🛡️',
      sublabel: 'Store Manager',
      defaultUser: 'admin',
      defaultPass: 'admin123'
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: '📦',
      sublabel: 'Vendor Portal',
      defaultUser: 'supplier',
      defaultPass: 'supplier123'
    },
    {
      id: 'rider',
      label: 'Rider',
      icon: '🛵',
      sublabel: 'Delivery Fleet',
      defaultUser: 'rider',
      defaultPass: 'rider123'
    }
  ];

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setUsername(roleItem.defaultUser);
    setPassword(roleItem.defaultPass);
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = adminLogin(username, password, selectedRole);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your login details.');
      }
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07241d] via-[#0b3b2f] to-[#0f172a] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Subtle Emerald Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-lime-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card with FreshMart Website Styling */}
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative z-10 border border-emerald-100 animate-in zoom-in-95 duration-300">
        
        {/* Brand Header matching FreshMart Website */}
        <div className="space-y-1.5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-600/30">
            🛒
          </div>
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>FreshMart</span>
              <span className="text-emerald-600 font-serif">Staff</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select your role to access store management, inventory, or delivery fleet.
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form with FreshMart Emerald Theme */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* "Login as" 3 Role Cards Grid */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block text-xs">
              Login as
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-900 shadow-xs font-bold'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl leading-none">{r.icon}</span>
                    <span className="text-xs font-black leading-tight mt-0.5">{r.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none hidden sm:block">{r.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, supplier, rider"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Primary Button with FreshMart Green */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In as {selectedRole === 'admin' ? 'Admin' : selectedRole === 'supplier' ? 'Supplier' : 'Rider'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Back Link to Storefront */}
        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            ← Back to FreshMart Website
          </button>
        </div>

      </div>

    </div>
  );
};
