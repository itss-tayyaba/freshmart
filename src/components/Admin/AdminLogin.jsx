import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  Store,
  Truck,
  Sparkles,
  KeyRound,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const { adminLogin, navigateTo, tenants, storeAdmins } = useStore();
  const [selectedRole, setSelectedRole] = useState('superadmin');
  const [selectedMartId, setSelectedMartId] = useState('tenant-alfatah');
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('superadmin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Default credentials drawer to false so the login card fits cleanly on all viewports without overflow
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);
  const [autoFillFeedback, setAutoFillFeedback] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor window scroll to show floating "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const roles = [
    {
      id: 'superadmin',
      label: 'Super Admin',
      icon: '👑',
      sublabel: 'Platform HQ',
      badge: 'Master Control',
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
      badge: 'Store Console',
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
      badge: 'Supply Hub',
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
      badge: 'Delivery Dispatch',
      userPlaceholder: 'rider',
      passPlaceholder: 'rider123',
      defaultUser: 'rider',
      defaultPass: 'rider123'
    }
  ];

  const currentRoleConfig = roles.find((r) => r.id === selectedRole) || roles[0];

  // Dynamic list of all registered marts with distinct names and brand styling
  const availableMarts = React.useMemo(() => {
    if (tenants && tenants.length > 0) {
      return tenants.map((t) => {
        let short = t.displayName || t.brandName || t.name;
        if (t.id === 'tenant-chasevalue') short = 'Chase Value';
        else if (t.id === 'tenant-chaseup') short = 'Chase Up';
        else if (t.id === 'tenant-alfatah') short = 'Al-Fatah';
        else if (t.id === 'tenant-freshmart') short = 'Unimart';
        else if (t.id === 'tenant-localgrocery') short = 'Local Grocery';
        else if (t.id === 'tenant-superstore') short = 'Super Store';
        return {
          id: t.id,
          name: t.name,
          shortName: short,
          logo: t.logo || '🏬',
          color: t.color || '#0e7c66',
          defaultEmail: t.ownerEmail || `admin@${t.slug || t.id.replace('tenant-', '')}.pk`
        };
      });
    }
    return [
      { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket', shortName: 'Al-Fatah', logo: '🏬', color: '#991b1b', defaultEmail: 'admin@alfatah.pk' },
      { id: 'tenant-chasevalue', name: 'Chase Value', shortName: 'Chase Value', logo: '🛒', color: '#b45309', defaultEmail: 'admin@chasevalue.pk' },
      { id: 'tenant-chaseup', name: 'Chase Up', shortName: 'Chase Up', logo: '🏪', color: '#7e22ce', defaultEmail: 'admin@chaseup.pk' },
      { id: 'tenant-freshmart', name: 'Unimart (Market Store)', shortName: 'Unimart', logo: '🛍️', color: '#0284c7', defaultEmail: 'admin@unimart.pk' },
      { id: 'tenant-localgrocery', name: 'Local Grocery', shortName: 'Local Grocery', logo: '🏬', color: '#0f766e', defaultEmail: 'admin@localgrocery.pk' },
      { id: 'tenant-superstore', name: 'Super Store', shortName: 'Super Store', logo: '🏪', color: '#9333ea', defaultEmail: 'admin@superstore.pk' }
    ];
  }, [tenants]);

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setErrorMessage('');

    if (roleItem.id === 'admin') {
      handleSelectMart(selectedMartId);
    } else {
      setUsername(roleItem.defaultUser);
      setPassword(roleItem.defaultPass);
      showFeedback(`Loaded ${roleItem.label} credentials`);
    }
  };

  const handleSelectMart = (martId) => {
    setSelectedMartId(martId);
    setErrorMessage('');
    
    const martAdmin = (storeAdmins || []).find((sa) => sa.tenantId === martId);
    const martConfig = availableMarts.find((m) => m.id === martId);

    if (martAdmin) {
      setUsername(martAdmin.email || martAdmin.username);
      setPassword(martAdmin.password || 'admin123');
      showFeedback(`Loaded ${martAdmin.tenantName || 'Mart'} Admin credentials`);
    } else if (martConfig) {
      setUsername(martConfig.defaultEmail);
      setPassword('admin123');
      showFeedback(`Loaded ${martConfig.shortName} credentials`);
    }
  };

  const showFeedback = (msg) => {
    setAutoFillFeedback(msg);
    setTimeout(() => {
      setAutoFillFeedback('');
    }, 2500);
  };

  const autoFillCredentials = (roleId, user, pass, martId = null, label = '') => {
    setSelectedRole(roleId);
    if (martId) {
      setSelectedMartId(martId);
    }
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
    showFeedback(label ? `Loaded ${label}` : 'Credentials applied');
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

  const currentMart = availableMarts.find((m) => m.id === selectedMartId) || availableMarts[0];

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] flex flex-col justify-between items-center py-6 sm:py-10 px-4 sm:px-6 font-sans antialiased text-slate-800">
      
      {/* Centered Content Wrapper: my-auto cleanly centers when viewport is large; collapses when content overflows so top is never cut off */}
      <div className="w-full max-w-lg mx-auto my-auto flex flex-col items-center">
        
        {/* Top Ledgerly Monogram Brand Header */}
        <div className="mb-5 sm:mb-6 text-center w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              Super Grocery Multi-Tenant Platform
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>Enterprise Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Central authentication for platform Super Admins, dedicated Store Admins, Suppliers & Delivery Fleet
          </p>
        </div>

        {/* Main Login Card */}
        <div className="w-full bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/90 space-y-5">
          
          {/* Role Selector Tabs (Grid of 4) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Select Console Role</span>
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-semibold px-2 py-0.5 rounded-full">
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
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20 scale-[1.01]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl leading-none mb-1">{r.icon}</span>
                    <span className="text-xs leading-tight font-bold">{r.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-none">{r.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🏬 STORE SELECTOR FOR MART ADMINS */}
          {selectedRole === 'admin' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>🏬</span> Select Supermarket (Mart):
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                  Independent Console
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                Each supermarket runs on an isolated tenant console with dedicated store credentials.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                {availableMarts.map((m) => {
                  const isSelected = selectedMartId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMart(m.id)}
                      style={{
                        borderColor: isSelected ? m.color : '#e2e8f0',
                        backgroundColor: isSelected ? `${m.color}12` : '#ffffff',
                        color: isSelected ? m.color : '#334155'
                      }}
                      className={`p-2 sm:p-2.5 rounded-xl text-left border flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                        isSelected ? 'font-bold shadow-xs ring-1 ring-offset-1' : 'hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{m.logo}</span>
                        <span className="text-[11px] truncate font-bold leading-tight">{m.shortName}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: m.color }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 👑 SUPER ADMIN INFO BANNER */}
          {selectedRole === 'superadmin' && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-950 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold shrink-0 text-base">
                👑
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Super Admin Executive Console</div>
                <div className="text-[11px] text-amber-900/80 leading-snug">Full multi-tenant authority to manage marts, store admins, subscriptions & billing.</div>
              </div>
            </div>
          )}

          {/* 📦 SUPPLIER INFO BANNER */}
          {selectedRole === 'supplier' && (
            <div className="p-3 bg-indigo-50/90 border border-indigo-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-950 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-200/70 text-indigo-900 flex items-center justify-center font-bold shrink-0 text-base">
                📦
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Supplier Vendor Portal</div>
                <div className="text-[11px] text-indigo-900/80 leading-snug">Manage product supply batches, restock requests, and wholesale store invoices.</div>
              </div>
            </div>
          )}

          {/* 🛵 RIDER INFO BANNER */}
          {selectedRole === 'rider' && (
            <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-950 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-rose-200/70 text-rose-900 flex items-center justify-center font-bold shrink-0 text-base">
                🛵
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Rider Delivery Dispatch</div>
                <div className="text-[11px] text-rose-900/80 leading-snug">Live delivery fulfillment, customer parcel tracking, and order dispatch operations.</div>
              </div>
            </div>
          )}

          {/* Auto-fill notification chip */}
          {autoFillFeedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11px]">{autoFillFeedback}</span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {selectedRole === 'admin'
                  ? 'Mart Admin Email / Username'
                  : selectedRole === 'superadmin'
                  ? 'Super Admin Username'
                  : selectedRole === 'supplier'
                  ? 'Supplier ID / Username'
                  : 'Rider Phone / ID'}
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
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-medium text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400"
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {selectedRole === 'admin' ? 'Mart Admin Password' : 'Access Password'}
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedRole === 'admin' ? 'Configured by Super Admin' : 'Secure master key'}
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
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 font-medium text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400"
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Console Session...</span>
                </>
              ) : (
                <>
                  <span>
                    Sign In to{' '}
                    {selectedRole === 'admin'
                      ? `${currentMart.shortName} Admin`
                      : currentRoleConfig.label}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Fill Chips */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>⚡ Quick Test Logins:</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => autoFillCredentials('superadmin', 'superadmin', 'superadmin123', null, 'Super Admin')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('admin', 'admin@alfatah.pk', 'admin123', 'tenant-alfatah', 'Al-Fatah Admin')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🏬 Al-Fatah
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('admin', 'admin@chasevalue.pk', 'admin123', 'tenant-chasevalue', 'Chase Value')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🛒 Chase Value
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('supplier', 'tayyab', 'cocacola123', null, 'Supplier Partner')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                📦 Supplier
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('rider', 'rider', 'rider123', null, 'Rider Fleet')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🛵 Rider
              </button>
            </div>
          </div>

          {/* Expandable Demo Credentials Assistant */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 text-xs">
            <button
              type="button"
              onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>All Registered Mart Admins Directory (1-Click Fill)</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-normal">
                  {showCredentialsHelp ? 'Hide' : 'Show All'}
                </span>
                {showCredentialsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showCredentialsHelp && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2 text-[11px] animate-in fade-in duration-200">
                {/* Super Admin */}
                <div
                  onClick={() => autoFillCredentials('superadmin', 'superadmin', 'superadmin123', null, 'Super Admin')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedRole === 'superadmin' ? 'bg-amber-50 border-amber-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">👑 Super Admin (Platform Owner)</span>
                    {selectedRole === 'superadmin' && <span className="text-[10px] text-amber-700 font-bold">Selected</span>}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">superadmin / superadmin123</div>
                </div>

                {/* Grid of Mart Admins */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(storeAdmins || []).map((sa) => (
                    <div
                      key={sa.id}
                      onClick={() => autoFillCredentials('admin', sa.email, sa.password, sa.tenantId, sa.tenantName)}
                      className={`p-2 rounded-xl border cursor-pointer transition ${
                        selectedRole === 'admin' && username === sa.email
                          ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{sa.tenantName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sa.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {sa.status}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 truncate mt-0.5">{sa.email}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Password: <span className="font-mono font-bold text-slate-700">{sa.password}</span></div>
                    </div>
                  ))}
                </div>

                {/* Supplier & Rider Partner Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div
                    onClick={() => autoFillCredentials('supplier', 'tayyab', 'cocacola123', null, 'Supplier Partner')}
                    className={`p-2 rounded-xl border cursor-pointer transition ${
                      selectedRole === 'supplier'
                        ? 'bg-indigo-50 border-indigo-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">📦 Supplier Partner</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">Verified</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-600 mt-0.5">tayyab / cocacola123</div>
                  </div>

                  <div
                    onClick={() => autoFillCredentials('rider', 'rider', 'rider123', null, 'Delivery Rider')}
                    className={`p-2 rounded-xl border cursor-pointer transition ${
                      selectedRole === 'rider'
                        ? 'bg-rose-50 border-rose-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">🛵 Rider Fleet</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Active</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-600 mt-0.5">rider / rider123</div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="pt-2 text-center border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
            </button>
            <span className="text-[11px] text-slate-400">v2.5 Multi-Tenant Engine</span>
          </div>

        </div>

      </div>

      {/* Trust & Compliance Subtext */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-md mx-auto space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-medium text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted TLS 1.3 &bull; Enterprise Tenant Isolation</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Pakistan Supermarkets Network &bull; Platform Multi-Tenant Security
        </p>
      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-lg rounded-full p-2.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold hover:scale-105 active:scale-95"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline text-[11px]">Top</span>
        </button>
      )}

    </div>
  );
};
