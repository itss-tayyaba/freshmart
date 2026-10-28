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
  Boxes,
  MapPin
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { resolveTenantId } from '../../data/companyHierarchyData';

export const AdminLogin = () => {
  const {
    adminLogin,
    adminLogout,
    user,
    adminRole,
    navigateTo,
    tenants,
    storeAdmins,
    allBranches = [],
    pickupStaff = [],
    riders = [],
    currentTenant
  } = useStore();

  const [selectedRole, setSelectedRole] = useState('superadmin');
  const [selectedMartId, setSelectedMartId] = useState('tenant-alfatah');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
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
        let subtitle = 'Supermarket Store';
        if (t.id === 'tenant-chasevalue') {
          short = 'Chase Value';
          subtitle = 'Wholesale Express Mart';
        } else if (t.id === 'tenant-chaseup') {
          short = 'Chase Up';
          subtitle = 'Department Store';
        } else if (t.id === 'tenant-alfatah') {
          short = 'Al-Fatah';
          subtitle = 'Flagship Supermarket';
        } else if (t.id === 'tenant-freshmart') {
          short = 'Unimart';
          subtitle = 'Direct Market Store';
        } else if (t.id === 'tenant-localgrocery') {
          short = 'Local Grocery';
          subtitle = 'Neighborhood Store';
        } else if (t.id === 'tenant-superstore') {
          short = 'Super Store';
          subtitle = 'Hypermarket';
        }
        return {
          id: t.id,
          name: t.name,
          shortName: short,
          subtitle,
          logo: t.logo || '🏬',
          color: t.color || '#991b1b',
          defaultEmail: t.ownerEmail || `admin@${t.slug || t.id.replace('tenant-', '')}.pk`
        };
      });
    }
    return [
      { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket', shortName: 'Al-Fatah', subtitle: 'Flagship Supermarket', logo: '🏬', color: '#991b1b', defaultEmail: 'admin@alfatah.pk' },
      { id: 'tenant-chasevalue', name: 'Chase Value', shortName: 'Chase Value', subtitle: 'Wholesale Express Mart', logo: '🛒', color: '#b45309', defaultEmail: 'admin@chasevalue.pk' },
      { id: 'tenant-chaseup', name: 'Chase Up', shortName: 'Chase Up', subtitle: 'Department Store', logo: '🏪', color: '#7e22ce', defaultEmail: 'admin@chaseup.pk' },
      { id: 'tenant-freshmart', name: 'Unimart (Market Store)', shortName: 'Unimart', subtitle: 'Direct Market Store', logo: '🛍️', color: '#0284c7', defaultEmail: 'admin@unimart.pk' },
      { id: 'tenant-localgrocery', name: 'Local Grocery', shortName: 'Local Grocery', subtitle: 'Neighborhood Store', logo: '🏬', color: '#0f766e', defaultEmail: 'admin@localgrocery.pk' },
      { id: 'tenant-superstore', name: 'Super Store', shortName: 'Super Store', subtitle: 'Hypermarket', logo: '🏪', color: '#9333ea', defaultEmail: 'admin@superstore.pk' }
    ];
  }, [tenants]);

  const currentMart = useMemo(() => {
    return availableMarts.find((m) => m.id === selectedMartId) || availableMarts[0];
  }, [availableMarts, selectedMartId]);

  const availableBranchesForMart = useMemo(() => {
    const canonical = resolveTenantId(selectedMartId);
    return (allBranches || []).filter((b) => b.tenantId === canonical);
  }, [allBranches, selectedMartId]);

  // Primary website brand color (matches Al-Fatah Ruby Crimson #991b1b, Chase Value, etc.)
  const websiteBrandColor = useMemo(() => {
    return currentTenant?.color || currentMart?.color || '#991b1b';
  }, [currentTenant, currentMart]);

  // Unified brand color matching main dashboard theme (emerald green #059669)
  const themeColor = useMemo(() => {
    return '#059669';
  }, []);

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
      userPlaceholder: 'rider phone or username (e.g. ali or ahmad)',
      passPlaceholder: 'rider password (e.g. rider123)',
      defaultUser: (riders && riders.length > 0) ? (riders[0].username || riders[0].phone || 'ali') : 'ali',
      defaultPass: 'rider123'
    },
    {
      id: 'pickup_staff',
      label: 'Pickup Staff',
      icon: '📦',
      sublabel: 'Packing Desk',
      badge: 'Order Packing',
      userPlaceholder: 'staff username (e.g. hafsa or alfatah_staff)',
      passPlaceholder: 'staff password (e.g. staff123)',
      defaultUser: 'hafsa',
      defaultPass: 'staff123'
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
      const activeRiders = (riders && riders.length > 0) ? riders : [
        { id: 'RDR-HAMZA', name: 'Hamza', username: 'hamza', phone: '03001234567', password: 'rider123', tenantId: 'tenant-chasevalue' },
        { id: 'RDR-CHASEVALUE', name: 'Bilal Ahmed', username: 'bilal_cv', phone: '03223344556', password: 'rider123', tenantId: 'tenant-chasevalue' },
        { id: 'RDR-ALI', name: 'Ali Khan', username: 'ali', phone: '03001122334', password: 'rider123', tenantId: 'tenant-alfatah' },
        { id: 'RDR-AHMAD', name: 'Ahmad Khan', username: 'ahmad', phone: '03206551696', password: 'rider123', tenantId: 'tenant-alfatah' },
        { id: 'RDR-UNIMART', name: 'Usman Tariq', username: 'usman', phone: '03112233445', password: 'rider123', tenantId: 'tenant-freshmart' },
        { id: 'RDR-CHASEUP', name: 'Kamran Shah', username: 'kamran_cu', phone: '03334455667', password: 'rider123', tenantId: 'tenant-chaseup' }
      ];

      let martRider = activeRiders.find((r) => r.tenantId === martId);
      if (!martRider && martId === 'tenant-chasevalue') {
        martRider = activeRiders.find((r) => r.username === 'hamza' || r.username === 'bilal_cv');
      } else if (!martRider && martId === 'tenant-chaseup') {
        martRider = activeRiders.find((r) => r.username === 'kamran_cu');
      } else if (!martRider && martId === 'tenant-freshmart') {
        martRider = activeRiders.find((r) => r.username === 'usman');
      } else if (!martRider && martId === 'tenant-alfatah') {
        martRider = activeRiders.find((r) => r.username === 'ali' || r.username === 'ahmad');
      }

      if (!martRider) {
        martRider = activeRiders.find((r) => r.isGlobal) || activeRiders[0];
      }

      if (martRider) {
        setUsername(martRider.username || martRider.phone || martRider.name);
        setPassword(martRider.password || 'rider123');
        showFeedback(`Loaded ${martRider.name} credentials (${martConfig?.shortName || 'Store'} Rider)`);
      } else {
        setUsername('hamza');
        setPassword('rider123');
        showFeedback('Loaded Hamza credentials');
      }
    } else if (role === 'pickup_staff') {
      if (martId === 'tenant-alfatah') {
        setUsername('hafsa');
        setPassword('staff123');
        showFeedback('Loaded Hafsa (Al-Fatah Staff) credentials');
      } else {
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
      if ((roleItem.id === 'rider' || roleItem.id === 'pickup_staff') && selectedBranchId === 'all' && availableBranchesForMart.length > 0) {
        setSelectedBranchId(availableBranchesForMart[0]._id || availableBranchesForMart[0].id);
      }
      handleSelectMart(selectedMartId, roleItem.id);
    }
  };

  const showFeedback = (msg) => {
    setAutoFillFeedback(msg);
    setTimeout(() => {
      setAutoFillFeedback('');
    }, 2500);
  };

  const autoFillCredentials = (roleId, user, pass, martId = null, label = '', branchId = null) => {
    setSelectedRole(roleId);
    if (martId) {
      setSelectedMartId(martId);
    }
    if (branchId) {
      setSelectedBranchId(branchId);
    } else {
      setSelectedBranchId('all');
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
      const result = await adminLogin(
        cleanUser,
        cleanPass,
        selectedRole,
        selectedMartId,
        selectedBranchId !== 'all' ? selectedBranchId : null
      );
      if (!result || !result.success) {
        setErrorMessage(result?.error || 'Invalid credentials. Please verify your login details.');
      } else {
        const effectiveRole = result.role || selectedRole;
        if (effectiveRole === 'rider') {
          navigateTo('delivery-portal');
        } else if (effectiveRole === 'pickup_staff') {
          navigateTo('pickup-staff');
        } else if (effectiveRole === 'supplier' || effectiveRole === 'vendor') {
          navigateTo('vendor');
        } else {
          navigateTo('admin');
        }
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
          
          {/* Active Session Info (Allows direct dashboard access or switching without manual logout) */}
          {user && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Signed in: <span className="text-slate-900 font-extrabold">{user.name || user.username || user.email}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    Role: <span className="font-semibold text-slate-700">{user.role || adminRole}</span>
                    {user.tenantName ? ` • ${user.tenantName}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const eff = user.role || adminRole;
                    if (eff === 'rider') navigateTo('delivery-portal');
                    else if (eff === 'pickup_staff') navigateTo('pickup-staff');
                    else if (eff === 'supplier' || eff === 'vendor') navigateTo('vendor');
                    else navigateTo('admin');
                  }}
                  className="flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Go to Dashboard →
                </button>
                <button
                  type="button"
                  onClick={() => adminLogout()}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                {availableMarts.slice(0, 4).map((m) => {
                  const isSelected = selectedMartId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMart(m.id)}
                      style={{
                        borderColor: isSelected ? m.color : '#e2e8f0',
                        backgroundColor: isSelected ? `${m.color}0d` : '#ffffff',
                        boxShadow: isSelected ? `0 0 0 2px ${m.color}40, 0 4px 12px ${m.color}15` : 'none'
                      }}
                      className={`p-3 rounded-2xl text-left border flex items-center justify-between gap-2.5 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'font-bold'
                          : 'hover:bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          style={{
                            backgroundColor: `${m.color}18`,
                            color: m.color
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                        >
                          {m.logo}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: isSelected ? m.color : '#0f172a' }}
                              className="text-xs sm:text-[13px] font-extrabold leading-tight tracking-tight whitespace-nowrap"
                            >
                              {m.shortName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block leading-tight mt-0.5 truncate">
                            {m.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        {isSelected ? (
                          <div
                            style={{ backgroundColor: m.color }}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
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
                🛵
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">{currentMart.shortName} Delivery Fleet & Dispatch Portal</div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  Sign in with your courier credentials (e.g. {currentMart.id === 'tenant-chasevalue' ? 'hamza or bilal_cv' : currentMart.id === 'tenant-chaseup' ? 'kamran_cu' : currentMart.id === 'tenant-freshmart' ? 'usman' : 'ali or ahmad'}) to view orders and live GPS dispatch.
                </div>
              </div>
            </div>
          )}

          {/* 📦 PICKUP STAFF INFO BANNER */}
          {selectedRole === 'pickup_staff' && (
            <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold shrink-0 text-base">
                📦
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">Pickup Staff Packing Desk</div>
                <div className="text-[11px] text-emerald-900/80 leading-snug">
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
