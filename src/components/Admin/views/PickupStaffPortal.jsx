import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Boxes,
  PackageCheck,
  Package,
  Clock,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  AlertCircle,
  Filter,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  Share2,
  Menu
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { resolveTenantId, isSameTenant, BRANCHES } from '../../../data/companyHierarchyData';
import { isOrderAssignedToPickupStaff, isPickupOrderAssigned } from '../../../utils/pickupStaffAssignment';
import { isOrderVisibleToUser, normalizeOrderTenantId } from '../../../utils/orderScope';
import { sanitizeOrder } from '../../../utils/orderSanitizer';
import { apiService } from '../../../services/api';
import { getStoreTheme } from '../../../utils/storeTheme';

// Helper: category/grocery item icon
const getItemIcon = (name = '') => {
  const n = String(name || '').toLowerCase();
  if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese') || n.includes('butter') || n.includes('dairy') || n.includes('olper')) return '🥛';
  if (n.includes('bread') || n.includes('bun') || n.includes('toast') || n.includes('croissant') || n.includes('rusk') || n.includes('dawn')) return '🍞';
  if (n.includes('oil') || n.includes('ghee') || n.includes('dalda') || n.includes('banaspati') || n.includes('canola')) return '🧴';
  if (n.includes('egg') || n.includes('anda')) return '🥚';
  if (n.includes('rice') || n.includes('atta') || n.includes('flour') || n.includes('sugar') || n.includes('daal')) return '🌾';
  if (n.includes('chip') || n.includes('lays') || n.includes('biscuit') || n.includes('cookie') || n.includes('oreo')) return '🍪';
  if (n.includes('cappuccino') || n.includes('coffee') || n.includes('tea') || n.includes('chai') || n.includes('tapal') || n.includes('lipton')) return '☕';
  if (n.includes('coke') || n.includes('pepsi') || n.includes('juice') || n.includes('water') || n.includes('soda')) return '🥤';
  if (n.includes('soap') || n.includes('shampoo') || n.includes('surf') || n.includes('detergent') || n.includes('dettol')) return '🧼';
  if (n.includes('tomato') || n.includes('palak') || n.includes('spinach') || n.includes('potato') || n.includes('onion') || n.includes('garlic')) return '🥬';
  return '📦';
};

