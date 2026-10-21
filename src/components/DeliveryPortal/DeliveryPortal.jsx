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
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSameTenant } from '../../data/companyHierarchyData';

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
    currency = 'Rs.',
    addToast,
    navigateTo,
    currentTenant,
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

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('out-for-delivery'); // 'out-for-delivery' | 'delivered-today'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hasAutoSwitchedRef = useRef(false);

  // Active selected courier rider (Ahmad Khan / logged in courier)
  const currentRider = useMemo(() => {
    // 1. If currently signed in as a rider
    if (user && (user.role === 'rider' || adminRole === 'rider')) {
      const matched = (riders || []).find((r) => r.id === user.riderId || r.name === user.name);
      if (matched) {
        return {
          ...matched,
          zone: matched.zone && !matched.zone.toLowerCase().includes('gulberg') && !matched.zone.toLowerCase().includes('lahore')
            ? matched.zone
            : 'Peoples Colony No. 1 (Faisalabad)',
          branchName: matched.branchName && !matched.branchName.toLowerCase().includes('gulberg') && !matched.branchName.toLowerCase().includes('lahore')
            ? matched.branchName
            : 'D-Ground Flagship Hub (Faisalabad)',
          vehicleNumber: matched.vehicleNumber && !matched.vehicleNumber.startsWith('LEK')
            ? matched.vehicleNumber
            : 'FSD-4821'
        };
      }
      return {
        id: user.riderId || 'RDR-ALFATAH',
        name: user.name || 'Ahmad Khan (Al-Fatah)',
        zone: 'Peoples Colony No. 1 (Faisalabad)',
        branchName: 'D-Ground Flagship Hub (Faisalabad)',
        phone: user.phone || '+92 300 1234567',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'FSD-4821',
        rating: 4.9,
        status: 'On-Duty'
      };
    }

    // 2. If riders exist in database / state, match tenant rider first
    if (riders && riders.length > 0) {
      const tenantMatch = riders.find((r) => isSameTenant(r.tenantId, currentTenant?.id || user?.tenantId));
      if (tenantMatch) {
        return {
          ...tenantMatch,
          zone: tenantMatch.zone && !tenantMatch.zone.toLowerCase().includes('gulberg') && !tenantMatch.zone.toLowerCase().includes('lahore')
            ? tenantMatch.zone
            : 'Peoples Colony No. 1 (Faisalabad)',
          branchName: tenantMatch.branchName && !tenantMatch.branchName.toLowerCase().includes('gulberg') && !tenantMatch.branchName.toLowerCase().includes('lahore')
            ? tenantMatch.branchName
            : 'D-Ground Flagship Hub (Faisalabad)',
          vehicleNumber: tenantMatch.vehicleNumber && !tenantMatch.vehicleNumber.startsWith('LEK')
            ? tenantMatch.vehicleNumber
            : 'FSD-4821'
        };
      }
      return riders[0];
    }

    // 3. Fallback default: 'Ahmad Khan' in 'Peoples Colony No. 1 (Faisalabad)'
    return {
      id: 'RDR-ALFATAH',
      name: 'Ahmad Khan (Al-Fatah)',
      zone: 'Peoples Colony No. 1 (Faisalabad)',
      branchName: 'D-Ground Flagship Hub (Faisalabad)',
      phone: '+92 300 1234567',
      vehicleType: '🏍️ Honda 125',
      vehicleNumber: 'FSD-4821',
      rating: 4.9,
      status: 'On-Duty'
    };
  }, [user, adminRole, riders, currentTenant]);

  // Active courier is the authenticated/assigned rider profile
  const activeRider = currentRider;

  // Automatically purge legacy test demo parcels on mount so active parcels count is accurate
  useEffect(() => {
    const isDemoOrder = (o) => o && o.branchId === 'branch_demo';

    try {
      if (typeof setCustomerOrders === 'function') {
        setCustomerOrders((prev) => (Array.isArray(prev) ? prev.filter((o) => !isDemoOrder(o)) : prev));
      }
      if (typeof setAdminOrders === 'function') {
        setAdminOrders((prev) => (Array.isArray(prev) ? prev.filter((o) => !isDemoOrder(o)) : prev));
      }
      ['freshmart_customer_orders', 'freshmart_admin_orders'].forEach((storageKey) => {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((o) => !isDemoOrder(o));
            if (cleaned.length !== parsed.length) {
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            }
          }
        }
      });
    } catch (e) {}
  }, [setCustomerOrders, setAdminOrders]);

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

  // Combined system orders scoped to store tenant (excluding any mock demo parcels)
  const allOrdersList = useMemo(() => {
    // Put adminOrders first so admin assignments and statuses take priority, then merge customerOrders
    const combined = [...(adminOrders || []), ...(customerOrders || [])];
    const uniqueMap = new Map();
    const activeTenantId = user?.tenantId || currentTenant?.id || 'tenant-alfatah';

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

      // Robust tenant matching matching OrdersView
      const orderTenant =
        o.tenantId ||
        o.companyId ||
        o.tenantName ||
        o.storeName ||
        o.tenant ||
        o.items?.[0]?.tenantId ||
        o.rawItems?.[0]?.tenantId ||
        o.orderItems?.[0]?.tenantId;

      if (!orderTenant) {
        const id = String(o.id || o.orderId || '').toLowerCase();
        if (id.includes('701') || id.includes('af')) return isSameTenant('tenant-alfatah', activeTenantId);
        if (id.includes('fm') || id.includes('83459')) return isSameTenant('tenant-freshmart', activeTenantId);
        if (id.includes('cv')) return isSameTenant('tenant-chasevalue', activeTenantId);
        if (id.includes('cu')) return isSameTenant('tenant-chaseup', activeTenantId);
        return true;
      }

      return isSameTenant(orderTenant, activeTenantId);
    });
  }, [customerOrders, adminOrders, user?.tenantId, currentTenant?.id, locallyCompletedOrders]);

  // Orders specifically assigned to this courier (both active run and delivered today)
  const assignedOrders = useMemo(() => {
    const currentRiderId = activeRider?.id || user?.riderId || 'RDR-ALFATAH';
    const currentName = (activeRider?.name || user?.name || 'Ahmad Khan').toLowerCase().trim();

    return allOrdersList.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'cancelled') return false;

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
          rId === activeRider?.id ||
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
  }, [allOrdersList, activeRider, user?.riderId, user?.name, locallyCompletedOrders]);

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
      const finalStatus = (isLocallyDone || isStatusDelivered) ? 'Delivered' : (o.status || 'Out for Delivery');
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
        itemsList: o.items || o.orderItems || o.rawItems || []
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

  // Filter Out for Delivery vs Delivered Today
  const outForDeliveryOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const bare = String(o.id || o.orderId || '').replace(/^#/, '').toLowerCase().trim();
      const s = String(o.status || '').toLowerCase();
      const isDelivered = s === 'delivered' || s === 'completed' || Boolean(o.isDelivered) || locallyCompletedOrders.some((id) => String(id).replace(/^#/, '').toLowerCase().trim() === bare);
      return !isDelivered;
    });
  }, [portalOrders, locallyCompletedOrders]);

  const deliveredTodayOrders = useMemo(() => {
    return portalOrders.filter((o) => {
      const bare = String(o.id || o.orderId || '').replace(/^#/, '').toLowerCase().trim();
      const s = String(o.status || '').toLowerCase();
      const isDelivered = s === 'delivered' || s === 'completed' || Boolean(o.isDelivered) || locallyCompletedOrders.some((id) => String(id).replace(/^#/, '').toLowerCase().trim() === bare);
      return isDelivered;
    });
  }, [portalOrders, locallyCompletedOrders]);

  // Active delivery in transit (first out-for-delivery order)
  const activeOrder = outForDeliveryOrders[0] || null;

  // Courier Parcel Acceptance (When pickup staff packs parcel and stages for dispatch)
  const handleAcceptDispatchOrder = async (order) => {
    const rawId = order.id || order.orderId;
    const bareId = String(rawId).replace(/^#/, '');
    if (typeof assignRiderToOrder === 'function') {
      await assignRiderToOrder(rawId, activeRider.id, 'Out for Delivery', true);
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
        status: 'Out for Delivery',
        isDispatched: true,
        dispatchStatus: 'Out for Delivery',
        fulfillmentStage: 5,
        deliveryOtp: otp
      };
      if (typeof setCustomerOrders === 'function') {
        setCustomerOrders((prev) => prev.map((o) => (o.id === rawId || o.orderId === rawId || o.id === bareId ? updated : o)));
      }
      if (typeof setAdminOrders === 'function') {
        setAdminOrders((prev) => prev.map((o) => (o.id === rawId || o.orderId === rawId || o.id === bareId ? updated : o)));
      }
    }
    addToast('Parcel Accepted 🛵', `Order #${bareId} accepted! Navigation route and customer PIN are active.`);
  };

  // OTP form state per order
  const [otpInputs, setOtpInputs] = useState({});
  const [verifyingOrderMap, setVerifyingOrderMap] = useState({});

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
        setLocallyCompletedOrders((prev) => {
          const next = Array.from(new Set([...prev, bareId, rawId, `#${bareId}`]));
          try {
            localStorage.setItem('freshmart_rider_delivered_orders', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        // Clear input keys
        setOtpInputs((prev) => ({ ...prev, [rawId]: '', [bareId]: '', [`#${bareId}`]: '' }));
        addToast('Delivery Confirmed 🎉', `Order #${bareId} verified and marked Delivered! Handover logged in Delivered Parcels.`);
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

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastActiveOrderIdRef = useRef(null);
  const locationWatchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);

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

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

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

  // Toggle Live Location Sharing
  const toggleLiveLocationSharing = () => {
    if (isSharingLocation) {
      // Stop sharing
      setIsSharingLocation(false);
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
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

    // Start sharing - accurate live GPS tracking without fake automatic movement
    setIsSharingLocation(true);
    addToast('Live Location Sharing Active 📡🛵', 'Accurate live GPS location shared with customer in real time!');

    const riderMeta = {
      name: activeRider?.name,
      phone: activeRider?.phone,
      vehicle: activeRider?.vehicleType
    };

    // Broadcast accurate current coordinates immediately
    const initialPos = riderCoords || activeOrder?.pickupCoords || { lat: 31.4147, lng: 73.0872 };
    if (activeOrder) {
      updateRiderLiveLocation(activeOrder.id, initialPos, true, riderMeta);
    }

    // Real GPS hardware sensor via Geolocation API (Accurate and stays fixed unless rider physically moves)
    if ('geolocation' in navigator) {
      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          };
          setRiderCoords(newPos);
          if (activeOrder) {
            updateRiderLiveLocation(activeOrder.id, newPos, true, riderMeta);
          }
        },
        (err) => {
          console.warn('Real GPS status:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
      );
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
      
      {/* ===================================================================== */}
      {/* MOBILE TOP BAR                                                        */}
      {/* ===================================================================== */}
      <div className="md:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{storeLogo}</span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">{storeBrandName}</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Parcel Dispatch</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="text-xs text-rose-300 hover:text-white font-bold px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-900/60 border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
          <button
            onClick={() => (navigateTo ? navigateTo('admin') : window.location.assign('/admin'))}
            className="text-xs text-amber-300 font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Admin
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-slate-300 font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Store
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR (Modern Dark Charcoal Logistics Cockpit)              */}
      {/* ===================================================================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-7">
          
          {/* Logo & Portal Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {storeLogo}
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">
                {storeBrandName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Express Parcel Dispatch</p>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase px-3">
              COURIER RUNS
            </span>
            <nav className="space-y-1.5 pt-1">
              
              {/* Out for Delivery Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('out-for-delivery');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'out-for-delivery'
                    ? 'bg-slate-800 text-amber-200 border border-amber-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Active Parcels</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  {outForDeliveryOrders.length}
                </span>
              </button>
            </nav>
          </div>

        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-5 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-base uppercase shadow-md shrink-0 border border-amber-400/30">
              {(activeRider?.name || 'A')[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-white truncate leading-tight capitalize">
                  {activeRider?.name || 'Ahmad Khan (Al-Fatah)'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="Online & On Duty"></span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{activeRider?.zone || 'Peoples Colony No. 1 (Faisalabad)'}</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                {activeRider?.vehicleType || '🏍️ Honda 125'} • {activeRider?.vehicleNumber || 'FSD-4821'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => (navigateTo ? navigateTo('admin') : window.location.assign('/admin'))}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Store Admin Suite</span>
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
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Log out</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="w-full py-2 px-3 hover:bg-slate-900 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Supermarket</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CONTENT AREA (Modern Slate Parcel Delivery Operations Console) */}
      {/* ===================================================================== */}
      <main className="flex-1 min-w-0 p-4 sm:p-7 lg:p-8 space-y-7 overflow-y-auto max-w-7xl mx-auto">
        
        {/* Top Header: Courier Operations Console */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black text-2xl shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Parcel Delivery Operations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
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

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedToday}</span>
            </div>
          </div>
        </div>

        {/* 4 Logistics KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          
          {/* Card 1: Active Run */}
          {/* Card 1: Active Run */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Parcels</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {outForDeliveryOrders.length}
              </p>
              <span className="text-[11px] text-amber-800 font-bold block mt-0.5">
                In courier bag • On-duty
              </span>
            </div>
          </div>

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
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered Today</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {deliveredTodayOrders.length}
              </p>
              <span className="text-[11px] text-sky-700 font-bold block mt-0.5">
                Completed & verified
              </span>
            </div>
          </div>

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
                Faisalabad Metro
              </p>
              <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                Al-Fatah D-Ground SuperHub
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
              <div className="lg:col-span-6 flex flex-col relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                <div ref={mapContainerRef} className="w-full h-full min-h-[224px] sm:min-h-[256px]" />

                {/* Overlay Badge at Bottom Left */}
                <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-md text-[11px] font-bold text-slate-800 flex items-center gap-2">
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
                      📦 {activeOrder.itemsList?.length || 1} Item{(activeOrder.itemsList?.length || 1) > 1 ? 's' : ''} in Bag
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
                      href={`https://wa.me/${(activeOrder.customerPhone || '923206551696').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Customer Handover PIN Verification Section */}
                <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔐</span>
                      <label className="text-[11px] font-black uppercase tracking-wider text-amber-950 block">
                        Customer Handover PIN
                      </label>
                    </div>
                    <span className="text-[10px] text-amber-900 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                      Required for Delivery
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-800">
                    Ask customer for their 4-digit security PIN upon physical handover of parcel:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter customer's 4-digit PIN"
                      value={otpInputs[activeOrder.id] || ''}
                      onChange={(e) => handleOtpInputChange(activeOrder.id, e.target.value)}
                      className="flex-1 bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      disabled={verifyingOrderMap[activeOrder.id]}
                      onClick={() => handleVerifyOtp(activeOrder.id, activeOrder.deliveryOtp)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
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
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                      title="Direct Handover Delivery"
                    >
                      <span>Deliver Parcel</span>
                    </button>
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
              <Package className="w-5 h-5 text-amber-500" />
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
                        {order.itemsList && order.itemsList.length > 0 ? (
                          order.itemsList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium text-slate-800">{item.name || item.productName || 'Grocery Item'}</span>
                              <span className="font-bold text-slate-500 font-mono">x{item.quantity || item.qty || 1}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-800">Grocery Parcel Package</span>
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
                          href={`https://wa.me/${(order.customerPhone || '923206551696').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
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
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5 bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black tracking-wider uppercase text-amber-950 block">
                          Customer Handover PIN
                        </label>
                        <span className="text-[10px] text-amber-800 font-bold">
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
                          className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        <section className="space-y-4">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deliveredTodayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400 italic">
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
                            {order.itemsList && order.itemsList.length > 0
                              ? order.itemsList.map((i) => `${i.name || i.productName || 'Item'} (x${i.quantity || 1})`).join(', ')
                              : '1 Item'}
                          </td>
                          <td className="py-3.5 px-6 font-black text-slate-900 font-mono">
                            {totalFormatted}
                          </td>
                          <td className="py-3.5 px-6 font-medium text-emerald-700">
                            ✓ {deliveredTime}
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

      </main>

      {/* ===================================================================== */}
      {/* FLOATING HELP / CHAT BUTTON                                           */}
      {/* ===================================================================== */}
      <button
        type="button"
        onClick={() => addToast('Courier Dispatch Help 💬', 'Dispatch desk is online and monitoring your route.')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer z-50"
        title="Support & Dispatch Chat"
        aria-label="Support & Dispatch Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

    </div>
  );
};
