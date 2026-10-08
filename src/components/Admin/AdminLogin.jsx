import React, { useState, useRef, useMemo } from 'react';
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
  Truck,
  Check,
  Boxes
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLogin = () => {
  const {
    adminLogin,
    navigateTo,
    tenants,
    storeAdmins,
    pickupStaff = [],
    riders = [],
    currentTenant
  } = useStore();

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
  const loginScrollRef = useRef(null);

  const scrollToTop = () => {
    loginScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic list of all registered marts with distinct names and brand styling
  const availableMarts = useMemo(() => {
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
          color: t.color || '#991b1b',
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

  const currentMart = useMemo(() => {
    return availableMarts.find((m) => m.id === selectedMartId) || availableMarts[0];
  }, [availableMarts, selectedMartId]);

  // Primary website brand color (matches Al-Fatah Ruby Crimson #991b1b, Chase Value, etc.)
  const websiteBrandColor = useMemo(() => {
    return currentTenant?.color || currentMart?.color || '#991b1b';
  }, [currentTenant, currentMart]);

  // Dynamic theme color tailored to active console role
  const themeColor = useMemo(() => {
    if (selectedRole === 'admin') {
      return currentMart?.color || websiteBrandColor;
    }
    if (selectedRole === 'rider') {
      return '#ea580c'; // High-visibility courier amber/orange
    }
    if (selectedRole === 'superadmin') {
      return '#b45309'; // Executive platform gold/amber
    }
    // pickup_staff
    return websiteBrandColor;
  }, [selectedRole, currentMart, websiteBrandColor]);

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
      id: 'rider',
      label: 'Rider',
      icon: '🛵',
      sublabel: 'Delivery Fleet',
      badge: 'Live Courier',
      userPlaceholder: 'rider phone or username (e.g. ahmad or 03001234567)',
      passPlaceholder: 'rider password (e.g. rider123)',
      defaultUser: riders && riders.length > 0 ? (riders[0].phone || riders[0].username || riders[0].name) : 'ahmad',
      defaultPass: riders && riders.length > 0 ? (riders[0].password || 'rider123') : 'rider123'
    },
    {
      id: 'pickup_staff',
      label: 'Pickup Staff',
      icon: '📦',
      sublabel: 'Packing Desk',
      badge: 'Order Packing',
      userPlaceholder: 'staff username or phone',
      passPlaceholder: 'staff password',
      defaultUser: pickupStaff && pickupStaff.length > 0 ? (pickupStaff[0].username || '') : '',
      defaultPass: pickupStaff && pickupStaff.length > 0 ? (pickupStaff[0].password || '') : ''
    }
  ];

  const currentRoleConfig = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleSelectMart = (martId, role = selectedRole) => {
    setSelectedMartId(martId);
    setErrorMessage('');
    
    const martConfig = availableMarts.find((m) => m.id === martId);

    if (role === 'admin') {
      const martAdmin = (storeAdmins || []).find((sa) => sa.tenantId === martId);
      if (martAdmin) {
        setUsername(martAdmin.email || martAdmin.username);
        setPassword(martAdmin.password || 'admin123');
        showFeedback(`Loaded ${martAdmin.tenantName || 'Mart'} Admin credentials`);
      } else if (martConfig) {
        setUsername(martConfig.defaultEmail);
        setPassword('admin123');
        showFeedback(`Loaded ${martConfig.shortName} Admin credentials`);
      }
    } else if (role === 'rider') {
      const martRider = (riders || []).find(
        (r) => r.tenantId === martId || (r.username && r.username.includes(martId.replace('tenant-', '')))
      );
      if (martRider) {
        setUsername(martRider.username || martRider.phone || martRider.name);
        setPassword(martRider.password || 'rider123');
        showFeedback(`Loaded ${martRider.name} credentials`);
      } else {
        const slug = martId.replace('tenant-', '');
        setUsername(`${slug}_rider`);
        setPassword('rider123');
        showFeedback(`Loaded ${martConfig?.shortName || 'Store'} Rider credentials`);
      }
    } else if (role === 'pickup_staff') {
      const martStaff = (pickupStaff || []).find(
        (p) => p.tenantId === martId || (p.username && p.username.includes(martId.replace('tenant-', '')))
      );
      if (martStaff) {
        setUsername(martStaff.username);
        setPassword(martStaff.password || 'staff123');
        showFeedback(`Loaded ${martStaff.name} credentials`);
      } else {
        const slug = martId.replace('tenant-', '');
        setUsername(`${slug}_staff`);
        setPassword('staff123');
        showFeedback(`Loaded ${martConfig?.shortName || 'Store'} Staff credentials`);
      }
    }
  };

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.id);
    setErrorMessage('');

    if (roleItem.id === 'superadmin') {
      setUsername(roleItem.defaultUser);
      setPassword(roleItem.defaultPass);
      showFeedback(`Loaded ${roleItem.label} credentials`);
    } else {
      handleSelectMart(selectedMartId, roleItem.id);
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
      const result = await adminLogin(cleanUser, cleanPass, selectedRole, selectedMartId);
      if (!result || !result.success) {
        setErrorMessage(result?.error || 'Invalid credentials. Please verify your login details.');
      } else if (selectedRole === 'rider') {
        navigateTo('delivery-portal');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={loginScrollRef}
      onScroll={(event) => setShowScrollTop(event.currentTarget.scrollTop > 180)}
      className="h-[100dvh] min-h-screen w-full overflow-y-auto overscroll-y-contain bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] flex flex-col justify-between items-center py-6 sm:py-10 px-4 sm:px-6 font-sans antialiased text-slate-800"
    >
      
      {/* Centered Content Wrapper: my-auto cleanly centers when viewport is large; collapses when content overflows so top is never cut off */}
      <div className="w-full max-w-lg mx-auto my-auto flex flex-col items-center">
        
        {/* Top Brand Monogram Header */}
        <div className="mb-5 sm:mb-6 text-center w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs mb-2.5">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: websiteBrandColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: websiteBrandColor }}
              />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              {currentMart?.shortName || currentTenant?.name || 'Al-Fatah'} &bull; Enterprise Console
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>Console Authentication</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Central portal for Store Admins, Super Admins, Delivery Riders & Pickup Staff
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
              <span
                style={{
                  backgroundColor: `${themeColor}14`,
                  borderColor: `${themeColor}40`,
                  color: themeColor
                }}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors"
              >
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
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${themeColor}12`,
                            borderColor: themeColor,
                            color: themeColor,
                            boxShadow: `0 0 0 2px ${themeColor}25`
                          }
                        : undefined
                    }
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'font-bold scale-[1.01]'
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

          {/* 🏬 STORE SELECTOR FOR MART ADMINS, RIDERS & PICKUP STAFF */}
          {selectedRole !== 'superadmin' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>🏬</span> Select Supermarket (Mart):
                </span>
                <span
                  style={{
                    backgroundColor: `${currentMart.color}15`,
                    color: currentMart.color
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  Isolated {selectedRole === 'admin' ? 'Admin' : selectedRole === 'rider' ? 'Fleet' : 'Packing'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                {selectedRole === 'admin' && 'Each supermarket runs an isolated store dashboard with dedicated products & orders.'}
                {selectedRole === 'rider' && 'Select your store to sign in to its dedicated delivery rider dispatch fleet.'}
                {selectedRole === 'pickup_staff' && 'Select your store to sign in to its dedicated order packing desk.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
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
                <div className="text-[11px] text-amber-900/80 leading-snug">
                  Strict platform owner access only. Store Admins enter via the Store Admin tab with store credentials.
                </div>
              </div>
            </div>
          )}

          {/* 🛡️ STORE ADMIN INFO BANNER */}
          {selectedRole === 'admin' && (
            <div
              style={{
                backgroundColor: `${currentMart.color}0d`,
                borderColor: `${currentMart.color}35`
              }}
              className="p-3 border rounded-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-200"
            >
              <div
                style={{
                  backgroundColor: `${currentMart.color}20`,
                  color: currentMart.color
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 text-base"
              >
                {currentMart.logo || '🏬'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">{currentMart.name} Admin Console</div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  Manage products, inventory, live orders, staff permissions, and deliveries for {currentMart.shortName}.
                </div>
              </div>
            </div>
          )}

          {/* 🛵 RIDER INFO BANNER */}
          {selectedRole === 'rider' && (
            <div className="p-3 bg-orange-50/90 border border-orange-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-orange-950 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-orange-200/80 text-orange-900 flex items-center justify-center font-bold shrink-0 text-base">
                🛵
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Delivery Fleet & Courier Portal</div>
                <div className="text-[11px] text-orange-900/80 leading-snug">
                  View assigned customer deliveries, share live GPS route telemetry, and verify customer delivery OTP.
                </div>
              </div>
            </div>
          )}

          {/* 📦 PICKUP STAFF INFO BANNER */}
          {selectedRole === 'pickup_staff' && (
            <div
              style={{
                backgroundColor: `${websiteBrandColor}0d`,
                borderColor: `${websiteBrandColor}30`
              }}
              className="p-3 border rounded-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-200"
            >
              <div
                style={{
                  backgroundColor: `${websiteBrandColor}20`,
                  color: websiteBrandColor
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 text-base"
              >
                📦
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Pickup Staff Packing Desk</div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  Sign in with credentials assigned by Store Admin to pick shelf items, pack parcels, and stage for courier dispatch.
                </div>
              </div>
            </div>
          )}

          {/* Auto-fill notification chip */}
          {autoFillFeedback && (
            <div
              style={{
                backgroundColor: `${themeColor}10`,
                borderColor: `${themeColor}35`,
                color: themeColor
              }}
              className="border px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: themeColor }} />
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
                  ? `${currentMart.shortName} Admin Email / Username`
                  : selectedRole === 'superadmin'
                  ? 'Super Admin Username'
                  : selectedRole === 'rider'
                  ? 'Rider Phone / Username'
                  : selectedRole === 'pickup_staff'
                  ? 'Pickup Staff Username or Phone'
                  : 'Username or Phone'}
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
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-medium text-xs text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 3px ${themeColor}22`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {selectedRole === 'admin'
                    ? `${currentMart.shortName} Admin Password`
                    : selectedRole === 'rider'
                    ? 'Rider Access Password'
                    : selectedRole === 'pickup_staff'
                    ? 'Staff Access Password'
                    : 'Access Password'}
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedRole === 'admin'
                    ? 'Configured by Super Admin'
                    : selectedRole === 'rider'
                    ? 'Assigned by Store Admin'
                    : selectedRole === 'pickup_staff'
                    ? 'Assigned by Store Admin'
                    : 'Secure master key'}
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
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 font-medium text-xs text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 3px ${themeColor}22`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
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
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 4px 14px ${themeColor}35`
              }}
              className="w-full py-3 px-4 hover:opacity-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
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
                onClick={() => autoFillCredentials('admin', 'admin@chasevalue.pk', 'admin123', 'tenant-chasevalue', 'Chase Value Admin')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer"
              >
                🛒 Chase Value Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('admin', 'admin@alfatah.pk', 'admin123', 'tenant-alfatah', 'Al-Fatah Admin')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🏬 Al-Fatah Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('admin', 'admin@chaseup.pk', 'admin123', 'tenant-chaseup', 'Chase Up Admin')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🏪 Chase Up Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('admin', 'admin@unimart.pk', 'admin123', 'tenant-freshmart', 'Unimaart Admin')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🛍️ Unimaart Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('pickup_staff', 'chasevalue_staff', 'staff123', 'tenant-chasevalue', 'Chase Value Packing Desk')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
              >
                📦 Chase Value Staff
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('rider', 'chasevalue_rider', 'rider123', 'tenant-chasevalue', 'Chase Value Courier (Bilal Ahmed)')}
                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-950 font-bold text-[11px] transition-colors cursor-pointer"
              >
                🛵 Chase Value Rider
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('pickup_staff', 'alfatah_staff', 'staff123', 'tenant-alfatah', 'Al-Fatah Packing Desk')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                📦 Al-Fatah Staff
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials('rider', 'alfatah_rider', 'rider123', 'tenant-alfatah', 'Al-Fatah Courier (Ahmad Khan)')}
                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                🛵 Al-Fatah Rider
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
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: websiteBrandColor }} />
                <span>All Registered Mart Admins, Riders & Staff Directory</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-normal">
                  {showCredentialsHelp ? 'Hide' : 'Show All'}
                </span>
                {showCredentialsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showCredentialsHelp && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2.5 text-[11px] animate-in fade-in duration-200">
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
                          ? 'bg-rose-50 border-rose-500 shadow-2xs'
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

                {/* Pickup Staff Accounts List */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" style={{ color: websiteBrandColor }} />
                      <span>📦 Pickup Staff (Packing Team)</span>
                    </span>
                    <span
                      style={{
                        backgroundColor: `${websiteBrandColor}12`,
                        color: websiteBrandColor
                      }}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {(pickupStaff || []).length} registered
                    </span>
                  </div>

                  {(pickupStaff && pickupStaff.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pickupStaff.map((staff) => (
                        <div
                          key={staff.id}
                          onClick={() => autoFillCredentials('pickup_staff', staff.username, staff.password, staff.tenantId, staff.name)}
                          className={`p-2 rounded-xl border cursor-pointer transition ${
                            selectedRole === 'pickup_staff' && username === staff.username
                              ? 'bg-slate-100 border-slate-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate max-w-[130px]">{staff.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-600 truncate mt-0.5">@{staff.username}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Password: <span className="font-mono font-bold text-slate-700">{staff.password}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-100/80 border border-dashed border-slate-200 text-slate-500 text-[11px] text-center">
                      No pickup staff accounts yet. Create one from Store Admin &rarr; Pickup Staff.
                    </div>
                  )}
                </div>

                {/* 🛵 Delivery Riders Fleet Directory */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-orange-600" />
                      <span>🛵 Delivery Riders Fleet</span>
                    </span>
                    <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                      {(riders || []).length} registered
                    </span>
                  </div>

                  {(riders && riders.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {riders.map((rdr) => (
                        <div
                          key={rdr.id}
                          onClick={() => autoFillCredentials('rider', rdr.phone || rdr.username || rdr.name, rdr.password || 'rider123', null, rdr.name)}
                          className={`p-2 rounded-xl border cursor-pointer transition ${
                            selectedRole === 'rider' && (username === rdr.phone || username === rdr.username || username === rdr.name)
                              ? 'bg-orange-50 border-orange-500 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate max-w-[130px]">{rdr.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {rdr.status || 'Active'}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-600 truncate mt-0.5">{rdr.phone || `@${rdr.username}`}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Password: <span className="font-mono font-bold text-slate-700">{rdr.password || 'rider123'}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => autoFillCredentials('rider', 'ahmad', 'rider123', null, 'Ahmad Khan (Fleet Demo)')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition ${
                        selectedRole === 'rider' ? 'bg-orange-50 border-orange-500 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">🛵 Ahmad Khan (Fleet Demo Rider)</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">Quick Test</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 mt-0.5">ahmad / rider123 (or 0300-1234567)</div>
                      <p className="text-[9px] text-slate-400 mt-1">To register custom fleet couriers, add them via Store Admin &rarr; Delivery Fleet.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="pt-2 text-center border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              style={{ color: websiteBrandColor }}
              className="hover:opacity-80 font-bold transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to {currentMart?.shortName || currentTenant?.name || 'Al-Fatah'} Storefront</span>
            </button>
            <span className="text-[11px] text-slate-400">v2.5 Multi-Tenant Engine</span>
          </div>

        </div>

      </div>

      {/* Trust & Compliance Subtext */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-md mx-auto space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-medium text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: websiteBrandColor }} />
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
          <ArrowUp className="w-4 h-4" style={{ color: websiteBrandColor }} />
          <span className="hidden sm:inline text-[11px]">Top</span>
        </button>
      )}

    </div>
  );
};
