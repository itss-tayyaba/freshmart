import React, { useState, useEffect } from 'react';
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
  Truck,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo, tenants, storeAdmins, currentTenant, setCurrentTenant } = useStore();
  const [selectedRole, setSelectedRole] = useState('superadmin'); // Default to Super Admin as requested
  const [selectedMartId, setSelectedMartId] = useState('tenant-alfatah');
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
      sublabel: 'Mart Admin',
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

  // Helper list of all marts available
  const availableMarts = [
    { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket', logo: '🏬', color: '#991b1b', defaultEmail: 'admin@alfatah.pk' },
    { id: 'tenant-chasevalue', name: 'Chase Value', logo: '🛒', color: '#78350f', defaultEmail: 'admin@chasevalue.pk' },
    { id: 'tenant-chaseup', name: 'Chase Up', logo: '🏪', color: '#6b21a8', defaultEmail: 'admin@chaseup.pk' },
    { id: 'tenant-freshmart', name: 'Unimart (Market Store)', logo: '🛒', color: '#0284c7', defaultEmail: 'admin@unimart.pk' },
    { id: 'tenant-localgrocery', name: 'Local Grocery', logo: '🏬', color: '#78350f', defaultEmail: 'admin@localgrocery.pk' },
    { id: 'tenant-superstore', name: 'Super Store', logo: '🏪', color: '#9333ea', defaultEmail: 'admin@superstore.pk' }
  ];

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setErrorMessage('');

    if (roleItem.id === 'admin') {
      // Find admin for current selected mart
      handleSelectMart(selectedMartId);
    } else {
      setUsername(roleItem.defaultUser);
      setPassword(roleItem.defaultPass);
    }
  };

  const handleSelectMart = (martId) => {
    setSelectedMartId(martId);
    setErrorMessage('');
    
    // Look up assigned store admin in state/context
    const martAdmin = (storeAdmins || []).find((sa) => sa.tenantId === martId);
    const martConfig = availableMarts.find((m) => m.id === martId);

    if (martAdmin) {
      setUsername(martAdmin.email || martAdmin.username);
      setPassword(martAdmin.password || 'admin123');
    } else if (martConfig) {
      setUsername(martConfig.defaultEmail);
      setPassword('admin123');
    }
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
        <p className="text-xs text-[#6e7489] mt-1 max-w-md mx-auto">
          Central authentication for platform Super Admins and dedicated Supermarket Store Admins
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-lg w-full bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(16,24,40,0.06)] border border-[#e6e8ef] space-y-6">
        
        {/* Role Selector Tabs (Grid of 4) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#6e7489] uppercase tracking-wider">
              Select Console Role
            </span>
            <span className="text-[11px] text-[#0e7c66] font-semibold">
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
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#dff3ee] border-[#0e7c66] text-[#0a5d4c] font-bold shadow-2xs scale-[1.02]'
                      : 'bg-[#fafbfc] border-[#e6e8ef] text-[#4d536e] hover:bg-white hover:border-[#d6d9e3]'
                  }`}
                >
                  <span className="text-xl leading-none mb-1">{r.icon}</span>
                  <span className="text-xs leading-tight font-bold">{r.label}</span>
                  <span className="text-[10px] text-[#9297a8] mt-0.5 leading-none">{r.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🏬 STORE SELECTOR FOR MART ADMINS */}
        {selectedRole === 'admin' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <span>🏬</span> Select Supermarket (Mart):
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                Independent Console
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Each mart has its own store admin assigned with a custom password set by the Super Admin.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {availableMarts.map((m) => {
                const isSelected = selectedMartId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMart(m.id)}
                    style={{
                      borderColor: isSelected ? m.color : '#e2e8f0',
                      backgroundColor: isSelected ? `${m.color}10` : '#ffffff',
                      color: isSelected ? m.color : '#334155'
                    }}
                    className={`p-2 rounded-lg text-left border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected ? 'font-black shadow-2xs ring-1 ring-offset-1' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm shrink-0">{m.logo}</span>
                    <span className="text-[11px] truncate font-bold leading-tight">{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 👑 SUPER ADMIN INFO BANNER */}
        {selectedRole === 'superadmin' && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center font-bold shrink-0">
              👑
            </div>
            <div>
              <div className="font-bold">Super Admin Executive Console</div>
              <div className="text-[11px] text-amber-800/80">Full multi-tenant control to manage all marts, set passwords, plans, and suspended stores.</div>
            </div>
          </div>
        )}

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
            <label className="block text-xs font-bold text-[#12172b] mb-1.5">
              {selectedRole === 'admin' ? 'Mart Admin Email / Username' : 'Username / Account ID'}
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
                className="w-full bg-white border border-[#e6e8ef] rounded-xl pl-9 pr-3.5 py-2.5 font-medium text-xs text-[#12172b] focus:border-[#0e7c66] focus:ring-1 focus:ring-[#0e7c66] focus:outline-none transition-all placeholder:text-[#9297a8]"
                autoComplete="username"
              />
              <User className="w-4 h-4 text-[#9297a8] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#12172b]">
                {selectedRole === 'admin' ? 'Mart Admin Password' : 'Access Password'}
              </label>
              <span className="text-[10px] text-[#6e7489]">
                {selectedRole === 'admin' ? 'Assigned by Super Admin' : 'Secure master key'}
              </span>
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
                className="w-full bg-white border border-[#e6e8ef] rounded-xl pl-9 pr-9 py-2.5 font-medium text-xs text-[#12172b] focus:border-[#0e7c66] focus:ring-1 focus:ring-[#0e7c66] focus:outline-none transition-all placeholder:text-[#9297a8]"
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
            className="w-full py-3 px-4 bg-[#0e7c66] hover:bg-[#0a5d4c] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating Console Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to {selectedRole === 'admin' ? `${availableMarts.find((m) => m.id === selectedMartId)?.name || 'Store'} Admin` : currentRoleConfig.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-3 text-xs">
          <button
            type="button"
            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-[#4d536e] hover:text-[#12172b] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#0e7c66]" />
              <span>Registered Mart Admins & Master Credentials (1-Click Fill)</span>
            </span>
            {showCredentialsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCredentialsHelp && (
            <div className="mt-2.5 pt-2.5 border-t border-[#e6e8ef] space-y-2 text-[11px]">
              {/* Super Admin */}
              <div
                onClick={() => {
                  setSelectedRole('superadmin');
                  setUsername('superadmin');
                  setPassword('superadmin123');
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  selectedRole === 'superadmin' ? 'bg-[#dff3ee] border-[#0e7c66]' : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#12172b]">👑 Super Admin (Platform Owner)</span>
                  {selectedRole === 'superadmin' && <span className="text-[10px] text-[#0e7c66] font-bold">Selected</span>}
                </div>
                <div className="font-mono text-[10px] text-[#6e7489] mt-0.5">superadmin / superadmin123</div>
              </div>

              {/* Grid of Mart Admins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(storeAdmins || []).map((sa) => (
                  <div
                    key={sa.id}
                    onClick={() => {
                      setSelectedRole('admin');
                      setSelectedMartId(sa.tenantId);
                      setUsername(sa.email);
                      setPassword(sa.password);
                    }}
                    className={`p-2 rounded-lg border cursor-pointer transition ${
                      selectedRole === 'admin' && username === sa.email
                        ? 'bg-[#dff3ee] border-[#0e7c66]'
                        : 'bg-white border-[#e6e8ef] hover:border-[#d6d9e3]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#12172b] truncate max-w-[130px]">{sa.tenantName}</span>
                      <span className={`text-[9px] font-bold px-1.5 rounded ${sa.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {sa.status}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-600 truncate mt-0.5">{sa.email}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Password: <span className="font-mono font-bold text-slate-700">{sa.password}</span></div>
                  </div>
                ))}
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