// Robust helper: safely determine the true item count of an order without falling back to arbitrary numbers
const resolveOrderItemsCount = (ord) => {
  if (!ord) return 1;
  if (Array.isArray(ord.items) && ord.items.length > 0) {
    if (typeof ord.items[0] === 'object') {
      return ord.items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) || ord.items.length;
    }
    return ord.items.length;
  }
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) {
    return ord.orderItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) || ord.orderItems.length;
  }
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) {
    return ord.rawItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) || ord.rawItems.length;
  }
  if (typeof ord.itemsCount === 'number' && ord.itemsCount > 0) {
    return ord.itemsCount;
  }
  if (typeof ord.items === 'number' && ord.items > 0) {
    return ord.items;
  }
  if (typeof ord.items === 'string') {
    const parsed = parseInt(ord.items, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1;
};

export const PickupStaffPortal = ({ onBackToAdmin }) => {
  const {
    user,
    customerOrders = [],
    adminOrders = [],
    currentTenant,
    currentBranch,
    allBranches = [],
    riders = [],
    updateOrderFulfillment,
    assignRiderToOrder,
    adminLogout,
    getProductSubstitutes,
    substituteOrderItem,
    addToast,
    currency = 'Rs.'
  } = useStore();

  // Active navigation sidebar tab: 'Dashboard' | 'Assigned Orders' | 'All Orders' | 'Packed Orders' | 'Ready for Delivery' | 'History'
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrderForPacking, setSelectedOrderForPacking] = useState(null);
  const [pickedState, setPickedState] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual backend order sync
  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiService.getOrders();
      if (res && res.success && Array.isArray(res.orders)) {
        addToast?.('Orders Synced 🔄', `${res.orders.length} database order${res.orders.length === 1 ? '' : 's'} loaded.`);
      }
    } catch (e) {
      console.error('Failed to sync orders:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Smart Product Substitution modal state for unavailable items
  const [substitutionModal, setSubstitutionModal] = useState(null); // { order, item, idx }
  const [substitutionReason, setSubstitutionReason] = useState('Customer approved substitution via phone');
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  // 1. Resolve Staff's Store & Respective Branch ID
  const staffTenantId = useMemo(() => {
    return resolveTenantId(user?.tenantId || currentTenant?.id || 'company_004');
  }, [user?.tenantId, currentTenant?.id]);

  const storeTheme = useMemo(() => {
    return getStoreTheme(staffTenantId || currentTenant?.id);
  }, [staffTenantId, currentTenant?.id]);

  const staffBranchId = useMemo(() => {
    if (user?.branchId && user.branchId !== 'all') return user.branchId;
    if (currentBranch && isSameTenant(currentBranch.tenantId, staffTenantId)) {
      const bId = currentBranch._id || currentBranch.id;
      if (bId && bId !== 'all') return bId;
    }
    if (isSameTenant(staffTenantId, 'company_001')) return 'branch_af_fsd';
    if (isSameTenant(staffTenantId, 'company_002')) return 'branch_006';
    if (isSameTenant(staffTenantId, 'company_003')) return 'branch_cv_fsd';
    return 'branch_um_fsd'; // Default Unimaart Peoples Colony Dark Store
  }, [user?.branchId, currentBranch, staffTenantId]);

  const staffBranch = useMemo(() => {
    const list = (allBranches && allBranches.length > 0) ? allBranches : BRANCHES;
    const found = list.find((b) => b._id === staffBranchId || b.id === staffBranchId);
    if (found) return found;
    return {
      _id: staffBranchId,
      id: staffBranchId,
      name: user?.branchName || (isSameTenant(staffTenantId, 'company_004') ? 'Peoples Colony Dark Store' : 'Main SuperHub'),
      city: 'Faisalabad',
      address: 'D-Ground Commercial Center, Peoples Colony 1, Faisalabad'
    };
  }, [allBranches, staffBranchId, user?.branchName, staffTenantId]);

  const storeBrandName = useMemo(() => {
    if (isSameTenant(staffTenantId, 'company_001')) return 'Al-Fatah';
    if (isSameTenant(staffTenantId, 'company_002')) return 'Chase Up';
    if (isSameTenant(staffTenantId, 'company_003')) return 'Chase Value';
    return 'Unimaart';
  }, [staffTenantId]);

  const staffName = user?.name || (isSameTenant(staffTenantId, 'company_004') ? 'Unimaart Packing Desk' : 'Packing Staff');
  const staffFirstName = staffName.split(' ')[0] || staffName;

  // 2. Strict Branch & Tenant Scoped Order Feed
  const branchOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])].map(sanitizeOrder);
    const uniqueMap = new Map();

    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId)) {
        const id = String(ord.id || ord.orderId);
        if (!uniqueMap.has(id)) {
          uniqueMap.set(id, ord);
        }
      }
    });

    const list = Array.from(uniqueMap.values());

    return list.filter((ord) => {
      // Must match tenant
      const ordTenant = normalizeOrderTenantId(ord);
      if (!isSameTenant(ordTenant, staffTenantId)) return false;

      // 1. Direct Assignment Bypass:
      // If store admin assigned this order directly to this staff member (or packing desk), ALWAYS show it!
      if (isOrderAssignedToPickupStaff(ord, user)) return true;

      // 2. If user is Store Admin / Super Admin previewing the portal, show all tenant orders
      if (user?.role === 'admin' || user?.role === 'superadmin') return true;

      // 3. If assigned to a DIFFERENT staff member at this store, only they see it
      const currentStaffId = String(user?.id || user?.staffId || user?._id || '').toLowerCase().trim();
      const ordStaffId = String(ord.pickupStaffId || '').toLowerCase().trim();
      if (ordStaffId && currentStaffId && ordStaffId !== currentStaffId) {
        return false;
      }

      // 4. For unassigned orders: match branch
      const ordBranch = ord.branchId;
      if (ordBranch && ordBranch !== 'all' && staffBranchId && staffBranchId !== 'all') {
        if (ordBranch !== staffBranchId) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, staffTenantId, staffBranchId, user]);

  // Order category groupings
  const isPendingStatus = (s = '') => {
    const lower = String(s || '').toLowerCase().trim();
    return [
      'pending',
      'pending_kitchen',
      'order placed',
      'received by pickup staff',
      'deliver to staff',
      'delivered to staff',
      'to pack',
      'picking',
      'received',
      'assigned',
      'processing'
    ].includes(lower) || !s;
  };
  const isPackingStatus = (s = '') => {
    const lower = String(s || '').toLowerCase().trim();
    return ['preparing', 'processing', 'picking', 'packed'].includes(lower);
  };
  const isReadyStatus = (o) => {
    const lower = String(o?.status || '').toLowerCase().trim();
    return ['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(lower) || o?.isDispatchedByStaff;
  };
  const isDispatchedStatus = (o) => {
    const lower = String(o?.status || '').toLowerCase().trim();
    return ['dispatched', 'out for delivery', 'delivered'].includes(lower) || o?.isDispatched;
  };

  const assignedOrders = useMemo(() => {
    return branchOrders.filter((o) => {
      if (isReadyStatus(o) || isDispatchedStatus(o) || (o.status || '').toLowerCase() === 'packed') return false;
      return isPendingStatus(o.status) || (o.status || '').toLowerCase() === 'preparing' || (o.status || '').toLowerCase() === 'picking';
    });
  }, [branchOrders]);

  const packedOrders = useMemo(() => {
    return branchOrders.filter((o) => (o.status || '').toLowerCase() === 'packed');
  }, [branchOrders]);

  const readyOrders = useMemo(() => {
    return branchOrders.filter((o) => isReadyStatus(o) && !isDispatchedStatus(o));
  }, [branchOrders]);

  const delayedOrders = useMemo(() => {
    return branchOrders.filter((o) => {
      if (isDispatchedStatus(o)) return false;
      const created = new Date(o.createdAt || 0).getTime();
      const ageMinutes = (Date.now() - created) / 60000;
      return ageMinutes > 25 || o.isDelayed;
    });
  }, [branchOrders]);

  // 3. Real Live Branch Orders (Zero mock seeds: populated strictly from live checkout or database)
  const displayAssignedOrders = assignedOrders;
  const displayReadyOrders = readyOrders;

  // Real Counts for Top 4 Stat Cards
  const kpiCounts = useMemo(() => {
    return {
      assigned: assignedOrders.length,
      packed: packedOrders.length,
      ready: readyOrders.length,
      delayed: delayedOrders.length
    };
  }, [assignedOrders.length, packedOrders.length, readyOrders.length, delayedOrders.length]);

  // Checklist helper
  const toggleItemPick = (orderId, idx) => {
    setPickedState((prev) => {
      const current = prev[orderId] || [];
      const updated = current.includes(idx) ? current.filter((i) => i !== idx) : [...current, idx];
      return { ...prev, [orderId]: updated };
    });
  };

  const handlePickAll = (orderId, totalCount) => {
    setPickedState((prev) => {
      const current = prev[orderId] || [];
      const isAll = current.length === totalCount;
      return {
        ...prev,
        [orderId]: isAll ? [] : Array.from({ length: totalCount }, (_, i) => i)
      };
    });
  };

  // Substitution logic
  const modalSubstitutes = useMemo(() => {
    if (!substitutionModal?.item) return [];
    return typeof getProductSubstitutes === 'function'
      ? getProductSubstitutes(substitutionModal.item, {
          tenantId: substitutionModal.order?.tenantId || staffTenantId,
          limit: 5
        })
      : [];
  }, [substitutionModal, getProductSubstitutes, staffTenantId]);

  const handleOpenSubstitution = (e, order, item, idx) => {
    e.stopPropagation();
    setSubstitutionModal({ order, item, idx });
    setSelectedAlternative(null);
    setSubstitutionReason('Item Out of Stock - Customer approved substitution');
  };

  const handleConfirmSubstitution = async () => {
    if (!substitutionModal || !selectedAlternative) return;
    const orderId = substitutionModal.order.id || substitutionModal.order.orderId;
    if (typeof substituteOrderItem === 'function') {
      await substituteOrderItem(orderId, substitutionModal.idx, selectedAlternative, substitutionReason);
    }
    addToast?.('Item Substituted', `Replaced with ${selectedAlternative.name}`);
    setSubstitutionModal(null);
    setSelectedAlternative(null);
  };

  // Pack Order
  const handlePackItems = async (order, itemsCount) => {
    const orderId = order.id || order.orderId;
    const total = itemsCount || resolveOrderItemsCount(order);
    setPickedState((prev) => ({
      ...prev,
      [orderId]: Array.from({ length: total }, (_, i) => i)
    }));

    const parcelCode = order.parcelCode || `PRCL-${String(orderId).replace(/\W/g, '').slice(-6).toUpperCase()}`;
    await updateOrderFulfillment?.(orderId, {
      fulfillmentStage: 3,
      status: 'Packed',
      pickupStep: 'packed',
      pickedItems: Array.from({ length: total }, (_, i) => i),
      parcelCode,
      sealedAt: new Date().toISOString(),
      packedAt: new Date().toISOString(),
      branchId: staffBranchId,
      isDispatchedByStaff: false
    });
    addToast?.('Order Packed 📦', `Order ${orderId} sealed with code ${parcelCode}`);
    setSelectedOrderForPacking(null);
  };

  // Ready for Delivery
  const handleMarkReadyForDispatch = async (order) => {
    const orderId = order.id || order.orderId;
    const total = resolveOrderItemsCount(order);
    const parcelCode = order.parcelCode || `PRCL-${String(orderId).replace(/\W/g, '').slice(-6).toUpperCase()}`;

    await updateOrderFulfillment?.(orderId, {
      fulfillmentStage: 4,
      status: 'Prepared',
      pickupStep: 'verified',
      pickedItems: Array.from({ length: total }, (_, i) => i),
      parcelCode,
      branchId: staffBranchId,
      isDispatched: false,
      isDispatchedByStaff: true,
      readyForDispatchAt: new Date().toISOString()
    });
    addToast?.('Ready for Delivery ✔', `Order ${orderId} staged for rider pickup.`);
    setSelectedOrderForPacking(null);
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* 📱 MOBILE TOP HEADER BAR (< md screens) */}
      <div
        className="md:hidden text-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md transition-colors shrink-0"
        style={{
          backgroundColor: storeTheme.sidebarHeaderBg,
          borderBottom: `1px solid ${storeTheme.sidebarBorder}`
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Toggle pickup staff menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
              {storeBrandName}
            </h1>
            <p
              className="text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: storeTheme.accentText }}
            >
              Packing Station • {activeNav}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Toggle notifications"
          >
            <Bell className="w-4 h-4" />
            {(kpiCounts.assigned + kpiCounts.ready) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {kpiCounts.assigned + kpiCounts.ready}
              </span>
            )}
          </button>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0"
            style={{
              backgroundColor: `${storeTheme.primaryLight}40`,
              color: storeTheme.accentText,
              border: `1px solid ${storeTheme.primaryLight}60`
            }}
          >
            {(staffName || 'S')[0]}
          </div>
        </div>
      </div>

      {/* 📱 MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* =========================================================================
          LEFT SIDEBAR: Store Themed Sidebar (Desktop Sticky / Mobile Drawer)
          ========================================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64 lg:w-72 text-slate-300 flex flex-col justify-between shrink-0 select-none overflow-y-auto shadow-2xl transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: storeTheme.sidebarBg,
          borderRight: `1px solid ${storeTheme.sidebarBorder}`
        }}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div
            className="p-4 shrink-0 transition-colors"
            style={{
              backgroundColor: storeTheme.sidebarHeaderBg,
              borderBottom: `1px solid ${storeTheme.sidebarBorder}`
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0"
                style={{
                  backgroundColor: `${storeTheme.primaryLight}25`,
                  border: `1px solid ${storeTheme.primaryLight}50`,
                  color: storeTheme.accentText
                }}
              >
                <ShoppingCart className="w-4 h-4" style={{ color: storeTheme.accentText }} />
              </div>
              <div className="min-w-0 flex-1 truncate">
                <h2 className="text-sm font-black tracking-tight text-white leading-tight truncate">
                  {storeBrandName}
                </h2>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block truncate mt-0.5"
                  style={{ color: storeTheme.accentText }}
                >
                  Pickup Staff
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2.5 space-y-1">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'Assigned Orders', label: 'Assigned Orders', icon: ClipboardList, count: kpiCounts.assigned },
              { id: 'All Orders', label: 'All Orders', icon: Boxes },
              { id: 'Packed Orders', label: 'Packed Orders', icon: PackageCheck, count: kpiCounts.packed },
              { id: 'Ready for Delivery', label: 'Ready for Delivery', icon: CheckSquare, count: kpiCounts.ready },
              { id: 'Notifications', label: 'Notifications', icon: Bell, badge: (kpiCounts.assigned + kpiCounts.ready) || undefined }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'Notifications') setShowNotifications(!showNotifications);
                    else {
                      setActiveNav(item.id);
                      setMobileSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                    isActive
                      ? 'text-white font-bold shadow-md'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: storeTheme.activeBg,
                          boxShadow: storeTheme.activeGlow,
                          border: `1px solid ${storeTheme.primaryLight}50`
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: User Profile Card & Vegetable Crate Artwork */}
        <div
          className="p-3 shrink-0 space-y-2 mt-auto transition-colors"
          style={{
            backgroundColor: storeTheme.sidebarFooterBg,
            borderTop: `1px solid ${storeTheme.sidebarBorder}`
          }}
        >
          {/* User Profile Card */}
          <div
            className="flex items-center gap-2.5 p-2 rounded-xl transition-colors"
            style={{
              backgroundColor: `${storeTheme.sidebarBg}bb`,
              border: `1px solid ${storeTheme.sidebarBorder}`
            }}
          >
            <img
              src="/staff_ayesha.jpg"
              alt={staffName}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs"
              style={{ border: `1px solid ${storeTheme.primaryLight}60` }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">
                {staffName}
              </h4>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: storeTheme.accentText }}>
                Pickup Staff · <span className="font-mono font-bold">{kpiCounts.assigned}/10 Parcels</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400">Online</span>
              </div>
            </div>
          </div>

          {/* Decorative Grocery Crate */}
          <div
            className="rounded-xl overflow-hidden shadow-sm relative group"
            style={{ border: `1px solid ${storeTheme.sidebarBorder}` }}
          >
            <img
              src="/pickup_crate.jpg"
              alt="Fresh Produce Crate"
              className="w-full h-16 object-cover transition duration-300 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${storeTheme.sidebarBg}, transparent)`
              }}
            ></div>
            <div className="absolute bottom-1.5 left-2 right-2 text-center">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${storeTheme.sidebarHeaderBg}f0`,
                  border: `1px solid ${storeTheme.primaryLight}50`,
                  color: storeTheme.accentText
                }}
              >
                Hub Packing Desk
              </span>
            </div>
          </div>

          {/* Storefront & Logout */}
          <div className="space-y-1.5 pt-0.5">
            {onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                style={{
                  color: storeTheme.accentText,
                  backgroundColor: `${storeTheme.primaryLight}18`,
                  border: `1px solid ${storeTheme.primaryLight}40`
                }}
              >
                <span className="flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  <span>Admin Console</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5" style={{ color: storeTheme.accentText }} />
              </button>
            )}

            <button
              type="button"
              onClick={adminLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE AREA
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        
        {/* Top Header Row with Welcome Text, Branch ID Scoping Pill & Notification Bell */}
        <header className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Pickup Staff Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Welcome back, <span className="font-bold text-slate-800 dark:text-slate-200">{staffFirstName}!</span>
              </p>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
              
              {/* STRICT BRANCH ID SCOPING BADGE */}
              <div
                title={`All orders shown belong strictly to branch ${staffBranchId}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
              >
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Branch:</span>
                <span className="font-bold">{staffBranch.name}</span>
                <span className="font-mono bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                  {staffBranchId}
                </span>
              </div>

              {/* REFRESH ORDERS FROM DATABASE */}
              <button
                type="button"
                onClick={handleRefreshOrders}
                disabled={isRefreshing}
                title="Refresh orders from database"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* Right Header: Notification Bell & Quick Actions */}
          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {(kpiCounts.assigned + kpiCounts.ready > 0) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                  {kpiCounts.assigned + kpiCounts.ready}
                </span>
              )}
            </button>

            {/* Notification Flyout Drawer */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent Branch Alerts</h4>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-2.5 text-xs">
                  {branchOrders.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No branch alerts. Live customer orders placed for {staffBranch.name} will trigger real-time alerts here.
                    </div>
                  ) : (
                    branchOrders.slice(0, 4).map((bo) => {
                      const boId = bo.id || bo.orderId;
                      const isReady = isReadyStatus(bo);
                      const isPacked = (bo.status || '').toLowerCase() === 'packed';
                      return (
                        <div key={boId} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Order {boId}: {isReady ? 'Ready for Delivery' : isPacked ? 'Order Packed' : 'Assigned to Pick'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Customer: {bo.customerName || bo.customer || 'Shopper'} • {resolveOrderItemsCount(bo)} {resolveOrderItemsCount(bo) === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="p-4 sm:p-5 space-y-3.5 max-w-7xl mx-auto w-full">
          
          {/* =========================================================================
              TOP 4 STAT CARDS (Identical to user's screenshot)
              - 12 Assigned Orders (soft green)
              - 8 Packed Orders (soft blue)
              - 5 Ready for Delivery (soft amber)
              - 2 Delayed Orders (soft purple)
              ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Card 1: Assigned Orders */}
            <div
              onClick={() => setActiveNav('Assigned Orders')}
              className="bg-[#ecfdf5] dark:bg-emerald-950/30 border border-[#a7f3d0] dark:border-emerald-800/60 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#062319] border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono block">
                  {kpiCounts.assigned}/10
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block">
                  Active Parcels ({kpiCounts.assigned}/10)
                </span>
              </div>
            </div>

            {/* Card 2: Packed Orders */}
            <div
              onClick={() => setActiveNav('Packed Orders')}
              className="bg-[#eff6ff] dark:bg-blue-950/30 border border-[#bfdbfe] dark:border-blue-800/60 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0d2238] border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono block">
                  {kpiCounts.packed}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block">
                  Packed Orders
                </span>
              </div>
            </div>

            {/* Card 3: Ready for Delivery */}
            <div
              onClick={() => setActiveNav('Ready for Delivery')}
              className="bg-[#fffbeb] dark:bg-amber-950/30 border border-[#fde68a] dark:border-amber-800/60 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#382805] border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono block">
                  {kpiCounts.ready}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block">
                  Ready for Delivery
                </span>
              </div>
            </div>

            {/* Card 4: Delayed Orders */}
            <div
              onClick={() => setActiveNav('All Orders')}
              className="bg-[#faf5ff] dark:bg-purple-950/30 border border-[#e9d5ff] dark:border-purple-800/60 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#28133d] border border-purple-200 dark:border-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono block">
                  {kpiCounts.delayed}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block">
                  Delayed Orders
                </span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              SECTION 1: ASSIGNED ORDERS TABLE (Active on Dashboard or Assigned Orders)
              ========================================================================= */}
          {(activeNav === 'Dashboard' || activeNav === 'Assigned Orders') && (

          <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Assigned Orders</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({displayAssignedOrders.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveNav('Assigned Orders')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Assigned Orders Table or Clean Empty State */}
            {displayAssignedOrders.length === 0 ? (
              <div className="text-center py-5 px-4 space-y-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-base">
                  📋
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No Assigned Orders</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Orders placed by customers for {staffBranch.name} will appear here for packing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="py-2.5 font-bold">Order ID</th>
                      <th className="py-2.5 font-bold">Customer</th>
                      <th className="py-2.5 font-bold">Items</th>
                      <th className="py-2.5 font-bold">Time</th>
                      <th className="py-2.5 font-bold text-right pr-3">Status</th>
                      <th className="py-2.5 w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayAssignedOrders.map((ord) => {
                      const orderId = ord.id || ord.orderId;
                      const customer = ord.customerName || ord.customer || 'Customer';
                      const itemsCount = resolveOrderItemsCount(ord);
                      const time = ord.time || (ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:30 AM');

                      return (
                        <tr
                          key={orderId}
                          onClick={() => setSelectedOrderForPacking(ord)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                        >
                          <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            <span>{orderId}</span>
                          </td>
                          <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">
                            {customer}
                          </td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                            {itemsCount} items
                          </td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                            {time}
                          </td>
                          <td className="py-3.5 text-right pr-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForPacking(ord);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                            >
                              <span>To Pack</span>
                            </button>
                          </td>
                          <td className="py-3.5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
                            <ChevronRight className="w-4 h-4" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          )}

          {/* =========================================================================
              SECTION 1.5: PACKED ORDERS VIEW (Active on Packed Orders tab)
              ========================================================================= */}
          {activeNav === 'Packed Orders' && (
            <section className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>Packed Orders</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">({packedOrders.length})</span>
                </h3>
              </div>
              {packedOrders.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl">
                    📦
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Packed Orders</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Orders that you pack and seal will show here before being staged for delivery.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Parcel Code</th>
                        <th className="py-2.5">Items</th>
                        <th className="py-2.5 text-right pr-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {packedOrders.map((ord) => {
                        const ordId = ord.id || ord.orderId;
                        return (
                          <tr key={ordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{ordId}</td>
                            <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{ord.customerName || ord.customer || 'Customer'}</td>
                            <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{ord.parcelCode || 'PRCL-STD'}</td>
                            <td className="py-3 text-slate-500">{resolveOrderItemsCount(ord)} {resolveOrderItemsCount(ord) === 1 ? 'item' : 'items'}</td>
                            <td className="py-3 text-right pr-3">
                              <button
                                type="button"
                                onClick={() => handleMarkReadyForDispatch(ord)}
                                className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Ready for Delivery</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =========================================================================
              SECTION 1.6: ALL ORDERS VIEW (Active on All Orders tab)
              ========================================================================= */}
          {activeNav === 'All Orders' && (
            <section className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>All Branch Orders</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">({branchOrders.length})</span>
                </h3>
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              {branchOrders.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Branch Orders</p>
                  <p className="text-xs text-slate-400">Customer orders for {staffBranch.name} will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Total</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right pr-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {branchOrders
                        .filter((o) => {
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return (o.id || o.orderId || '').toLowerCase().includes(q) ||
                                 (o.customerName || o.customer || '').toLowerCase().includes(q);
                        })
                        .map((ord) => {
                          const ordId = ord.id || ord.orderId;
                          const isReady = isReadyStatus(ord);
                          const isPacked = (ord.status || '').toLowerCase() === 'packed';
                          const isPending = isPendingStatus(ord.status);
                          return (
                            <tr key={ordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{ordId}</td>
                              <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{ord.customerName || ord.customer || 'Customer'}</td>
                              <td className="py-3 font-bold text-slate-900 dark:text-white">{currency} {(ord.total || ord.totalAmount || 0).toLocaleString()}</td>
                              <td className="py-3">
                                <span className={"px-2.5 py-0.5 rounded-full text-[10px] font-bold " + (
                                  isReady ? "bg-emerald-100 text-emerald-800" :
                                  isPacked ? "bg-emerald-100 text-emerald-800" :
                                  isPending ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                )}>
                                  {ord.status || 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-3">
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForPacking(ord)}
                                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  >
                                    To Pack
                                  </button>
                                ) : isPacked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkReadyForDispatch(ord)}
                                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  >
                                    Mark Ready
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">Staged in Hub</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =========================================================================
              SECTION 2: READY FOR DELIVERY (Active on Dashboard or Ready for Delivery)
              ========================================================================= */}
          {(activeNav === 'Dashboard' || activeNav === 'Ready for Delivery') && (

          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ready for Delivery</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({displayReadyOrders.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveNav('Ready for Delivery')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
              >
                View All
              </button>
            </div>

            {displayReadyOrders.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-base">
                  📦
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No Orders Ready for Delivery</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Pack assigned orders and click &ldquo;Mark Ready for Delivery&rdquo; to stage parcels in the hub for store admin rider assignment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayReadyOrders.map((ord) => {
                  const orderId = ord.id || ord.orderId;
                  const customer = ord.customerName || ord.customer || 'Customer';
                  const itemsCount = resolveOrderItemsCount(ord);
                  const address = ord.address || ord.shippingAddress?.address || 'Street 45, Block E, DHA, Lahore';

                  return (
                    <div
                      key={orderId}
                      className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Left Side: Paper Grocery Bag Artwork */}
                        <div className="w-20 h-24 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src="/pickup_bag.jpg"
                            alt="Grocery Bag"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Right Side: Order Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                              Order ID: <b className="text-slate-900 dark:text-white">{orderId}</b>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Ready
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            Customer: <b className="text-slate-900 dark:text-white font-bold">{customer}</b>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Items: <b className="text-slate-700 dark:text-slate-300 font-medium">{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</b>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Address: <span className="text-slate-700 dark:text-slate-300">{address}</span>
                          </p>
                        </div>
                      </div>

                      {/* Ready for Delivery Indicator - Rider assignment authority is reserved for Store Admin */}
                      <div className="space-y-1.5 pt-1">
                        <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Ready for Delivery &bull; Staged in Hub</span>
                        </div>
                        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                          Awaiting Store Admin to assign delivery rider
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          )}

          {/* =========================================================================
              SECTION 3: HOW IT WORKS (PICKUP FLOW) - Active on Dashboard
              ========================================================================= */}
          {activeNav === 'Dashboard' && (

          <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2.5">
              How it works (Pickup Flow)
            </h4>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-1">
              {[
                {
                  step: 1,
                  title: 'Receive Order',
                  icon: ClipboardList,
                  bg: 'bg-blue-100 dark:bg-blue-950/60',
                  color: 'text-blue-600 dark:text-blue-400',
                  numColor: 'text-blue-700 dark:text-blue-300'
                },
                {
                  step: 2,
                  title: 'Pick Items',
                  icon: ShoppingCart,
                  bg: 'bg-emerald-100 dark:bg-emerald-950/60',
                  color: 'text-emerald-600 dark:text-emerald-400',
                  numColor: 'text-emerald-700 dark:text-emerald-300'
                },
                {
                  step: 3,
                  title: 'Pack Order',
                  icon: Package,
                  bg: 'bg-amber-100 dark:bg-amber-950/60',
                  color: 'text-amber-600 dark:text-amber-400',
                  numColor: 'text-amber-700 dark:text-amber-300'
                },
                {
                  step: 4,
                  title: 'Mark Ready',
                  icon: Check,
                  bg: 'bg-purple-100 dark:bg-purple-950/60',
                  color: 'text-purple-600 dark:text-purple-400',
                  numColor: 'text-purple-700 dark:text-purple-300'
                },
                {
                  step: 5,
                  title: 'Ready for Rider',
                  icon: CheckCircle2,
                  bg: 'bg-emerald-100 dark:bg-emerald-950/60',
                  color: 'text-emerald-600 dark:text-emerald-400',
                  numColor: 'text-emerald-700 dark:text-emerald-300'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-8 h-8 rounded-full ${item.bg} ${item.color} flex items-center justify-center shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold mt-2 ${item.numColor}`}>
                        {item.step}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {item.title}
                      </span>
                    </div>

                    {/* Arrow between steps */}
                    {idx < 4 && (
                      <div className="hidden sm:flex text-slate-300 dark:text-slate-600 pb-3">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>

          )}

        </main>
      </div>

      {/* =========================================================================
          ORDER PACKING & ITEM PICKING CHECKLIST MODAL
          ========================================================================= */}
      {selectedOrderForPacking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    {selectedOrderForPacking.id || selectedOrderForPacking.orderId}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {selectedOrderForPacking.status || 'To Pack'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                  Customer: {selectedOrderForPacking.customerName || selectedOrderForPacking.customer}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Branch ID: <b className="font-mono text-slate-700 dark:text-slate-300">{staffBranchId}</b> ({staffBranch.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPacking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Picking Progress Bar */}
            {(() => {
              const orderId = selectedOrderForPacking.id || selectedOrderForPacking.orderId;
              const items = Array.isArray(selectedOrderForPacking.items) && selectedOrderForPacking.items.length > 0 && typeof selectedOrderForPacking.items[0] === 'object'
                ? selectedOrderForPacking.items
                : Array.isArray(selectedOrderForPacking.orderItems) && selectedOrderForPacking.orderItems.length > 0
                ? selectedOrderForPacking.orderItems
                : Array.isArray(selectedOrderForPacking.rawItems) && selectedOrderForPacking.rawItems.length > 0
                ? selectedOrderForPacking.rawItems
                : [{ name: typeof selectedOrderForPacking.items === 'string' ? selectedOrderForPacking.items : 'Grocery Item', quantity: 1 }];
              const pickedList = pickedState[orderId] || [];
              const pickPercent = items.length > 0 ? Math.round((pickedList.length / items.length) * 100) : 100;
              const isAllPicked = pickedList.length === items.length && items.length > 0;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>
                      Picking Items: <b className="font-mono text-emerald-600">{pickedList.length}/{items.length}</b> ({pickPercent}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePickAll(orderId, items.length)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                    >
                      {isAllPicked ? 'Uncheck All' : 'Check All Items'}
                    </button>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${pickPercent}%` }}
                    />
                  </div>

                  {/* Checklist of Items */}
                  <div className="overflow-y-auto max-h-60 space-y-1.5 pt-2">
                    {items.map((item, idx) => {
                      const isPicked = pickedList.includes(idx);
                      const name = item.name || item.productName || 'Grocery Item';
                      const icon = getItemIcon(name);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItemPick(orderId, idx)}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                            isPicked
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-lg">{icon}</span>
                            <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">
                              {item.quantity || 1}x
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${isPicked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {name}
                              </p>
                              {item.isSubstituted && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                                  Substituted: {item.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isPicked && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenSubstitution(e, selectedOrderForPacking, item, idx)}
                                className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-lg hover:bg-amber-100 cursor-pointer"
                              >
                                Substitute
                              </button>
                            )}
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isPicked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isPicked && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPacking(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePackItems(selectedOrderForPacking, items.length)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Package className="w-4 h-4" />
                      <span>Pack & Seal Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkReadyForDispatch(selectedOrderForPacking)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready for Delivery</span>
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* =========================================================================
          SMART PRODUCT SUBSTITUTION MODAL
          ========================================================================= */}
      {substitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Product Substitution</h3>
                  <p className="text-[11px] text-slate-500">Item Unavailable at {staffBranch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubstitutionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-2.5 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Out of Stock</span>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                {substitutionModal.item.name || substitutionModal.item.productName}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Qty: {substitutionModal.item.quantity || 1} &bull; {currency} {substitutionModal.item.price}
              </p>
            </div>

            {/* Alternatives */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Available Substitutes:</span>
              {modalSubstitutes.length > 0 ? (
                modalSubstitutes.map((cand) => {
                  const isSelected = selectedAlternative?.id === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedAlternative(cand)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={cand.image} alt={cand.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{cand.name}</p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{currency} {cand.price}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 p-2 text-center">No automatic alternatives found.</p>
              )}
            </div>

            <input
              type="text"
              value={substitutionReason}
              onChange={(e) => setSubstitutionReason(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="Reason (Customer approved substitution)"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubstitutionModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedAlternative}
                onClick={handleConfirmSubstitution}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Substitute
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 📱 MOBILE BOTTOM QUICK-SWITCH BAR (< md screens) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0b132b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-around py-1.5 px-2 shadow-lg safe-bottom"
      >
        <button
          type="button"
          onClick={() => setActiveNav('Dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeNav === 'Dashboard'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('Assigned Orders')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition cursor-pointer ${
            activeNav === 'Assigned Orders'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {kpiCounts.assigned > 0 && (
            <span className="absolute top-0 right-1 px-1 min-w-[14px] h-3.5 bg-emerald-700 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {kpiCounts.assigned}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Assigned</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('Packed Orders')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition cursor-pointer ${
            activeNav === 'Packed Orders'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          {kpiCounts.packed > 0 && (
            <span className="absolute top-0 right-1 px-1 min-w-[14px] h-3.5 bg-blue-700 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {kpiCounts.packed}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Packed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('Ready for Delivery')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition cursor-pointer ${
            activeNav === 'Ready for Delivery'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          {kpiCounts.ready > 0 && (
            <span className="absolute top-0 right-1 px-1 min-w-[14px] h-3.5 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {kpiCounts.ready}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Ready</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-medium transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

    </div>
  );
};
