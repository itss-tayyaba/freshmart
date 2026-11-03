import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Bike,
  Package,
  PackageCheck,
  Truck,
  Wallet,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  MapPin,
  ExternalLink,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Store,
  RefreshCw,
  Search,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Copy,
  Power,
  Bell,
  BellOff,
  Lock,
  DollarSign,
  Shield,
  KeyRound,
  RotateCcw,
  CheckCircle,
  XCircle,
  Receipt,
  Radio,
  Smartphone
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';
import { isSameTenant } from '../../data/companyHierarchyData';
import { isOrderVisibleToUser, isOrderAssignedToRider } from '../../utils/orderScope';
import {
  normalizeWhatsAppPhone,
  buildWhatsAppDeliveryMessage,
  getWhatsAppDeliveryLink,
  getWhatsAppEnRouteLink
} from '../../utils/whatsappHelper';
import { getStoreTheme } from '../../utils/storeTheme';
import { switchMapTileLayer } from '../../utils/mapTiles';

// Custom Leaflet SVG Markers for reliable Vite asset rendering
const createPickupPin = (label = 'Store') =>
  L.divIcon({
    className: 'custom-pickup-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 34px; height: 34px; border-radius: 9999px; background: #b45309; border: 3px solid #ffffff; box-shadow: 0 8px 16px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
        <div style="margin-top: 3px; padding: 2px 7px; border-radius: 9999px; background: #78350f; color: #fef3c7; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44]
  });

const createDropoffPin = (customerName = 'Customer') =>
  L.divIcon({
    className: 'custom-dropoff-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: -2px; width: 36px; height: 36px; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 8px 16px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 3px; padding: 2px 7px; border-radius: 9999px; background: #1e3a8a; color: #eff6ff; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${customerName}
        </div>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44]
  });

const createRiderPin = () =>
  L.divIcon({
    className: 'custom-rider-live-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: -3px; width: 40px; height: 40px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 38px; height: 38px; border-radius: 9999px; background: #059669; border: 3px solid #ffffff; box-shadow: 0 10px 18px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <span style="font-size: 19px; line-height: 1;">🛵</span>
        </div>
        <div style="margin-top: 3px; padding: 2px 8px; border-radius: 9999px; background: #064e3b; color: #a7f3d0; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
          LIVE COURIER
        </div>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });

// Safely extract item objects array from any order representation (handles array or string or missing)
const resolveOrderItemsList = (ord) => {
  if (!ord) return [];
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) return ord.rawItems;
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) return ord.orderItems;
  if (Array.isArray(ord.items) && ord.items.length > 0) return ord.items;
  if (Array.isArray(ord.itemsList) && ord.itemsList.length > 0) return ord.itemsList;
  if (typeof ord.items === 'string' && ord.items.trim()) {
    return [{ name: ord.items, quantity: 1, price: ord.totalAmount || ord.total || ord.totalPrice || 0 }];
  }
  return [];
};

