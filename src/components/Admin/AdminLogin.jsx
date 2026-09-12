import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo } = useStore();
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'supplier' | 'rider'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  const roles = [
    {
      id: 'admin',
      label: 'Admin',
      icon: '🛡️',
      sublabel: 'Store Manager',
      userPlaceholder: 'admin@freshmart.com or admin',
      passPlaceholder: 'Enter admin password'
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: '📦',
      sublabel: 'Vendor Portal',
      userPlaceholder: 'tayyab or vendor email',
      passPlaceholder: 'Enter vendor password'
    },
    {
      id: 'rider',
      label: 'Rider',
      icon: '🛵',
      sublabel: 'Delivery Fleet',
      userPlaceholder: 'rider or phone (0301-1234567)',
      passPlaceholder: 'Enter rider password'
    }
  ];

  const currentRoleConfig = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setUsername('');
    setPassword('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminLogin(cleanUser, cleanPass, selectedRole);
      if (!result || !result.success) {
        setErrorMessage(result?.error || 'Invalid credentials. Please verify your login details.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
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
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={currentRoleConfig.userPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-colors"
                autoComplete="username"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={currentRoleConfig.passPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-colors"
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Primary Button with FreshMart Green */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as {selectedRole === 'admin' ? 'Admin' : selectedRole === 'supplier' ? 'Supplier' : 'Rider'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Authorized Accounts Helper Accordion */}
        <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-3 text-xs">
          <button
            type="button"
            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Registered Staff Accounts</span>
            </span>
            {showCredentialsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCredentialsHelp && (
            <div className="mt-2.5 pt-2 border-t border-emerald-200/50 space-y-1.5 text-[11px] text-slate-600 animate-in fade-in">
              <div className="flex justify-between items-center py-0.5">
                <span className="font-semibold text-slate-800">🛡️ Super Admin:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-mono text-[10px]">admin@freshmart.com / adminpassword123</code>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-semibold text-slate-800">📦 Supplier (Tayyab):</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-mono text-[10px]">tayyab / cocacola123</code>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-semibold text-slate-800">🛵 Fleet Rider:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-mono text-[10px]">rider / rider123</code>
              </div>
            </div>
          )}
        </div>

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
