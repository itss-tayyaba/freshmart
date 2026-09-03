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
  Star,
  Layers,
  Boxes
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo } = useStore();
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'supplier' | 'rider' | 'superadmin'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: 'admin',
      label: 'Admin',
      icon: '◆',
      defaultUser: 'admin',
      defaultPass: 'admin123'
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: '📦',
      defaultUser: 'supplier',
      defaultPass: 'supplier123'
    },
    {
      id: 'rider',
      label: 'Delivery',
      icon: '🛵',
      defaultUser: 'rider',
      defaultPass: 'rider123'
    },
    {
      id: 'superadmin',
      label: 'Super Admin',
      icon: '★',
      defaultUser: 'superadmin',
      defaultPass: 'admin123'
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
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#1c1917] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-[#a36829]/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Login Card matching screenshot 2 */}
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative z-10 border border-[#e8ded1] animate-in zoom-in-95 duration-300">
        
        {/* Header matching screenshot 2 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#a36829] inline-block shadow-xs" />
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>FreshMart</span>
              <span className="text-[#a36829] text-xl font-sans font-bold">&</span>
              <span>Grocery</span>
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sign in to manage orders, inventory, riders & store operations.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form matching screenshot 2 */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* "Login as" 2x2 Role Grid */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 block text-xs">
              Login as
            </label>
            
            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#fbf8f3] border-2 border-[#a36829] text-[#8c5720] shadow-xs'
                        : 'bg-[#f6f2ec] border border-[#e8ded1] text-slate-700 hover:bg-[#ede6dc]'
                    }`}
                  >
                    <span className="text-base leading-none">{r.icon}</span>
                    <span className="text-xs font-bold leading-none">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 text-xs">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, supplier, rider"
              className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-3 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 text-xs">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-2xl px-4 py-3 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a36829] text-xs pr-10"
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

          {/* Sign In Primary Button matching screenshot 2 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#a36829] hover:bg-[#8c5720] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <span>Sign in</span>
            )}
          </button>

        </form>

        {/* Security & Back Link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-xs font-semibold text-slate-500 hover:text-[#a36829] transition-colors cursor-pointer"
          >
            ← Back to Restaurant Website
          </button>
        </div>

      </div>

    </div>
  );
};