export const DeliveryPortal = () => {
  const {
    user,
    adminRole,
    riders = [],
    customerOrders = [],
    adminOrders = [],
    setCustomerOrders,
    setAdminOrders,
    assignRiderToOrder,
    updateRiderLiveLocation,
    verifyOrderDeliveryOtp,
    updateRiderOnlineStatus,
    updateRiderPushToken,
    updateRiderPassword,
    acceptRiderOrder,
    rejectRiderOrder,
    confirmOrderStorePickup,
    settleRiderCashCollection,
    currency = 'Rs.',
    addToast,
    navigateTo,
    currentTenant,
    switchAdminPortal,
    adminLogout,
    logoutAdmin
  } = useStore();

  // Currency Formatter - Guarantee no [object Object] leaks
  const currencySymbol = useMemo(() => {
    if (typeof currency === 'string') return currency.trim();
    if (currency && typeof currency.symbol === 'string') return currency.symbol.trim();
    return 'Rs.';
  }, [currency]);

  const formatPrice = (amount) => {
    const num = Number(amount || 0);
    if (currencySymbol === '$') {
      return `$${num.toFixed(2)}`;
    }
    return `${currencySymbol} ${num.toLocaleString()}`;
  };

  // Active navigation tab: 'out-for-delivery' | 'delivered-today' | 'earnings'
  const [activeTab, setActiveTab] = useState('out-for-delivery');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hasAutoSwitchedRef = useRef(false);

  // Synthesized Dispatch Chime (Crystal Clear Courier Audio Chime via Web Audio API)
  const playDispatchChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.14); // A5
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch (e) {}
  };

  // Push Notification state & setup
  const [notifPermission, setNotifPermission] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      addToast('Notifications Unsupported ⚠️', 'Your browser does not support web notifications.', 'error');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        const token = `webpush_${activeRider?.id || 'rdr'}_${Date.now().toString(36)}`;
        if (typeof updateRiderPushToken === 'function' && activeRider?.id) {
          await updateRiderPushToken(activeRider.id, token);
        }
        playDispatchChime();
        new Notification('Push Notifications Active 🔔', {
          body: 'You will receive instant alerts for new grocery dispatch orders.',
          icon: '/favicon.ico'
        });
        addToast('Push Notifications Active 🔔', 'Instant dispatch alerts enabled.');
      } else {
        addToast('Permission Denied', 'Browser notification permission was denied.', 'info');
      }
    } catch (e) {}
  };

  // Real Phone GPS Telemetry State (Accuracy, Speed, Heading)
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsSpeed, setGpsSpeed] = useState(null);
  const [gpsHeading, setGpsHeading] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsLastSyncTime, setGpsLastSyncTime] = useState(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const riderId = activeRider?.id || user?.riderId || user?.id;
      const res = await updateRiderPassword(riderId, oldPasswordInput, newPasswordInput);
      if (res?.success) {
        setPasswordSuccess('Password successfully updated! 🔐');
        setTimeout(() => {
          setShowPasswordModal(false);
          setOldPasswordInput('');
          setNewPasswordInput('');
          setConfirmPasswordInput('');
          setPasswordSuccess('');
        }, 1500);
      } else {
        setPasswordError(res?.error || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Decline Order Modal State
  const [decliningOrder, setDecliningOrder] = useState(null);
  const [declineReason, setDeclineReason] = useState('Courier busy / off route');

  // Cashier Settlement State & Modal
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementRecords, setSettlementRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_rider_settlements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Active selected courier rider (Ahmad Khan / logged in courier)
  const currentRider = useMemo(() => {
    // 1. If currently signed in as a rider
    if (user && (user.role === 'rider' || adminRole === 'rider')) {
      const matched = (riders || []).find((r) => r.id === user.riderId || r.username === user.username || r.name === user.name);
      if (matched) {
        return matched;
      }
      return {
        id: user.riderId || user.id || 'RDR-CURRENT',
        name: user.name || 'Delivery Courier',
        zone: user.branchName || 'Local Delivery Zone',
        branchId: user.branchId,
        branchName: user.branchName || 'Main Hub',
        phone: user.phone || '',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'LEK-2301',
        rating: 5.0,
        status: 'Active',
        tenantId: user.tenantId
      };
    }

    // 2. If viewing as admin / superadmin, match a rider for the active tenant
    const targetTenant = (user?.role !== 'superadmin' && user?.tenantId)
      ? user.tenantId
      : (currentTenant?.id || user?.tenantId);
    if (riders && riders.length > 0) {
      const tenantMatch = riders.find((r) => isSameTenant(r.tenantId, targetTenant));
      if (tenantMatch) {
        return tenantMatch;
      }
      return riders[0];
    }

    return null;
  }, [user, adminRole, riders, currentTenant]);

  // Active courier is the authenticated/assigned rider profile
  const activeRider = currentRider;

  // Rider Online / Offline status (Interactive On-Duty vs Off-Duty toggle)
  const isRiderOnline = useMemo(() => {
    if (!activeRider) return true;
    const s = String(activeRider.status || '').toLowerCase();
    if (s === 'offline' || s === 'off-duty') return false;
    if (activeRider.isOnline === false) return false;
    return true;
  }, [activeRider]);

  const handleToggleOnlineStatus = async () => {
    const nextOnline = !isRiderOnline;
    const riderId = activeRider?.id || user?.riderId || user?.id;
    if (typeof updateRiderOnlineStatus === 'function' && riderId) {
      await updateRiderOnlineStatus(riderId, nextOnline);
    }
    addToast(
      nextOnline ? 'You are now Online 🟢' : 'You are now Offline ⚪',
      nextOnline
        ? 'On-Duty: Ready to accept order dispatches and track live deliveries.'
        : 'Off-Duty: You will not receive new order assignments until you go back online.',
      nextOnline ? 'success' : 'info'
    );
  };


  // Locally tracked completed orders to ensure immediate instant transition (persisted in localStorage)
  const [locallyCompletedOrders, setLocallyCompletedOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_rider_delivered_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_rider_delivered_orders', JSON.stringify(locallyCompletedOrders));
    } catch (e) {}
  }, [locallyCompletedOrders]);

  // Real-time synchronization across browser tabs (when store admin assigns a parcel in Admin tab)
  useEffect(() => {
    const handleStorageOrderSync = () => {
      try {
        const rawAdmin = localStorage.getItem('freshmart_admin_orders');
        if (rawAdmin && typeof setAdminOrders === 'function') {
          const parsed = JSON.parse(rawAdmin);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAdminOrders((prev) => {
              const sigPrev = (prev || []).map((o) => `${o.id}_${o.status}_${o.assignedRider?.id || o.assignedRider?.name || ''}`).join(',');
              const sigNext = parsed.map((o) => `${o.id}_${o.status}_${o.assignedRider?.id || o.assignedRider?.name || ''}`).join(',');
              return sigPrev === sigNext ? prev : parsed;
            });
          }
        }
        const rawCust = localStorage.getItem('freshmart_customer_orders');
        if (rawCust && typeof setCustomerOrders === 'function') {
          const parsed = JSON.parse(rawCust);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomerOrders((prev) => {
              const sigPrev = (prev || []).map((o) => `${o.id}_${o.status}_${o.assignedRider?.id || o.assignedRider?.name || ''}`).join(',');
              const sigNext = parsed.map((o) => `${o.id}_${o.status}_${o.assignedRider?.id || o.assignedRider?.name || ''}`).join(',');
              return sigPrev === sigNext ? prev : parsed;
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageOrderSync);
    window.addEventListener('focus', handleStorageOrderSync);
    window.addEventListener('freshmart_orders_updated', handleStorageOrderSync);
    return () => {
      window.removeEventListener('storage', handleStorageOrderSync);
      window.removeEventListener('focus', handleStorageOrderSync);
      window.removeEventListener('freshmart_orders_updated', handleStorageOrderSync);
    };
  }, [setAdminOrders, setCustomerOrders]);

  // Combined system orders scoped to store tenant (excluding any mock demo parcels)
  const allOrdersList = useMemo(() => {
    // Put adminOrders first so admin assignments and statuses take priority, then merge customerOrders
    const combined = [...(adminOrders || []), ...(customerOrders || [])];
    const uniqueMap = new Map();
    const activeTenantId = (user?.role !== 'superadmin' && user?.tenantId)
      ? user.tenantId
      : (currentTenant?.id || user?.tenantId || 'tenant-alfatah');

    combined.forEach((ord) => {
      if (!ord) return;
      const key = ord.id || ord.orderId || ord._id;
      if (!key) return;
      const bareKey = String(key).replace(/^#/, '').trim().toLowerCase();
      if (bareKey.includes('demo') || ord.branchId === 'branch_demo') return;

      const isOrdDelivered =
        ['delivered', 'completed'].includes(String(ord.status || '').toLowerCase()) ||
        Boolean(ord.isDelivered) ||
        locallyCompletedOrders.some((id) => String(id).replace(/^#/, '').toLowerCase().trim() === bareKey);

      const existing = uniqueMap.get(bareKey);
      if (!existing) {
        uniqueMap.set(bareKey, {
          ...ord,
          ...(isOrdDelivered ? { status: 'Delivered', isDelivered: true, fulfillmentStage: Math.max(Number(ord.fulfillmentStage || 0), 4) } : {})
        });
      } else {
        const isExistingDelivered =
          ['delivered', 'completed'].includes(String(existing.status || '').toLowerCase()) ||
          Boolean(existing.isDelivered);
        const isMergedDelivered = isOrdDelivered || isExistingDelivered;

        const merged = {
          ...existing,
          ...ord,
          // Retain assigned rider from whichever record has it
          assignedRider: ord.assignedRider || existing.assignedRider,
          pickupStaffName: ord.pickupStaffName || existing.pickupStaffName,
          pickupStaffId: ord.pickupStaffId || existing.pickupStaffId,
          tenantId: ord.tenantId || existing.tenantId,
          companyId: ord.companyId || existing.companyId,
          status: isMergedDelivered ? 'Delivered' : (ord.status || existing.status),
          isDelivered: isMergedDelivered,
          fulfillmentStage: Math.max(Number(ord.fulfillmentStage || 0), Number(existing.fulfillmentStage || 0), isMergedDelivered ? 4 : 0),
          deliveredAt: ord.deliveredAt || existing.deliveredAt || (isMergedDelivered ? (existing.deliveredAt || new Date().toISOString()) : null)
        };
        uniqueMap.set(bareKey, merged);
      }
    });

    const rawList = Array.from(uniqueMap.values());

    return rawList.filter((o) => {
      if (o.branchId === 'branch_demo') return false;
      const courier = user || activeRider;
      // If the parcel is directly assigned to this courier, it is ALWAYS visible in their dashboard!
      if (isOrderAssignedToRider(o, courier)) return true;
      return isOrderVisibleToUser(o, courier, activeTenantId);
    });
  }, [customerOrders, adminOrders, user?.tenantId, currentTenant?.id, locallyCompletedOrders, activeRider, user]);

  // Orders specifically assigned to this courier (both active run and delivered today)
  const assignedOrders = useMemo(() => {
    const courier = activeRider || user;
    const currentRiderId = courier?.id || courier?.riderId || 'RDR-ALFATAH';
    const currentName = (courier?.name || 'Ahmad Khan').toLowerCase().trim();

    return allOrdersList.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'cancelled') return false;

      // 1. Direct assignment match via centralized helper
      if (isOrderAssignedToRider(o, courier)) return true;

      const rObj = o.assignedRider;
      const rId = typeof rObj === 'object'
        ? (rObj?.id || rObj?._id || rObj?.riderId || o.riderId)
        : (typeof rObj === 'string' && rObj.startsWith('RDR') ? rObj : null);

      const rName = (
        typeof rObj === 'string'
          ? rObj
          : (rObj?.name || o.assignedRiderName || o.riderName || '')
      ).toLowerCase().trim();

      const idMatches = Boolean(
        rId && (
          rId === currentRiderId ||
          rId === courier?.id ||
          (String(rId).toLowerCase().includes('alfatah') && String(currentRiderId).toLowerCase().includes('alfatah'))
        )
      );

      const nameMatches = Boolean(
        (currentName && rName && (
          rName === currentName ||
          rName.includes(currentName) ||
          currentName.includes(rName) ||
          (rName.includes('ahmad') && currentName.includes('ahmad'))
        )) ||
        (rName.includes('ahmad') && (currentName.includes('ahmad') || !currentName))
      );

      const bareId = String(o.id || o.orderId || o._id || '').replace(/^#/, '').toLowerCase().trim();
      const isLocallyCompleted = locallyCompletedOrders.some(
        (savedId) => String(savedId).replace(/^#/, '').toLowerCase().trim() === bareId
      );

      // If the order is delivered/completed, check if it was assigned to Ahmad or in Al-Fatah
      const isDeliveredOrder = s === 'delivered' || s === 'completed' || Boolean(o.isDelivered);
      const isTenantRiderMatch = isDeliveredOrder && (nameMatches || idMatches || rName.includes('ahmad') || !rName);

      return idMatches || nameMatches || isLocallyCompleted || isTenantRiderMatch;
    });
  }, [allOrdersList, activeRider, user, locallyCompletedOrders]);

  // Live timer tick for estimated preparation countdown
  const [prepClock, setPrepClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setPrepClock(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const getPrepTimeInfo = (ord) => {
    const startTs = ord.preparingStartedAt
      ? new Date(ord.preparingStartedAt).getTime()
      : (ord.createdAt ? new Date(ord.createdAt).getTime() : Date.now());
    const estMins = Number(ord.prepEstimatedMinutes || 10);
    const elapsedMs = Math.max(0, prepClock - startTs);
    const totalMs = estMins * 60 * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    return {
      remainingMins,
      formatted: remainingMs <= 0 ? 'Ready any moment (< 1m)' : `~${remainingMins} mins left`,
      isReadyAnyMoment: remainingMs <= 0
    };
  };

  // Orders currently being packed / prepared by pickup staff in this store
  const preparingOrders = useMemo(() => {
    return allOrdersList.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'cancelled' || s === 'delivered' || s === 'completed' || o.isDelivered) return false;
      const isPreparing =
        ['preparing', 'picking', 'deliver to staff', 'delivered to staff', 'received by pickup staff'].includes(s) ||
        o.pickupStep === 'picking' ||
        o.pickupStep === 'received';
      const isDispatched = o.isDispatchedByStaff || o.isDispatched || s === 'ready for dispatch' || s === 'ready';
      const isAlreadyAssigned = Boolean(o.assignedRider && (o.assignedRider.id || o.assignedRider.name));
      return isPreparing && !isDispatched && !isAlreadyAssigned;
    });
  }, [allOrdersList]);

  // Orders packed & ready for dispatch in this store, waiting for courier acceptance or admin assignment
  const readyForDispatchOrders = useMemo(() => {
    return allOrdersList.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'cancelled' || s === 'delivered' || s === 'completed' || o.isDelivered) return false;
      const isReady =
        o.isDispatchedByStaff ||
        ['ready', 'ready for dispatch', 'ready(dispatched)', 'packed'].includes(s) ||
        o.pickupStep === 'verified' ||
        o.pickupStep === 'packed';
      const isAlreadyAssigned = Boolean(o.assignedRider && (o.assignedRider.id || o.assignedRider.name));
      return isReady && !isAlreadyAssigned;
    });
  }, [allOrdersList]);

  // Combined orders for portal display (strictly real assigned orders, no hardcoded baseline orders)
  const portalOrders = useMemo(() => {
    return assignedOrders.map((o) => {
      const resolvedId = String(o.id || o.orderId || o._id || '').trim();
      const bareId = resolvedId.replace(/^#/, '');
      const hashedId = bareId ? `#${bareId}` : resolvedId;
      const isLocallyDone = locallyCompletedOrders.some(
        (id) => String(id).replace(/^#/, '').toLowerCase().trim() === bareId.toLowerCase()
      );
      const s = String(o.status || '').toLowerCase();
      const isStatusDelivered = s === 'delivered' || s === 'completed' || Boolean(o.isDelivered);
      
      let finalStatus = 'Assigned to Rider';
      if (isLocallyDone || isStatusDelivered) {
        finalStatus = 'Delivered';
      } else if (s === 'out for delivery' || Boolean(o.pickedUpAt)) {
        finalStatus = 'Out for Delivery';
      } else if (s === 'accepted (heading to store)' || s === 'accepted' || s === 'heading to store' || o.riderAccepted === true) {
        finalStatus = 'Accepted (Heading to Store)';
      } else if (s === 'assigned to rider' || s === 'assigned' || o.dispatchStatus === 'assigned') {
        finalStatus = 'Assigned to Rider';
      } else {
        finalStatus = o.status || 'Assigned to Rider';
      }

      const finalOtp = String(o.deliveryOtp || '7412');

      const shipping = o.shippingAddress || {};
      let rawAddr = typeof shipping === 'string' ? shipping : (shipping.address || o.address || 'Peoples Colony No. 1, Faisalabad');
      let rawCity = typeof shipping === 'object' ? (shipping.city || o.city) : (o.city || 'Faisalabad');
      if (String(rawAddr).toLowerCase().includes('gulberg') || String(rawCity).toLowerCase().includes('lahore')) {
        rawAddr = 'DIGITALSOFTS, Peoples Colony No. 1, Faisalabad';
        rawCity = 'Faisalabad';
      }

      return {
        ...o,
        status: finalStatus,
        fulfillmentStage: (isLocallyDone || isStatusDelivered) ? 7 : (o.fulfillmentStage || 6),
        isDelivered: isLocallyDone || isStatusDelivered || false,
        deliveredAt: o.deliveredAt || (isLocallyDone ? new Date().toISOString() : null),
        id: bareId || resolvedId,
        orderId: o.orderId || hashedId || resolvedId,
        _id: o._id || bareId,
        customerName: o.customer?.name || o.shippingAddress?.fullName || o.customerName || o.customer || 'Customer',
        customerPhone: o.customer?.phone || o.shippingAddress?.phone || o.customerPhone || o.phone || '+92 320 6551696',
        address: rawAddr,
        shippingAddress: {
          ...(typeof shipping === 'object' ? shipping : {}),
          address: rawAddr,
          city: rawCity
        },
        city: rawCity,
        region: rawCity === 'Faisalabad' ? 'Peoples Colony No. 1 (Faisalabad)' : rawCity,
        deliveryOtp: finalOtp,
        notes: o.notes || o.deliveryNotes || 'Standard Parcel Delivery. Handle grocery bags with care.',
        itemsList: resolveOrderItemsList(o)
      };
    });
  }, [assignedOrders, locallyCompletedOrders, activeRider]);

  // Total Cash on Delivery to collect across active parcel run
  const totalCodAmount = useMemo(() => {
    return portalOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s !== 'delivered' && s !== 'completed' && !o.isDelivered;
    }).reduce((sum, ord) => {
      const pm = String(ord.paymentMethod || '').toLowerCase();
      const isCod = !pm || pm.includes('cash') || pm.includes('cod') || pm.includes('delivery');
      return isCod ? sum + Number(ord.totalAmount || ord.total || ord.totalPrice || 0) : sum;
    }, 0);
  }, [portalOrders]);

  // 1. Pending Courier Acceptance (admin assigned, awaiting courier Accept or Reject)
  const pendingAcceptanceOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'delivered' || s === 'completed' || o.isDelivered) return false;
      return (
        s === 'assigned to rider' ||
        s === 'assigned' ||
        o.dispatchStatus === 'assigned' ||
        o.riderAccepted === false
      );
    });
  }, [portalOrders]);

  // 2. Heading to Store for Pickup (accepted by rider, travelling to store dispatch counter)
  const headingToStoreOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'delivered' || s === 'completed' || o.isDelivered) return false;
      const isPending = s === 'assigned to rider' || s === 'assigned' || o.dispatchStatus === 'assigned' || o.riderAccepted === false;
      if (isPending) return false;
      return (
        s === 'accepted (heading to store)' ||
        s === 'accepted' ||
        s === 'heading to store' ||
        (o.riderAccepted === true && !o.pickedUpAt && s !== 'out for delivery')
      );
    });
  }, [portalOrders]);

  // 3. Out for Delivery Orders (physically picked up from store, on route to customer doorstep)
  const outForDeliveryOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const bare = String(o.id || o.orderId || '').replace(/^#/, '').toLowerCase().trim();
      const s = String(o.status || '').toLowerCase();
      const isDelivered =
        s === 'delivered' ||
        s === 'completed' ||
        Boolean(o.isDelivered) ||
        locallyCompletedOrders.some((id) => String(id).replace(/^#/, '').toLowerCase().trim() === bare);
      if (isDelivered) return false;

      const isPending = s === 'assigned to rider' || s === 'assigned' || o.dispatchStatus === 'assigned' || o.riderAccepted === false;
      const isHeading = s === 'accepted (heading to store)' || s === 'accepted' || s === 'heading to store' || (o.riderAccepted === true && !o.pickedUpAt && s !== 'out for delivery');
      if (isPending || isHeading) return false;

      return s === 'out for delivery' || Boolean(o.pickedUpAt);
    });
  }, [portalOrders, locallyCompletedOrders]);

  // 4. Delivered Today Orders (verified doorstep handovers)
  const deliveredTodayOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const bare = String(o.id || o.orderId || '').replace(/^#/, '').toLowerCase().trim();
      const s = String(o.status || '').toLowerCase();
      const isDelivered =
        s === 'delivered' ||
        s === 'completed' ||
        Boolean(o.isDelivered) ||
        locallyCompletedOrders.some((id) => String(id).replace(/^#/, '').toLowerCase().trim() === bare);
      return isDelivered;
    });
  }, [portalOrders, locallyCompletedOrders]);

  // Total active parcels requiring courier action
  const activeOrdersCount = pendingAcceptanceOrders.length + headingToStoreOrders.length + outForDeliveryOrders.length;

  // Active delivery in transit (first out-for-delivery order, or first heading to store)
  const activeOrder = outForDeliveryOrders[0] || headingToStoreOrders[0] || null;

  // Accept / Reject / Pickup Handlers
  const handleAcceptIncomingOrder = async (order) => {
    if (!isRiderOnline) {
      addToast('You are Offline ⚠️', 'Please toggle Online (On-Duty) first to accept delivery assignments.', 'error');
      return;
    }
    const rawId = order.id || order.orderId;
    const bareId = String(rawId).replace(/^#/, '');
    if (typeof acceptRiderOrder === 'function') {
      await acceptRiderOrder(rawId, activeRider.id);
    }
    playDispatchChime();
    addToast('Assignment Accepted 🛵', `Accepted Order #${bareId}! Head to store for parcel pickup.`);
  };

  const handleOpenDeclineModal = (order) => {
    setDecliningOrder(order);
  };

  const handleConfirmDecline = async () => {
    if (!decliningOrder) return;
    const rawId = decliningOrder.id || decliningOrder.orderId;
    const bareId = String(rawId).replace(/^#/, '');
    if (typeof rejectRiderOrder === 'function') {
      await rejectRiderOrder(rawId, activeRider.id, declineReason);
    }
    addToast('Order Declined ↩️', `Order #${bareId} returned to store dispatch pool.`);
    setDecliningOrder(null);
  };

  const handleConfirmStorePickup = async (order) => {
    const rawId = order.id || order.orderId;
    const bareId = String(rawId).replace(/^#/, '');
    if (typeof confirmOrderStorePickup === 'function') {
      await confirmOrderStorePickup(rawId, activeRider.id);
    }
    playDispatchChime();
    addToast('Parcel Picked Up! 📦', `Order #${bareId} picked up from store. Now Out for Delivery to doorstep.`);
  };

  // Courier Parcel Acceptance (When pickup staff packs parcel and stages for dispatch)
  const handleAcceptDispatchOrder = async (order) => {
    if (!isRiderOnline) {
      addToast('You are Offline ⚠️', 'Please toggle Online first to accept dispatch parcels.', 'error');
      return;
    }
    const rawId = order.id || order.orderId;
    const bareId = String(rawId).replace(/^#/, '');
    if (typeof assignRiderToOrder === 'function') {
      await assignRiderToOrder(rawId, activeRider.id, 'Accepted (Heading to Store)', true);
    } else {
      const otp = order.deliveryOtp || '7412';
      const updated = {
        ...order,
        assignedRider: {
          id: activeRider.id,
          name: activeRider.name,
          phone: activeRider.phone,
          vehicle: activeRider.vehicleNumber || activeRider.vehicleType,
          zone: activeRider.zone
        },
        status: 'Accepted (Heading to Store)',
        isDispatched: true,
        dispatchStatus: 'assigned',
        fulfillmentStage: 4,
        deliveryOtp: otp
      };
      if (typeof setCustomerOrders === 'function') {
        setCustomerOrders((prev) => prev.map((o) => (o.id === rawId || o.orderId === rawId || o.id === bareId ? updated : o)));
      }
      if (typeof setAdminOrders === 'function') {
        setAdminOrders((prev) => prev.map((o) => (o.id === rawId || o.orderId === rawId || o.id === bareId ? updated : o)));
      }
    }
    playDispatchChime();
    addToast('Parcel Accepted 🛵', `Order #${bareId} accepted! Proceed to store pickup desk.`);
  };

  // Earnings & Cash-on-Delivery (COD) Ledger Calculations
  const codDeliveredOrders = useMemo(() => {
    return deliveredTodayOrders.filter((o) => {
      const pm = String(o.paymentMethod || '').toLowerCase();
      return !pm || pm.includes('cash') || pm.includes('cod') || pm.includes('delivery');
    });
  }, [deliveredTodayOrders]);

  const prepaidDeliveredOrders = useMemo(() => {
    return deliveredTodayOrders.filter((o) => {
      const pm = String(o.paymentMethod || '').toLowerCase();
      return pm.includes('card') || pm.includes('easypaisa') || pm.includes('jazzcash') || pm.includes('online') || pm.includes('prepaid') || pm.includes('wallet') || pm.includes('debit');
    });
  }, [deliveredTodayOrders]);

  const totalCodCollectedToday = useMemo(() => {
    return codDeliveredOrders.reduce((sum, ord) => sum + Number(ord.totalAmount || ord.total || ord.totalPrice || 0), 0);
  }, [codDeliveredOrders]);

  const totalPrepaidCollectedToday = useMemo(() => {
    return prepaidDeliveredOrders.reduce((sum, ord) => sum + Number(ord.totalAmount || ord.total || ord.totalPrice || 0), 0);
  }, [prepaidDeliveredOrders]);

  const totalSettledWithCashier = useMemo(() => {
    return settlementRecords
      .filter((s) => !s.riderId || s.riderId === activeRider?.id)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }, [settlementRecords, activeRider?.id]);

  const netCashInHand = useMemo(() => {
    return Math.max(0, totalCodCollectedToday - totalSettledWithCashier);
  }, [totalCodCollectedToday, totalSettledWithCashier]);

  const tripBaseFee = 150;
  const totalTripEarningsToday = useMemo(() => {
    return deliveredTodayOrders.length * tripBaseFee;
  }, [deliveredTodayOrders.length]);

  const totalTipsToday = useMemo(() => {
    return deliveredTodayOrders.reduce((sum, o) => sum + Number(o.tipAmount || 0), 0);
  }, [deliveredTodayOrders]);

  const totalRiderEarningsToday = totalTripEarningsToday + totalTipsToday;

  const handleConfirmCashierSettlement = () => {
    if (netCashInHand <= 0) {
      addToast('No Pending Cash', 'You have no pending cash-on-delivery collections to settle.', 'info');
      setSettlementModalOpen(false);
      return;
    }
    const orderIds = codDeliveredOrders.map((o) => o.id || o.orderId);
    const rec = settleRiderCashCollection(activeRider?.id, orderIds, netCashInHand);
    setSettlementRecords((prev) => [rec, ...prev]);
    setSettlementModalOpen(false);
  };

  // Proactive New Assignment Watcher (Plays audio chime and emits push notification on incoming order)
  const prevAssignedOrderIdsRef = useRef(new Set());
  useEffect(() => {
    const currentAssignedIds = new Set(
      assignedOrders.map((o) => String(o.id || o.orderId || '').toLowerCase().trim())
    );
    for (const id of currentAssignedIds) {
      if (prevAssignedOrderIdsRef.current.size > 0 && !prevAssignedOrderIdsRef.current.has(id)) {
        const newOrder = assignedOrders.find((o) => String(o.id || o.orderId || '').toLowerCase().trim() === id);
        const s = String(newOrder?.status || '').toLowerCase();
        if (s !== 'delivered' && s !== 'completed' && !newOrder?.isDelivered) {
          playDispatchChime();
          if (navigator.vibrate) {
            try { navigator.vibrate([200, 100, 200]); } catch (e) {}
          }
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('⚡ New Delivery Assignment!', {
                body: `Order #${newOrder?.orderId || newOrder?.id} (${newOrder?.customerName || 'Customer'}) - ${formatPrice(newOrder?.totalAmount)}`,
                icon: '/favicon.ico'
              });
            } catch (e) {}
          }
        }
      }
    }
    prevAssignedOrderIdsRef.current = currentAssignedIds;
  }, [assignedOrders]);

  // OTP form state per order
  const [otpInputs, setOtpInputs] = useState({});
  const [verifyingOrderMap, setVerifyingOrderMap] = useState({});

  // WhatsApp delivery notification state & auto-launch preference
  const [deliveredOrderForWhatsApp, setDeliveredOrderForWhatsApp] = useState(null);
  const [copiedMessageFeedback, setCopiedMessageFeedback] = useState(false);
  const [customWhatsAppNote, setCustomWhatsAppNote] = useState('');
  const [autoOpenWhatsAppOnDeliver, setAutoOpenWhatsAppOnDeliver] = useState(() => {
    try {
      return localStorage.getItem('freshmart_rider_auto_whatsapp') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleOtpInputChange = (orderId, value) => {
    const raw = String(orderId || '').trim();
    const bare = raw.replace(/^#/, '');
    setOtpInputs((prev) => ({
      ...prev,
      [raw]: value,
      [bare]: value,
      [`#${bare}`]: value
    }));
  };

  // OTP Verification Handler - Courier enters customer's 4-digit PIN upon arrival
  const handleVerifyOtp = async (orderId, targetExpectedOtp) => {
    const rawId = String(orderId || '').trim();
    const bareId = rawId.replace(/^#/, '');
    const entered = (
      otpInputs[rawId] ||
      otpInputs[bareId] ||
      otpInputs[`#${bareId}`] ||
      ''
    ).trim();

    if (!entered) {
      addToast('PIN Required 🔑', 'Please ask the customer for their 4-digit handover PIN and enter it here.', 'error');
      return;
    }

    setVerifyingOrderMap((prev) => ({ ...prev, [rawId]: true, [bareId]: true }));
    try {
      const res = await verifyOrderDeliveryOtp(bareId || rawId, entered, activeRider?.id, targetExpectedOtp);
      if (res && res.success) {
        const deliveredTime = new Date().toISOString();
        setLocallyCompletedOrders((prev) => {
          const next = Array.from(new Set([...prev, bareId, rawId, `#${bareId}`]));
          try {
            localStorage.setItem('freshmart_rider_delivered_orders', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        // Clear input keys
        setOtpInputs((prev) => ({ ...prev, [rawId]: '', [bareId]: '', [`#${bareId}`]: '' }));

        // Resolve delivered order record for WhatsApp notification
        const matched = portalOrders.find(
          (o) => String(o.id || o.orderId || '').replace(/^#/, '').toLowerCase().trim() === bareId.toLowerCase()
        ) || (activeOrder && String(activeOrder.id || activeOrder.orderId || '').replace(/^#/, '').toLowerCase().trim() === bareId.toLowerCase() ? activeOrder : null);

        const deliveredRecord = {
          ...(matched || {}),
          id: bareId,
          orderId: bareId,
          status: 'Delivered',
          isDelivered: true,
          deliveredAt: deliveredTime
        };

        setDeliveredOrderForWhatsApp(deliveredRecord);
        setCustomWhatsAppNote('');

        if (autoOpenWhatsAppOnDeliver) {
          try {
            const waLink = getWhatsAppDeliveryLink(deliveredRecord, activeRider);
            window.open(waLink, '_blank');
          } catch (err) {}
        }

        addToast('Delivery Confirmed 🎉', `Order #${bareId} verified and marked Delivered! WhatsApp receipt is ready.`);
      } else {
        const errMsg = res?.message || `Incorrect PIN "${entered}". Please ask the customer to confirm their 4-digit handover PIN.`;
        addToast('Verification Failed ❌', errMsg, 'error');
      }
    } catch (e) {
      addToast('Error', e.message || 'OTP verification failed', 'error');
    } finally {
      setVerifyingOrderMap((prev) => ({ ...prev, [rawId]: false, [bareId]: false }));
    }
  };

  // =========================================================================
  // Live GPS Telemetry & Live Location Sharing
  // =========================================================================
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [riderCoords, setRiderCoords] = useState(
    activeOrder?.pickupCoords || { lat: 31.4147, lng: 73.0872 }
  );

  const [mapViewMode, setMapViewMode] = useState('street'); // 'street' | 'satellite' | 'hybrid'
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastActiveOrderIdRef = useRef(null);
  const locationWatchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  const handleLayerChange = (layerKey) => {
    setMapViewMode(layerKey);
    if (mapInstanceRef.current) {
      switchMapTileLayer(mapInstanceRef.current, layerKey, tileLayerRef);
    }
  };

  // Initialize Leaflet Map once, then smoothly update markers without destroying the map (ZERO FLICKER)
  useEffect(() => {
    if (!mapContainerRef.current || !activeOrder) return;

    const pickup = activeOrder.pickupCoords || { lat: 31.4147, lng: 73.0872 };
    const dropoff = activeOrder.dropoffCoords || { lat: 31.4082, lng: 73.1023 };
    const currentPos = riderCoords || pickup;

    // IF map is not created yet, create it once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentPos.lat, currentPos.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      // Add Tile Layer
      switchMapTileLayer(map, mapViewMode, tileLayerRef);

      // Pickup Marker
      const pickupMarker = L.marker([pickup.lat, pickup.lng], {
        icon: createPickupPin(currentTenant?.name || 'Pickup Point')
      }).addTo(map);
      pickupMarker.bindPopup(`<b>${currentTenant?.name || 'Store'}</b><br/>Pickup Hub`);
      pickupMarkerRef.current = pickupMarker;

      // Drop-off Marker
      const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
        icon: createDropoffPin(activeOrder.customerName || 'Customer')
      }).addTo(map);
      dropoffMarker
        .bindPopup(`<b>${activeOrder.customerName}</b><br/>Exact drop-off pin`)
        .openPopup();
      dropoffMarkerRef.current = dropoffMarker;

      // Rider Live Position Marker
      const riderMarker = L.marker([currentPos.lat, currentPos.lng], {
        icon: createRiderPin(),
        zIndexOffset: 1000
      }).addTo(map);
      riderMarkerRef.current = riderMarker;

      // Route Polyline
      const routeCoords = [
        [pickup.lat, pickup.lng],
        [currentPos.lat, currentPos.lng],
        [dropoff.lat, dropoff.lng]
      ];
      const polyline = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);
      routePolylineRef.current = polyline;

      // Fit map bounds to encompass pickup, rider, and dropoff
      const bounds = L.latLngBounds([pickup, currentPos, dropoff]);
      map.fitBounds(bounds, { padding: [40, 40] });
      lastActiveOrderIdRef.current = activeOrder.id;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } else {
      // Map ALREADY exists! DO NOT RECREATE OR REMOVE!
      // If the active order changed, update marker positions and bounds smoothly
      if (lastActiveOrderIdRef.current !== activeOrder.id) {
        lastActiveOrderIdRef.current = activeOrder.id;

        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
        }
        if (dropoffMarkerRef.current) {
          dropoffMarkerRef.current.setLatLng([dropoff.lat, dropoff.lng]);
          dropoffMarkerRef.current.setPopupContent(`<b>${activeOrder.customerName}</b><br/>Exact drop-off pin`);
        }
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs([
            [pickup.lat, pickup.lng],
            [currentPos.lat, currentPos.lng],
            [dropoff.lat, dropoff.lng]
          ]);
        }

        const bounds = L.latLngBounds([pickup, currentPos, dropoff]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [activeOrder?.id, activeTab]);

  // Clean up map only on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Rider Marker on Live Coordinate Changes without flickering
  useEffect(() => {
    if (!riderCoords || !activeOrder) return;
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
    }
    if (routePolylineRef.current) {
      const pickup = activeOrder.pickupCoords || { lat: 31.4147, lng: 73.0872 };
      const dropoff = activeOrder.dropoffCoords || { lat: 31.4082, lng: 73.1023 };
      routePolylineRef.current.setLatLngs([
        [pickup.lat, pickup.lng],
        [riderCoords.lat, riderCoords.lng],
        [dropoff.lat, dropoff.lng]
      ]);
    }
  }, [riderCoords?.lat, riderCoords?.lng]);

  // Real Phone GPS Telemetry Streamer: Automatically active when rider is Online
  useEffect(() => {
    if (!isRiderOnline) {
      setGpsActive(false);
      setIsSharingLocation(false);
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation API not supported in browser');
      return;
    }

    setIsSharingLocation(true);

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsActive(true);
        const newPos = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5))
        };
        setRiderCoords(newPos);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 0));
        const speedKmh = pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : 0;
        setGpsSpeed(speedKmh);
        const headingDeg = pos.coords.heading != null ? Math.round(pos.coords.heading) : 0;
        setGpsHeading(headingDeg);
        setGpsLastSyncTime(new Date());

        const riderMeta = {
          name: activeRider?.name,
          phone: activeRider?.phone,
          vehicle: activeRider?.vehicleType || activeRider?.vehicleNumber,
          accuracy: pos.coords.accuracy,
          speed: speedKmh,
          heading: headingDeg
        };

        // Feed real phone GPS telemetry to backend endpoint for all active orders
        const activeOrdersForGps = [...outForDeliveryOrders, ...headingToStoreOrders];
        activeOrdersForGps.forEach(async (ord) => {
          const ordId = ord.id || ord.orderId;
          try {
            await apiService.updateRiderLocation(ordId, {
              lat: newPos.lat,
              lng: newPos.lng,
              speed: speedKmh,
              heading: headingDeg
            });
          } catch (e) {}
          if (typeof updateRiderLiveLocation === 'function') {
            updateRiderLiveLocation(ordId, newPos, true, riderMeta);
          }
        });
      },
      (err) => {
        console.warn('Real GPS status:', err.message);
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
    );

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [isRiderOnline, outForDeliveryOrders.length, headingToStoreOrders.length, activeRider?.id]);

  // Toggle Live Location Sharing
  const toggleLiveLocationSharing = () => {
    if (isSharingLocation) {
      // Stop sharing
      setIsSharingLocation(false);
      setGpsActive(false);
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      if (activeOrder) {
        updateRiderLiveLocation(activeOrder.id, riderCoords, false, {
          name: activeRider?.name,
          phone: activeRider?.phone,
          vehicle: activeRider?.vehicleType
        });
      }
      addToast('Location Sharing Paused ⏸️', 'Live GPS stream stopped.', 'info');
      return;
    }

    if (!isRiderOnline) {
      addToast('You are Offline', 'Please toggle Online first to broadcast live GPS.', 'error');
      return;
    }

    // Start sharing - accurate live GPS tracking
    setIsSharingLocation(true);
    addToast('Live Location Sharing Active 📡🛵', 'Accurate live GPS location shared with customer in real time!');

    const riderMeta = {
      name: activeRider?.name,
      phone: activeRider?.phone,
      vehicle: activeRider?.vehicleType
    };

    const initialPos = riderCoords || activeOrder?.pickupCoords || { lat: 31.4147, lng: 73.0872 };
    if (activeOrder) {
      updateRiderLiveLocation(activeOrder.id, initialPos, true, riderMeta);
    }
  };

  // Clean up telemetry intervals on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Today's formatted date matching screenshot (e.g. Wednesday, Oct 7)
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const storeBrandName = currentTenant?.name || user?.tenantName || 'Supermarket';
  const storeLogo = currentTenant?.logo || '🏬';

  const storeTheme = useMemo(() => {
    return getStoreTheme(currentTenant || user?.tenantName || user?.tenantId || activeRider?.tenantId || activeRider?.companyId || storeBrandName);
  }, [currentTenant, user?.tenantName, user?.tenantId, activeRider?.tenantId, activeRider?.companyId, storeBrandName]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
      
      {/* ===================================================================== */}
      {/* MOBILE TOP BAR                                                        */}
      {/* ===================================================================== */}
      <div
        className="md:hidden text-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-md transition-colors"
        style={{
          backgroundColor: storeTheme.sidebarHeaderBg,
          borderBottom: `1px solid ${storeTheme.sidebarBorder}`
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-base shadow-xs"
              style={{
                backgroundColor: `${storeTheme.primaryLight}25`,
                border: `1px solid ${storeTheme.primaryLight}50`,
                color: storeTheme.accentText
              }}
            >
              {storeLogo}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">{storeBrandName}</h1>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: storeTheme.accentText }}
              >
                Parcel Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Online / Offline Toggle */}
          <button
            type="button"
            onClick={handleToggleOnlineStatus}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-xs ${
              isRiderOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
            title="Toggle On-Duty / Off-Duty"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRiderOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span>{isRiderOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Mobile Notification Alert Button */}
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title={notifPermission === 'granted' ? 'Push alerts active' : 'Enable push alerts'}
          >
            {notifPermission === 'granted' ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Change Password Shortcut */}
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Change Password"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof adminLogout === 'function') {
                adminLogout();
              } else if (typeof logoutAdmin === 'function') {
                logoutAdmin();
              }
              navigateTo('home');
            }}
            className="text-xs text-rose-400 hover:text-white font-bold px-2 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/40 transition flex items-center gap-1 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 📱 MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-35 bg-slate-950/75 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR (Store Themed Logistics Cockpit)                      */}
      {/* ===================================================================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 text-slate-300 flex flex-col justify-between transition-transform duration-200 shrink-0 shadow-xl select-none ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: storeTheme.sidebarBg,
          borderRight: `1px solid ${storeTheme.sidebarBorder}`
        }}
      >
        <div className="p-4 space-y-5">
          
          {/* Logo & Portal Header */}
          <div
            className="p-2 rounded-2xl flex items-center gap-3 transition-colors"
            style={{
              backgroundColor: storeTheme.sidebarHeaderBg,
              border: `1px solid ${storeTheme.sidebarBorder}`
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0"
              style={{
                backgroundColor: `${storeTheme.primaryLight}25`,
                border: `1px solid ${storeTheme.primaryLight}50`,
                color: storeTheme.accentText
              }}
            >
              {storeLogo}
            </div>
            <div className="min-w-0 flex-1 truncate">
              <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
                {storeBrandName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color: storeTheme.accentText }}
                >
                  Express Parcel Dispatch
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-3">
              COURIER RUNS
            </span>
            <nav className="space-y-1 pt-1">
              
              {/* Out for Delivery Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('out-for-delivery');
                  setMobileSidebarOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  activeTab === 'out-for-delivery'
                    ? 'text-white font-bold shadow-md'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                style={
                  activeTab === 'out-for-delivery'
                    ? {
                        backgroundColor: storeTheme.activeBg,
                        boxShadow: storeTheme.activeGlow,
                        border: `1px solid ${storeTheme.primaryLight}50`
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-2.5">
                  <Package
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeTab === 'out-for-delivery' ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>Active Parcels</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    activeTab === 'out-for-delivery' ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {outForDeliveryOrders.length}
                </span>
              </button>

              {/* Delivered Parcels Today Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('delivered-today');
                  setMobileSidebarOpen(false);
                  const el = document.getElementById('delivered-parcels-today-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  activeTab === 'delivered-today'
                    ? 'text-white font-bold shadow-md'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                style={
                  activeTab === 'delivered-today'
                    ? {
                        backgroundColor: storeTheme.activeBg,
                        boxShadow: storeTheme.activeGlow,
                        border: `1px solid ${storeTheme.primaryLight}50`
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeTab === 'delivered-today' ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>Delivered Parcels Today</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    activeTab === 'delivered-today' ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {deliveredTodayOrders.length}
                </span>
              </button>

              {/* Earnings & COD Ledger Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('earnings');
                  setMobileSidebarOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  activeTab === 'earnings'
                    ? 'text-white font-bold shadow-md'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                style={
                  activeTab === 'earnings'
                    ? {
                        backgroundColor: storeTheme.activeBg,
                        boxShadow: storeTheme.activeGlow,
                        border: `1px solid ${storeTheme.primaryLight}50`
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-2.5">
                  <Wallet
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeTab === 'earnings' ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>Earnings & COD</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    activeTab === 'earnings' ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {formatPrice(totalRiderEarningsToday)}
                </span>
              </button>
            </nav>
          </div>

        </div>

        {/* Bottom Profile & Actions */}
        <div
          className="p-3 shrink-0 space-y-2 mt-auto transition-colors"
          style={{
            backgroundColor: storeTheme.sidebarFooterBg,
            borderTop: `1px solid ${storeTheme.sidebarBorder}`
          }}
        >
          {/* Profile Card with Online/Offline Switch */}
          <div
            className="p-2.5 rounded-xl transition-colors space-y-2"
            style={{
              backgroundColor: `${storeTheme.sidebarBg}bb`,
              border: `1px solid ${storeTheme.sidebarBorder}`
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-sm shrink-0"
                style={{
                  backgroundColor: `${storeTheme.primaryLight}25`,
                  border: `1px solid ${storeTheme.primaryLight}50`,
                  color: storeTheme.accentText
                }}
              >
                {(activeRider?.name || 'A')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white truncate leading-tight capitalize">
                    {activeRider?.name || 'Ahmad Khan'}
                  </h2>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isRiderOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isRiderOnline ? 'On-Duty' : 'Off-Duty'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" style={{ color: storeTheme.accentText }} />
                  <span className="truncate">{activeRider?.zone || 'Peoples Colony No. 1 (Faisalabad)'}</span>
                </p>
                <p className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: storeTheme.accentText }}>
                  {activeRider?.vehicleType || '🏍️ Honda 125'} • {activeRider?.vehicleNumber || 'FSD-4821'}
                </p>
              </div>
            </div>

            {/* Quick Online/Offline Toggle Button in Profile */}
            <div className="pt-1 border-t border-slate-700/60 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleOnlineStatus}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isRiderOnline
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/50'
                    : 'bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/50'
                }`}
                title="Toggle Online/Offline Duty"
              >
                <Power className="w-3 h-3" />
                <span>{isRiderOnline ? 'Go Offline' : 'Go Online'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="py-1 px-2 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer transition"
                title="Change Rider Password"
              >
                <KeyRound className="w-3 h-3" />
                <span>Password</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* Download Staff Mobile App APK */}
            <a
              href="/downloads/freshmart-staff.apk"
              download="freshmart-staff.apk"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 hover:text-white"
              title="Download FreshMart Staff Android App (APK)"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Download Staff App</span>
              </span>
              <span className="text-[10px] bg-emerald-600/30 px-1.5 py-0.5 rounded text-emerald-200">APK</span>
            </a>

            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{
                color: storeTheme.accentText,
                backgroundColor: `${storeTheme.primaryLight}18`,
                border: `1px solid ${storeTheme.primaryLight}40`
              }}
              title="Back to Customer Storefront"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>Customer Store</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5" style={{ color: storeTheme.accentText }} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof adminLogout === 'function') {
                  adminLogout();
                } else if (typeof logoutAdmin === 'function') {
                  logoutAdmin();
                }
                navigateTo('home');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (Rider)</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CONTENT AREA (Modern Slate Parcel Delivery Operations Console) */}
      {/* ===================================================================== */}
      <main className="flex-1 min-w-0 p-3 sm:p-7 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-7 overflow-y-auto max-w-7xl mx-auto">
        
        {/* Top Header: Courier Operations Console */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center justify-center font-black text-2xl shrink-0">
              🛵
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Parcel Delivery Operations
                </h1>

                {/* Interactive Online / Offline Status Toggle Pill */}
                <button
                  type="button"
                  onClick={handleToggleOnlineStatus}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                    isRiderOnline
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                  }`}
                  title="Click to switch On-Duty (Online) vs Off-Duty (Offline)"
                >
                  <span className={`w-2 h-2 rounded-full ${isRiderOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span>{isRiderOnline ? 'Online (On-Duty)' : 'Offline (Off-Duty)'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-700">{activeRider?.name || 'Ahmad Khan (Al-Fatah)'}</span>
                <span>•</span>
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {activeRider?.zone || 'Peoples Colony No. 1 (Faisalabad)'}
                </span>
                <span>•</span>
                <span className="text-slate-500">{activeRider?.vehicleType || '🏍️ Honda 125'} ({activeRider?.vehicleNumber || 'FSD-4821'})</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Live GPS Telemetry Badge */}
            <div
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs ${
                gpsActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Real-time smartphone GPS telemetry sensor"
            >
              <Radio className={`w-3.5 h-3.5 ${gpsActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{gpsActive ? `🛰️ GPS Active ±${gpsAccuracy || 8}m (${gpsSpeed || 0} km/h)` : '🛰️ GPS Standby'}</span>
            </div>

            {/* Push Notifications Toggle */}
            <button
              type="button"
              onClick={handleEnableNotifications}
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                notifPermission === 'granted'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Browser Push Notifications"
            >
              <Bell className="w-3.5 h-3.5 text-sky-600" />
              <span>{notifPermission === 'granted' ? '🔔 Alerts On' : '🔔 Enable Alerts'}</span>
            </button>

            {/* Change Password Button */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 rounded-2xl text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Change Rider Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Password</span>
            </button>

            {/* Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedToday}</span>
            </div>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!isRiderOnline && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-900 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2">
                  <span>You Are Currently Offline (Off-Duty)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">Off-Duty</span>
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  You will not receive any new order assignments from store dispatch or pickup staff until you go back online.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleOnlineStatus}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Power className="w-4 h-4" />
              <span>Go Online Now</span>
            </button>
          </div>
        )}

        {/* ⚡ INCOMING DELIVERY ASSIGNMENTS (AWAITING COURIER ACCEPT / DECLINE) */}
        {pendingAcceptanceOrders.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>New Delivery Assignments</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {pendingAcceptanceOrders.length} Awaiting Acceptance
                  </span>
                </h2>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hidden sm:inline-block">
                ⚡ Accept order to head to store for pickup
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingAcceptanceOrders.map((ord) => {
                const totalFormatted = formatPrice(ord.totalAmount);
                const isCod = !ord.paymentMethod || ord.paymentMethod.toLowerCase().includes('cash') || ord.paymentMethod.toLowerCase().includes('cod');

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-400 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <h3 className="text-base font-black text-slate-900 font-mono tracking-tight">
                          Assignment #{ord.orderId || ord.id}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                        <span>Assigned to You</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <p className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Store Hub:</span>
                          <span className="font-bold text-slate-800">{ord.tenantName || storeBrandName} ({ord.branchName || 'D-Ground Main'})</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Customer:</span>
                          <span className="font-bold text-slate-900">{ord.customerName} ({ord.customerPhone})</span>
                        </p>
                        <p className="flex items-start justify-between gap-2">
                          <span className="text-slate-500 font-semibold shrink-0">Drop-off:</span>
                          <span className="font-medium text-slate-700 text-right">{ord.shippingAddress?.address || ord.address || 'Faisalabad'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            📦 {Array.isArray(ord.itemsList) ? ord.itemsList.length : 1} items
                          </span>
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${isCod ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
                            {isCod ? '💵 Cash on Delivery' : '💳 Prepaid Order'}
                          </span>
                        </div>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {totalFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleAcceptIncomingOrder(ord)}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDeclineModal(ord)}
                        className="py-3 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 🛵 ACCEPTED ORDERS: HEADING TO STORE (CONFIRM PICKUP FROM STORE) */}
        {headingToStoreOrders.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Store className="w-5 h-5 text-sky-600" />
                <span>En Route to Store for Pickup ({headingToStoreOrders.length})</span>
              </h2>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                Confirm pickup when you collect items at store counter
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {headingToStoreOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-sky-300 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-mono">
                        Parcel #{ord.orderId || ord.id}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Accepted by you • Proceed to {ord.tenantName || storeBrandName} counter
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                      Heading to Store
                    </span>
                  </div>

                  <div className="bg-sky-50/60 rounded-2xl p-3.5 border border-sky-200/80 text-xs space-y-1.5">
                    <p className="text-slate-700">
                      <span className="font-bold text-slate-900">Pickup Counter:</span> {ord.branchName || 'D-Ground Flagship Hub, Faisalabad'}
                    </p>
                    <p className="text-slate-700">
                      <span className="font-bold text-slate-900">Customer Drop-off:</span> {ord.customerName} ({ord.shippingAddress?.address || ord.address || 'Faisalabad'})
                    </p>
                    <p className="text-slate-700">
                      <span className="font-bold text-slate-900">Amount to Collect:</span> <b className="font-mono text-emerald-700">{formatPrice(ord.totalAmount)}</b>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmStorePickup(ord)}
                      className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Confirm Picked Up from Store</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4 Logistics KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          
          {/* Card 1: Active Run */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('out-for-delivery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`rounded-3xl p-4 sm:p-5 border shadow-2xs relative overflow-hidden flex flex-col justify-between text-left transition cursor-pointer ${
              activeTab === 'out-for-delivery'
                ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Parcels</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {activeOrdersCount}
              </p>
              <span className="text-[11px] text-emerald-800 font-bold block mt-0.5">
                {outForDeliveryOrders.length} in transit • {headingToStoreOrders.length} at store • {pendingAcceptanceOrders.length} assigned
              </span>
            </div>
          </button>

          {/* Card 2: COD Cash to Collect */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">COD To Collect</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
                {formatPrice(totalCodAmount)}
              </p>
              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                Cash on delivery settlement
              </span>
            </div>
          </div>

          {/* Card 3: Delivered Today */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('delivered-today');
              const el = document.getElementById('delivered-parcels-today-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`rounded-3xl p-4 sm:p-5 border shadow-2xs relative overflow-hidden flex flex-col justify-between text-left transition cursor-pointer ${
              activeTab === 'delivered-today'
                ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered Today</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {deliveredTodayOrders.length}
              </p>
              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                Completed & verified
              </span>
            </div>
          </button>

          {/* Card 4: Dispatch SuperHub */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Hub</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeRider?.city || user?.city || activeOrder?.city || 'Faisalabad Metro'}
              </p>
              <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                {activeRider?.branchName || activeRider?.zone || user?.branchName || user?.zone || (activeOrder ? `${activeOrder.tenantName || 'Store'} Hub` : 'Peoples Colony Dark Store')}
              </span>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* SECTION 1: ACTIVE PARCEL DELIVERY (Interactive Map + Live Telemetry)   */}
        {/* ===================================================================== */}
        {activeOrder && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-5">
            
            {/* Parcel Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                      Parcel #{activeOrder.orderId}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>Out for Delivery</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Express Doorstep Handover • Route: ~{activeOrder.etaMinutes || '6'} mins ({activeOrder.distanceKm || '2.4'} km away)
                  </p>
                </div>
              </div>

              {/* Live Sharing Status & GPS Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLiveLocationSharing}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                    isSharingLocation
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                  }`}
                  title={isSharingLocation ? 'GPS Broadcast Active' : 'Start Live GPS Broadcast'}
                >
                  <Navigation className={`w-3.5 h-3.5 ${isSharingLocation ? 'animate-spin' : 'text-slate-500'}`} />
                  <span>{isSharingLocation ? 'Live GPS Active' : 'Broadcast GPS'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.shippingAddress?.address || activeOrder.address || 'Peoples Colony No. 1, Faisalabad')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition flex items-center gap-1.5 shadow-2xs"
                  title="Open in Google Maps Navigation"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* Split Grid: Leaflet Map (Left) + Manifest & Handover Controls (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Left Column: Interactive Leaflet Map */}
              <div className="lg:col-span-6 flex flex-col relative isolate z-0 h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900">
                <div ref={mapContainerRef} className="w-full h-full min-h-[224px] sm:min-h-[256px]" />

                {/* 🛰️ Top-Right Map Layer Controls: Street View vs Satellite View vs Hybrid */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-0.5 shadow-md border border-slate-200/90 dark:border-slate-700 text-[10px] font-bold gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleLayerChange('street')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'street'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    🗺️ Street
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayerChange('satellite')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'satellite'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    🛰️ Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayerChange('hybrid')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      mapViewMode === 'hybrid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    🏙️ Hybrid
                  </button>
                </div>

                {/* Overlay Badge at Bottom Left */}
                <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-md text-[11px] font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-mono font-black">{activeOrder.orderId}</span>
                  <span className="text-slate-300">•</span>
                  <span>{activeOrder.distanceKm || '2.4'} km</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-bold">~{activeOrder.etaMinutes || '6'}m ETA</span>
                </div>
              </div>

              {/* Right Column: Parcel Manifest & Handover Controls */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                
                {/* Route Points */}
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  {/* Pickup Hub */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0 mt-0.5 border-2 border-white shadow-2xs"></span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">
                        {activeOrder.tenantName || storeBrandName} (D-Ground Hub)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeOrder.branchName || 'D-Ground Flagship Hub, Peoples Colony No. 1, Faisalabad'}
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-dashed border-slate-300 ml-1.5 h-3"></div>

                  {/* Customer Drop-off */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 mt-0.5 border-2 border-white shadow-2xs"></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 truncate">
                          {activeOrder.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {activeOrder.customerPhone}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs font-medium line-clamp-2 mt-0.5">
                        📍 {activeOrder.shippingAddress?.address || activeOrder.address || 'Peoples Colony No. 1, Faisalabad'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items & Contact Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border border-slate-200">
                      📦 {Array.isArray(activeOrder.itemsList) && activeOrder.itemsList.length > 0 ? activeOrder.itemsList.length : 1} Item{((Array.isArray(activeOrder.itemsList) && activeOrder.itemsList.length > 0 ? activeOrder.itemsList.length : 1) > 1) ? 's' : ''} in Bag
                    </span>
                    <span className="px-3 py-1 bg-amber-50 rounded-xl text-xs font-black text-amber-900 border border-amber-200 font-mono">
                      {formatPrice(activeOrder.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${activeOrder.customerPhone || '+923206551696'}`}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5 text-rose-600" />
                      <span>Call</span>
                    </a>

                    <a
                      href={getWhatsAppEnRouteLink(activeOrder, activeRider)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs hover:scale-[1.02]"
                      title="Contact customer on WhatsApp with ETA & PIN alert"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>
                  </div>
                </div>

                {/* Customer Handover PIN Verification Section */}
                <div className="bg-emerald-50/60 border border-emerald-300/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔐</span>
                      <label className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                        Customer Handover PIN
                      </label>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Required for Delivery
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    Ask customer for their 4-digit security PIN upon physical handover of parcel:
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Customer 4-digit PIN"
                      value={otpInputs[activeOrder.id] || ''}
                      onChange={(e) => handleOtpInputChange(activeOrder.id, e.target.value)}
                      className="flex-1 bg-white border border-emerald-300 rounded-xl px-4 py-3 sm:py-2 text-center sm:text-left text-sm font-mono font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-wider"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={verifyingOrderMap[activeOrder.id]}
                        onClick={() => handleVerifyOtp(activeOrder.id, activeOrder.deliveryOtp)}
                        className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{verifyingOrderMap[activeOrder.id] ? 'Verifying...' : 'Verify PIN & Deliver'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={verifyingOrderMap[activeOrder.id]}
                        onClick={() => {
                          handleOtpInputChange(activeOrder.id, activeOrder.deliveryOtp || '7412');
                          handleVerifyOtp(activeOrder.id, activeOrder.deliveryOtp || '7412');
                        }}
                        className="px-3.5 py-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1"
                        title="Direct Handover Delivery"
                      >
                        <span>Deliver</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================================== */}
        {/* 1. PREPARING PARCELS BANNER (Track live prep time & dispatch status)   */}
        {/* ===================================================================== */}
        {preparingOrders.length > 0 && !activeOrder && (
          <section className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🍳</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>Parcels Preparing at Pickup Desk</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {preparingOrders.length} In Progress
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Store pickup staff is currently packing items at {storeBrandName}. Track live countdown to pickup.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                <span>Dispatch: Preparing (Not Dispatched Yet)</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {preparingOrders.map((ord) => {
                const prepInfo = getPrepTimeInfo(ord);
                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-amber-200/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-stone-900 font-mono text-sm">
                          {ord.orderId || `#${ord.id}`}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-black text-emerald-700">
                          {formatPrice(ord.totalAmount || ord.total)}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-bold text-stone-800">
                          {ord.customerName || ord.customer || 'Customer'}
                        </span>
                        {ord.pickupStaffName && (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[10px] border border-stone-200">
                            📦 Packing by {ord.pickupStaffName}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-500 text-[11px] flex items-center gap-1">
                        <span>📍 Drop-off:</span>
                        <span className="font-medium text-stone-700">
                          {ord.shippingAddress?.address || ord.address || ord.city || 'Faisalabad'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                      {/* Live countdown timer badge */}
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Ready in: <b className="font-black font-mono">{prepInfo.formatted}</b></span>
                      </span>

                      {/* Dispatch Status */}
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span>Dispatch: Preparing (Not Dispatched Yet)</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* 2. READY FOR DISPATCH BANNER (Parcels packed by staff waiting for rider)  */}
        {/* ===================================================================== */}
        {readyForDispatchOrders.length > 0 && !activeOrder && (
          <section className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <span>Parcels Dispatched & Ready for Pickup</span>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {readyForDispatchOrders.length} Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Store pickup staff has verified and staged parcel(s) at {storeBrandName} counter.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <span>✓ Dispatch: Ready at Counter</span>
              </span>
            </div>

            <div className="space-y-2">
              {readyForDispatchOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl border border-emerald-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-stone-900 font-mono text-sm">
                        {ord.orderId || `#${ord.id}`}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="font-bold text-stone-700">
                        {formatPrice(ord.totalAmount || ord.total)}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="font-semibold text-stone-600">
                        {ord.customerName || ord.customer || 'Customer'}
                      </span>
                      {ord.pickupStaffName && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Dispatched by {ord.pickupStaffName}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      📍 Drop-off: {ord.shippingAddress?.address || ord.address || ord.city || 'Faisalabad'}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        ⏱️ Time to Pickup: <b>Ready Now (0m)</b>
                      </span>
                      <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        Dispatch: <b>Dispatched & Ready</b>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAcceptDispatchOrder(ord)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0"
                  >
                    <span>🛵 Accept & Start Delivery</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* STANDBY / IDLE ON-DUTY STATE (When rider has 0 active or ready parcels)*/}
        {/* ===================================================================== */}
        {!activeOrder && readyForDispatchOrders.length === 0 && preparingOrders.length === 0 && (
          <section className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xl shadow-2xs">
              🛵
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>ON-DUTY & ONLINE</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Awaiting Store Dispatch Orders
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You are on standby in <b>{activeRider?.zone || 'Store Delivery Zone'}</b> for {storeBrandName}. When store pickup staff packs and marks a parcel ready, it will appear here in real-time.
              </p>
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* SECTION 2: OUT FOR DELIVERY (Grid Cards)                              */}
        {/* ===================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Out for Delivery ({outForDeliveryOrders.length})</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {outForDeliveryOrders.length} Parcels in Transit
            </span>
          </div>

          {outForDeliveryOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
              <span className="text-3xl">🎉</span>
              <h3 className="text-base font-black text-slate-900">All Parcels Delivered!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders currently waiting for drop-off. New orders dispatched by store admin or accepted from pickup queue will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {outForDeliveryOrders.map((order) => {
                const totalFormatted = formatPrice(order.totalAmount);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3.5 hover:border-slate-300 transition"
                  >
                    {/* Header: Order ID + Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 font-mono">
                        Parcel #{order.orderId}
                      </span>
                      <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-black rounded-full flex items-center gap-1 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        <span>OUT FOR DELIVERY</span>
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p><span className="font-bold text-slate-900">Customer:</span> {order.customerName}</p>
                      <p><span className="font-bold text-slate-900">Phone:</span> {order.customerPhone}</p>
                      <p><span className="font-bold text-slate-900">Territory:</span> {order.region || activeRider?.zone || 'Peoples Colony No. 1 (Faisalabad)'}</p>
                      <p><span className="font-bold text-slate-900">Drop-off:</span> {order.shippingAddress?.address || order.address || 'Peoples Colony No. 1, Faisalabad'}</p>
                    </div>

                    {/* Items List */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                        PARCEL CONTENTS
                      </span>
                      <div className="space-y-1 text-xs text-slate-800">
                        {Array.isArray(order.itemsList) && order.itemsList.length > 0 ? (
                          order.itemsList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium text-slate-800">{item.name || item.productName || item.title || 'Grocery Item'}</span>
                              <span className="font-bold text-slate-500 font-mono">x{item.quantity || item.qty || 1}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-800">{typeof order.items === 'string' ? order.items : 'Grocery Parcel Package'}</span>
                            <span className="font-bold text-slate-500 font-mono">x1</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Call Button & Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${order.customerPhone || '+923206551696'}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Phone className="w-3 h-3 text-rose-600" />
                          <span>Call</span>
                        </a>
                        <a
                          href={getWhatsAppEnRouteLink(order, activeRider)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs hover:scale-[1.02]"
                          title="Contact customer on WhatsApp with ETA & PIN alert"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <span className="text-base font-black text-slate-900 font-mono">
                        {totalFormatted}
                      </span>
                    </div>

                    {/* Enter Customer Handover PIN row */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black tracking-wider uppercase text-emerald-950 block">
                          Customer Handover PIN
                        </label>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          Required for Delivery
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter customer's 4-digit PIN"
                          value={otpInputs[order.id] || ''}
                          onChange={(e) => handleOtpInputChange(order.id, e.target.value)}
                          className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={verifyingOrderMap[order.id]}
                          onClick={() => handleVerifyOtp(order.id, order.deliveryOtp)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {verifyingOrderMap[order.id] ? 'Verifying...' : 'Verify & Deliver'}
                        </button>
                        <button
                          type="button"
                          disabled={verifyingOrderMap[order.id]}
                          onClick={() => {
                            handleOtpInputChange(order.id, order.deliveryOtp || '7412');
                            handleVerifyOtp(order.id, order.deliveryOtp || '7412');
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                          title="Deliver Parcel"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Deliver</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* DELIVERED AUDIT TABLE (Clean handover log table)                      */}
        {/* ===================================================================== */}
        <section id="delivered-parcels-today-section" className="space-y-4 pt-2 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Delivered Parcels Today</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified doorstep handovers and collected payments logged for courier run
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{deliveredTodayOrders.length} Completed Handover{deliveredTodayOrders.length === 1 ? '' : 's'}</span>
              </span>
            </div>
          </div>

          {/* Delivered Audit Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3.5 px-6">PARCEL ID</th>
                    <th className="py-3.5 px-6">CUSTOMER</th>
                    <th className="py-3.5 px-6">DESTINATION</th>
                    <th className="py-3.5 px-6">ITEMS</th>
                    <th className="py-3.5 px-6">TOTAL</th>
                    <th className="py-3.5 px-6">HANDOVER TIME</th>
                    <th className="py-3.5 px-6 text-right">WHATSAPP NOTIFY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deliveredTodayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400 italic">
                        No parcels delivered yet today.
                      </td>
                    </tr>
                  ) : (
                    deliveredTodayOrders.map((order) => {
                      const totalFormatted = formatPrice(order.totalAmount || order.total || order.totalPrice || 0);

                      const deliveredTime = order.deliveredAt
                        ? new Date(order.deliveredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '12:36 PM';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-6 font-black text-slate-900 font-mono">
                            {String(order.orderId || order.id || '').replace(/^#/, '')}
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-900">
                            {order.customerName}
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 text-xs">
                            {order.shippingAddress?.address || order.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad'}
                          </td>
                          <td className="py-3.5 px-6 text-slate-500">
                            {Array.isArray(order.itemsList) && order.itemsList.length > 0
                              ? order.itemsList.map((i) => `${i.name || i.productName || i.title || 'Item'} (x${i.quantity || i.qty || 1})`).join(', ')
                              : (typeof order.items === 'string' ? order.items : '1 Item')}
                          </td>
                          <td className="py-3.5 px-6 font-black text-slate-900 font-mono">
                            {totalFormatted}
                          </td>
                          <td className="py-3.5 px-6 font-medium text-emerald-700">
                            ✓ {deliveredTime}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <a
                              href={getWhatsAppDeliveryLink(order, activeRider)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold transition shadow-2xs hover:scale-[1.02]"
                              title="Send delivery receipt to customer on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Notify WhatsApp</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION: EARNINGS & CASH-ON-DELIVERY (COD) LEDGER                     */}
        {/* ===================================================================== */}
        {activeTab === 'earnings' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                  <span>Courier Earnings & COD Ledger</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track delivery trip payouts, cash collected from customers, and store cashier handovers
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(true)}
                  disabled={netCashInHand <= 0}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Settle Cash with Cashier</span>
                </button>
              </div>
            </div>

            {/* 4 Financial KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {/* Stat 1: Total Earnings Today */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Payout</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                    {formatPrice(totalRiderEarningsToday)}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                    {deliveredTodayOrders.length} trips × Rs. 150 {totalTipsToday > 0 ? `+ Rs. ${totalTipsToday} tips` : ''}
                  </span>
                </div>
              </div>

              {/* Stat 2: Cash in Hand to Handover */}
              <div className={`rounded-3xl p-5 border shadow-2xs relative overflow-hidden flex flex-col justify-between ${
                netCashInHand > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200/90'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash in Hand</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    netCashInHand > 0 ? 'bg-amber-500/20 text-amber-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPrice(netCashInHand)}
                  </p>
                  <span className="text-[11px] font-bold block mt-0.5 text-amber-900">
                    {netCashInHand > 0 ? 'To handover to store cashier' : 'All collections settled ✓'}
                  </span>
                </div>
              </div>

              {/* Stat 3: Total COD Collected */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">COD Collected</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPrice(totalCodCollectedToday)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Across {codDeliveredOrders.length} cash deliveries
                  </span>
                </div>
              </div>

              {/* Stat 4: Total Settled with Cashier */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Settled</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                    {formatPrice(totalSettledWithCashier)}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                    {settlementRecords.length} cashier settlement{settlementRecords.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            {/* Handover Notice Card */}
            {netCashInHand > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💵</span>
                  <div>
                    <h3 className="text-sm font-black text-amber-950">
                      Pending Cash Handover: {formatPrice(netCashInHand)}
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Hand over physical cash collected from COD customers to the store head cashier at the end of your shift.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Settle with Cashier</span>
                </button>
              </div>
            )}

            {/* Today's Delivered Orders Payment Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Today's Order Collections Breakdown</span>
                </h3>
                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {deliveredTodayOrders.length} Completed Handover{deliveredTodayOrders.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4">ORDER ID</th>
                      <th className="py-3 px-4">CUSTOMER</th>
                      <th className="py-3 px-4">PAYMENT METHOD</th>
                      <th className="py-3 px-4">COLLECTED BY</th>
                      <th className="py-3 px-4">ORDER AMOUNT</th>
                      <th className="py-3 px-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {deliveredTodayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">
                          No deliveries logged yet today.
                        </td>
                      </tr>
                    ) : (
                      deliveredTodayOrders.map((ord) => {
                        const pm = String(ord.paymentMethod || '').toLowerCase();
                        const isCod = !pm || pm.includes('cash') || pm.includes('cod') || pm.includes('delivery');
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-black font-mono text-slate-900">
                              #{String(ord.orderId || ord.id).replace(/^#/, '')}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {ord.customerName}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isCod ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              }`}>
                                {isCod ? '💵 Cash on Delivery' : '💳 Prepaid (Online/Card)'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {isCod ? 'Rider In-Hand' : 'Payment Gateway'}
                            </td>
                            <td className="py-3 px-4 font-black font-mono text-slate-900">
                              {formatPrice(ord.totalAmount || ord.total || 0)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Verified Handover</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cashier Settlement History Table */}
            {settlementRecords.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Store Cashier Settlement History</span>
                  </h3>
                  <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {settlementRecords.length} Recorded Voucher{settlementRecords.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-3 px-4">SETTLEMENT ID</th>
                        <th className="py-3 px-4">DATE & TIME</th>
                        <th className="py-3 px-4">AMOUNT HANDED OVER</th>
                        <th className="py-3 px-4">PARCELS INCLUDED</th>
                        <th className="py-3 px-4 text-right">CASHIER STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {settlementRecords.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {s.id}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {new Date(s.settledAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.settledAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-700">
                            {formatPrice(s.amount)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {Array.isArray(s.orderIds) ? `${s.orderIds.length} orders settled` : 'Batch Settlement'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-800">
                            ✓ Handed Over to Cashier
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      {/* ===================================================================== */}
      {/* FLOATING HELP / CHAT BUTTON                                           */}
      {/* ===================================================================== */}
      <button
        type="button"
        onClick={() => addToast('Courier Dispatch Help 💬', 'Dispatch desk is online and monitoring your route.')}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer z-30"
        title="Support & Dispatch Chat"
        aria-label="Support & Dispatch Chat"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* 📱 COURIER RIDER MOBILE BOTTOM NAV BAR (< md screens) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0b132b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-around py-1.5 px-2 shadow-lg safe-bottom"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('out-for-delivery');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl relative transition cursor-pointer ${
            activeTab === 'out-for-delivery'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Package className="w-4 h-4" />
          {outForDeliveryOrders.length > 0 && (
            <span className="absolute top-0 right-1 px-1 min-w-[14px] h-3.5 bg-emerald-700 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {outForDeliveryOrders.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Active Run</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('delivered-today');
            const el = document.getElementById('delivered-parcels-today-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl relative transition cursor-pointer ${
            activeTab === 'delivered-today'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {deliveredTodayOrders.length > 0 && (
            <span className="absolute top-0 right-1 px-1 min-w-[14px] h-3.5 bg-blue-700 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {deliveredTodayOrders.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Delivered</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('earnings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl relative transition cursor-pointer ${
            activeTab === 'earnings'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Earnings</span>
        </button>

        {activeOrder && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.shippingAddress?.address || activeOrder.address || 'Faisalabad')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center py-1 px-3 rounded-xl text-sky-600 dark:text-sky-400 font-medium transition cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Route</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* ===================================================================== */}
      {/* WHATSAPP DELIVERY NOTIFICATION MODAL                                  */}
      {/* ===================================================================== */}
      {deliveredOrderForWhatsApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-notify-modal-title"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-[#0b132b] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl">
                  🎉
                </div>
                <div>
                  <h3 id="whatsapp-notify-modal-title" className="text-base font-black text-white flex items-center gap-2">
                    <span>Delivery Confirmed!</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Handover Complete
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Parcel #{String(deliveredOrderForWhatsApp.orderId || deliveredOrderForWhatsApp.id || '').replace(/^#/, '')} verified & logged
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeliveredOrderForWhatsApp(null)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Order & Recipient Snapshot */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {deliveredOrderForWhatsApp.customerName || 'Valued Customer'}
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {formatPrice(deliveredOrderForWhatsApp.totalAmount || deliveredOrderForWhatsApp.total || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>📞 {deliveredOrderForWhatsApp.customerPhone || '923206551696'}</span>
                  <span className="text-slate-400 font-medium">📍 {deliveredOrderForWhatsApp.region || 'Faisalabad'}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {deliveredOrderForWhatsApp.shippingAddress?.address || deliveredOrderForWhatsApp.address || 'Drop-off address'}
                </p>
              </div>

              {/* Optional Courier Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Add Courier Note to Receipt (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Handed directly to customer / Left with security guard"
                  value={customWhatsAppNote}
                  onChange={(e) => setCustomWhatsAppNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* WhatsApp Message Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Delivery Message Preview</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = buildWhatsAppDeliveryMessage(deliveredOrderForWhatsApp, activeRider, customWhatsAppNote);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(msg);
                      }
                      setCopiedMessageFeedback(true);
                      setTimeout(() => setCopiedMessageFeedback(false), 2000);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedMessageFeedback ? 'Copied to Clipboard! ✓' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="bg-[#e7f7ed] border border-[#a3e4b7] rounded-2xl p-3.5 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-line shadow-inner max-h-48 overflow-y-auto">
                  {buildWhatsAppDeliveryMessage(deliveredOrderForWhatsApp, activeRider, customWhatsAppNote)}
                </div>
              </div>

              {/* Preference Toggle */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoOpenWhatsAppOnDeliver}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutoOpenWhatsAppOnDeliver(checked);
                    try {
                      localStorage.setItem('freshmart_rider_auto_whatsapp', checked ? 'true' : 'false');
                    } catch (err) {}
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
                <span className="text-[11px] text-slate-600 font-medium">
                  Automatically launch WhatsApp after every verified delivery
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2.5">
              <a
                href={getWhatsAppDeliveryLink(deliveredOrderForWhatsApp, activeRider, customWhatsAppNote)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  addToast('WhatsApp Opened 💬', 'WhatsApp chat opened with pre-filled delivery confirmation message.');
                }}
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notify Customer on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={() => setDeliveredOrderForWhatsApp(null)}
                className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CHANGE PASSWORD MODAL                                                 */}
      {/* ===================================================================== */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#0b132b] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xl">
                  🔐
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Change Rider Password</h3>
                  <p className="text-xs text-slate-300">Set a clean personal password for your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4 text-xs">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Current Password:</label>
                <input
                  type="password"
                  placeholder="Enter current password (default: rider123)"
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">New Password:</label>
                <input
                  type="password"
                  placeholder="New password (min 4 characters)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Confirm New Password:</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer transition shadow-md disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DECLINE ORDER CONFIRMATION MODAL                                      */}
      {/* ===================================================================== */}
      {decliningOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-rose-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center text-xl">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Decline Assignment</h3>
                  <p className="text-xs text-rose-200">Return parcel #{decliningOrder.orderId || decliningOrder.id} to dispatch queue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecliningOrder(null)}
                className="w-8 h-8 rounded-full bg-rose-900 hover:bg-rose-800 text-rose-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="text-slate-600">
                Are you sure you want to decline this delivery assignment? It will return to the store dispatch queue so another courier can take it.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Reason for Declining:</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
                >
                  <option value="Courier busy / off route">Courier busy / off route</option>
                  <option value="Bike / vehicle issue">Bike / vehicle issue</option>
                  <option value="Drop-off distance too far">Drop-off distance too far</option>
                  <option value="Shift ending soon">Shift ending soon</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecliningOrder(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecline}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black cursor-pointer transition shadow-md"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CASHIER SETTLEMENT CONFIRMATION MODAL                                  */}
      {/* ===================================================================== */}
      {settlementModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#0b132b] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-xl">
                  💵
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Store Cashier Handover</h3>
                  <p className="text-xs text-slate-300">Settle physical COD collections with store cashier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlementModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Total Cash to Handover</span>
                <p className="text-3xl font-black text-emerald-800 font-mono">
                  {formatPrice(netCashInHand)}
                </p>
                <span className="text-[11px] text-emerald-700 font-medium block">
                  Collected from {codDeliveredOrders.length} cash-on-delivery orders
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Confirm that you have physically handed over <b>{formatPrice(netCashInHand)}</b> in cash to the store cashier counter. This will record an official settlement receipt and clear your pending cash-in-hand balance.
              </p>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCashierSettlement}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Handover</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
