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
  ChevronUp,
  CheckCircle2,
  Building2,
  Store,
  Truck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo } = useStore();
  const [selectedRole, setSelectedRole] = useState('superadmin'); // Default to Super Admin as requested
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('superadmin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(true);

  const roles = [
    {
      id: 'superadmin',
      label: 'Super Admin',
      icon: '👑',
      sublabel: 'Platform HQ',
      userPlaceholder: 'superadmin',
      passPlaceholder: 'superadmin123',
      defaultUser: 'superadmin',
      defaultPass: 'superadmin123'
    },
    {
      id: 'admin',
      label: 'Store Admin',
      icon: '🛡️',
      sublabel: 'Al-Fatah / Chase',
      userPlaceholder: 'admin@alfatah.pk',
      passPlaceholder: 'admin123',
      defaultUser: 'admin@alfatah.pk',
      defaultPass: 'admin123'
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: '📦',
      sublabel: 'Vendor Portal',
      userPlaceholder: 'tayyab',
      passPlaceholder: 'cocacola123',
      defaultUser: 'tayyab',
      defaultPass: 'cocacola123'
    },
    {
      id: 'rider',
      label: 'Rider Fleet',
      icon: '🛵',
      sublabel: 'Fulfillment',
      userPlaceholder: 'rider',
      passPlaceholder: 'rider123',
      defaultUser: 'rider',
      defaultPass: 'rider123'
    }
  ];

  const currentRoleConfig = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setUsername(roleItem.defaultUser);
    setPassword(roleItem.defaultPass);
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
    <div className="min-h-screen bg-[#f5f6f9] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-[#12172b]">
      
      {/* Top Ledgerly Monogram Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#e6e8ef] shadow-2xs mb-3">
          <div className="w-2 h-2 rounded-full bg-[#0e7c66] animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider text-[#4d536e] uppercase">
            Super Grocery Multi-Tenant Platform
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12172b] flex items-center justify-center gap-2 font-serif">
          <span>Enterprise Portal</span>
        </h1>
        <p className="text-xs text-[#6e7489] mt-1">
          Secure central authentication for platform owners, supermarket store admins, and staff
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-lg w-full bg-white rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(16,24,40,0.06)] border border-[#e6e8ef] space-y-6">
        
        {/* Role Selector Tabs (Grid of 4) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6e7489] uppercase tracking-wider">
              Select Console Role
            </span>
            <span className="text-[11px] text-[#0e7c66] font-medium">
              Active: {currentRoleConfig.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`p-2.5 rounded-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#dff3ee] border-[#0e7c66] text-[#0a5d4c] font-semibold shadow-2xs'
                      : 'bg-[#fafbfc] border-[#e6e8ef] text-[#4d536e] hover:bg-white hover:border-[#d6d9e3]'
                  }`}
                >
                  <span className="text-lg leading-none mb-1">{r.icon}</span>
                  <span className="text-xs leading-tight font-medium">{r.label}</span>
                  <span className="text-[10px] text-[#9297a8] mt-0.5 leading-none">{r.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-[#fce8e6] border border-[#f5c2bd] text-[#dc4c3f] p-3 rounded-lg text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#dc4c3f]" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-[#12172b] mb-1.5">
              Username / Account ID
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
                className="w-full bg-white border border-[#e6e8ef] rounded-lg pl-9 pr-3.5 py-2.5 font-medium text-xs text-[#12172b] focus:border-[#0e7c66] focus:ring-1 focus:ring-[#0e7c66] focus:outline-none transition-all placeholder:text-[#9297a8]"
                autoComplete="username"
              />
              <User className="w-4 h-4 text-[#9297a8] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#12172b]">
                Access Password
              </label>
            </div>
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
                className="w-full bg-white border border-[#e6e8ef] rounded-lg pl-9 pr-9 py-2.5 font-medium text-xs text-[#12172b] focus:border-[#0e7c66] focus:ring-1 focus:ring-[#0e7c66] focus:outline-none transition-all placeholder:text-[#9297a8]"
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-[#9297a8] absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9297a8] hover:text-[#12172b] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#0e7c66] hover:bg-[#0a5d4c] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating Console Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to {currentRoleConfig.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="rounded-lg border border-[#e6e8ef] bg-[#fafbfc] p-3 text-xs">
          <button
            type="button"
            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#4d536e] hover:text-[#12172b] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0e7c66]" />
              <span>Quick Login Accounts (1-Click Fill)</span>
            </span>
            {showCredentialsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCredentialsHelp && (
            <div className="mt-2.5 pt-2.5 border-t border-[#e6e8ef] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div
                onClick={() => {
                  setSelectedRole('superadmin');
                  setUsername('superadmin');
                  setPassword('superadmin123');
                }}
                className={`p-2 rounded-md border cursor-pointer transition ${
                  selectedRole === 'superadmin' ? 'bg-[#dff3ee] border-[#0e7c66]' : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#12172b]">👑 Super Admin</span>
                  {selectedRole === 'superadmin' && <span className="text-[10px] text-[#0e7c66] font-bold">Selected</span>}
                </div>
                <div className="font-mono text-[10px] text-[#6e7489] mt-0.5">superadmin / superadmin123</div>
              </div>

              <div
                onClick={() => {
                  setSelectedRole('admin');
                  setUsername('admin@alfatah.pk');
                  setPassword('admin123');
                }}
                className={`p-2 rounded-md border cursor-pointer transition ${
                  selectedRole === 'admin' ? 'bg-[#dff3ee] border-[#0e7c66]' : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#12172b]">🛡️ Store Admin</span>
                  {selectedRole === 'admin' && <span className="text-[10px] text-[#0e7c66] font-bold">Selected</span>}
                </div>
                <div className="font-mono text-[10px] text-[#6e7489] mt-0.5">admin@alfatah.pk / admin123</div>
              </div>

              <div
                onClick={() => {
                  setSelectedRole('supplier');
                  setUsername('tayyab');
                  setPassword('cocacola123');
                }}
                className={`p-2 rounded-md border cursor-pointer transition ${
                  selectedRole === 'supplier' ? 'bg-[#dff3ee] border-[#0e7c66]' : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#12172b]">📦 Supplier Portal</span>
                  {selectedRole === 'supplier' && <span className="text-[10px] text-[#0e7c66] font-bold">Selected</span>}
                </div>
                <div className="font-mono text-[10px] text-[#6e7489] mt-0.5">tayyab / cocacola123</div>
              </div>

              <div
                onClick={() => {
                  setSelectedRole('rider');
                  setUsername('rider');
                  setPassword('rider123');
                }}
                className={`p-2 rounded-md border cursor-pointer transition ${
                  selectedRole === 'rider' ? 'bg-[#dff3ee] border-[#0e7c66]' : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#12172b]">🛵 Rider Fleet</span>
                  {selectedRole === 'rider' && <span className="text-[10px] text-[#0e7c66] font-bold">Selected</span>}
                </div>
                <div className="font-mono text-[10px] text-[#6e7489] mt-0.5">rider / rider123</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pt-2 text-center border-t border-[#e6e8ef] flex items-center justify-between text-xs text-[#6e7489]">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="hover:text-[#12172b] font-medium transition-colors cursor-pointer"
          >
            ← Return to Customer Storefront
          </button>
          <span className="text-[11px] text-[#9297a8]">v2.4 Multi-Tenant Engine</span>
        </div>

      </div>

      {/* Trust & Compliance Subtext */}
      <div className="mt-6 text-center text-[11px] text-[#9297a8]">
        Encrypted TLS 1.3 Enterprise Session &bull; ISO 27001 Multi-Tenant Tenant Isolation &bull; Pakistan Supermarkets Network
      </div>

    </div>
  );
};
