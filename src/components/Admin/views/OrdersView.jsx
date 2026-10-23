import React, { useState, useMemo } from 'react';
import {
  Lock,
  Search,
  Calendar,
  ChevronDown,
  Clock,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
  Truck,
  ExternalLink,
  MessageSquare,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Check,
  Ban,
  Boxes,
  Rocket
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { DeliverToStaffModal } from '../modals/DeliverToStaffModal';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';
import { sanitizeOrder } from '../../../utils/orderSanitizer';

// Helper: Extract human-readable order items count/summary safely (never returns an object/array)
const formatOrderItemsSummary = (ord) => {
  if (!ord) return 'Items';
  if (typeof ord.items === 'string' && ord.items.trim()) return ord.items;
  if (Array.isArray(ord.items) && ord.items.length > 0) {
    return `${ord.items.length} item${ord.items.length > 1 ? 's' : ''}`;
  }
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) {
    return `${ord.rawItems.length} item${ord.rawItems.length > 1 ? 's' : ''}`;
  }
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) {
    return `${ord.orderItems.length} item${ord.orderItems.length > 1 ? 's' : ''}`;
  }
  return '1 item';
};

// Helper: Extract list of items for detailed receipt/drawer inspection
const getOrderItemsList = (ord) => {
  if (!ord) return [];
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) return ord.rawItems;
  if (Array.isArray(ord.items) && ord.items.length > 0) return ord.items;
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) return ord.orderItems;
  return [];
};

// Helper: Format detailed comma-separated items line matching Image 2
const formatDetailedItemsLine = (ord) => {
  if (!ord) return '—';
  const list = getOrderItemsList(ord);
  if (Array.isArray(list) && list.length > 0) {
    return list
      .map((it) => {
        const base = `${it.quantity || it.qty || 1}× ${it.name || it.productName || it.title || 'Item'}`;
        if (it.isSubstituted && it.originalProduct) {
          return `${base} [🔄 Substituted, was: ${it.originalProduct.name}]`;
        }
        return base;
      })
      .join(', ');
  }
  if (typeof ord.items === 'string') return ord.items;
  return '1× Item';
};

// Helper: Safely get customer display name (handles string, object, or fallback)
const getCustomerDisplayName = (customerVal, fallback = 'Customer') => {
  if (!customerVal) return fallback;
  if (typeof customerVal === 'string') return customerVal;
  if (typeof customerVal === 'object') {
    return customerVal.name || customerVal.fullName || customerVal.customerName || fallback;
  }
  return fallback;
};

// Helper: Render status pill badge matching Image 2
const renderStatusBadge = (status) => {
  const s = String(status || 'Pending').toLowerCase();
  if (s === 'prepared' || s === 'ready' || s === 'ready for dispatch' || s === 'ready(dispatched)') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
        <span className="w-2 h-2 rounded-full bg-[#059669]" />
        <span>Prepared</span>
      </span>
    );
  }
  if (s === 'pending' || s === 'pending_kitchen') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Pending</span>
      </span>
    );
  }
  if (s === 'preparing' || s === 'processing' || s === 'packed' || s === 'picking') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span>Preparing</span>
      </span>
    );
  }
  if (s === 'dispatched' || s === 'out for delivery') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span>Dispatched</span>
      </span>
    );
  }
  if (s === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Completed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      <span>{status || 'Pending'}</span>
    </span>
  );
};

export const OrdersView = ({ onNavigateToCustomers }) => {
  const {
    customerOrders,
    adminOrders,
    customers,
    assignRiderToOrder,
    getEligibleRidersForOrder,
    pickupStaff = [],
    assignPickupStaffToOrder,
    updateDeliveryOrderStatus,
    updateOrderStatus,
    addToast,
    adminRole,
    currentTenant,
    user,
    allBranches = [],
    currentBranchFilter = 'all',
    setCurrentBranchFilter
  } = useStore();

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [selectedRiderMap, setSelectedRiderMap] = useState({});
  const [selectedStaffMap, setSelectedStaffMap] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliverToStaffOrder, setDeliverToStaffOrder] = useState(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  const tenantStaff = useMemo(() => {
    const activeTenant = currentTenant?.id || user?.tenantId || 'tenant-alfatah';
    return (pickupStaff || []).filter(
      (s) => isSameTenant(s.tenantId || s.companyId, activeTenant) && (s.status === 'Active' || !s.status)
    );
  }, [pickupStaff, currentTenant?.id, user?.tenantId]);

  const handleAssignPickupStaff = async (orderId) => {
    const staffId = selectedStaffMap[orderId];
    if (!staffId) {
      addToast('Select Pickup Staff 📦', 'Please select a pickup staff member from the dropdown first.', 'error');
      return;
    }
    if (assignPickupStaffToOrder) {
      const ok = assignPickupStaffToOrder(orderId, staffId);
      if (ok) {
        if (selectedOrder && selectedOrder.id === orderId) {
          const staffObj = tenantStaff.find((s) => s.id === staffId);
          setSelectedOrder((prev) => (prev ? {
            ...prev,
            pickupStaffId: staffId,
            pickupStaffName: staffObj?.name || 'Pickup Staff',
            status: 'Deliver to Staff'
          } : null));
        }
      }
    }
  };

  const tenantBranches = useMemo(() => {
    const activeTenant = currentTenant?.id || user?.tenantId;
    return (allBranches || []).filter((b) => isSameTenant(b.tenantId, activeTenant));
  }, [allBranches, currentTenant?.id, user?.tenantId]);

  // Combine live orders filtered strictly by active supermarket branch (prioritizing Delivered status)
  const liveOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])].map(sanitizeOrder);
    const uniqueMap = new Map();
    const getStatusRank = (st) => {
      const s = String(st || '').toLowerCase();
      if (s === 'delivered') return 7;
      if (s === 'out for delivery' || s === 'dispatched to rider' || s === 'dispatched') return 6;
      if (s === 'ready for dispatch' || s === 'ready') return 5;
      if (s === 'prepared') return 4;
      if (s === 'packed' || s === 'picking' || s === 'preparing') return 3;
      if (s === 'deliver to staff' || s === 'delivered to staff' || s === 'received by pickup staff') return 2;
      return 1;
    };

    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId || ord._id)) {
        const bareKey = String(ord.id || ord.orderId || ord._id).replace(/^#/, '').trim().toLowerCase();
        const cust = String(ord.customer || ord.customerName || '').toLowerCase();
        if (bareKey === 'cu5011' || cust.includes('danish qureshi') || cust.includes('hamza tariq') || cust.includes('zainab merchant')) return;
        const existing = uniqueMap.get(bareKey);
        if (!existing) {
          uniqueMap.set(bareKey, ord);
        } else {
          const rankExisting = getStatusRank(existing.status);
          const rankOrd = getStatusRank(ord.status);
          const preferOrd =
            rankOrd >= rankExisting ||
            (ord.isDispatchedByStaff && !existing.isDispatchedByStaff) ||
            (ord.assignedRider && !existing.assignedRider) ||
            (ord.pickupStaffId && !existing.pickupStaffId);

          const base = preferOrd ? { ...existing, ...ord } : { ...ord, ...existing };
          if (existing.pickupStaffName && !base.pickupStaffName) base.pickupStaffName = existing.pickupStaffName;
          if (existing.pickupStaffId && !base.pickupStaffId) base.pickupStaffId = existing.pickupStaffId;
          if (existing.assignedRider && !base.assignedRider) base.assignedRider = existing.assignedRider;
          if (existing.isDispatchedByStaff || ord.isDispatchedByStaff) base.isDispatchedByStaff = true;
          if (ord.pickupStep === 'verified' || existing.pickupStep === 'verified') base.pickupStep = 'verified';
          if (base.isDispatchedByStaff && (!base.status || base.status === 'Pending')) {
            base.status = 'Prepared';
          }
          uniqueMap.set(bareKey, base);
        }
      }
    });
    const raw = Array.from(uniqueMap.values());
    const isSuperAdmin = user?.role === 'superadmin' || adminRole === 'superadmin' || user?.isSuperAdmin;
    const targetTenantId = isSuperAdmin ? null : (user?.tenantId || currentTenant?.id);
    let list = raw;
    if (targetTenantId) {
      list = list.filter((o) => {
        const idLower = String(o.id || o.orderId || o._id || '').toLowerCase();

        // 1. Direct match on order ID prefix
        if ((idLower.startsWith('#cu') || idLower.startsWith('cu-') || idLower.startsWith('ord-cu') || idLower.includes('-cu-') || idLower.includes('caseup')) && isSameTenant(targetTenantId, 'tenant-chaseup')) {
          return true;
        }
        if ((idLower.startsWith('#cv') || idLower.startsWith('cv-') || idLower.startsWith('ord-cv') || idLower.includes('-cv-')) && isSameTenant(targetTenantId, 'tenant-chasevalue')) {
          return true;
        }
        if ((idLower.includes('701') || idLower.startsWith('#af') || idLower.startsWith('af-')) && isSameTenant(targetTenantId, 'tenant-alfatah')) {
          return true;
        }
        if ((idLower.includes('83459') || idLower.startsWith('#fm') || idLower.startsWith('fm-')) && isSameTenant(targetTenantId, 'tenant-freshmart')) {
          return true;
        }

        // 2. Direct tenant property match
        if (o.tenantId && isSameTenant(o.tenantId, targetTenantId)) return true;
        if (o.companyId && isSameTenant(o.companyId, targetTenantId)) return true;

        const orderTenant =
          o.tenantId ||
          o.companyId ||
          o.tenantName ||
          o.storeName ||
          o.tenant ||
          o.items?.[0]?.tenantId ||
          o.rawItems?.[0]?.tenantId ||
          o.orderItems?.[0]?.tenantId;

        if (orderTenant && isSameTenant(orderTenant, targetTenantId)) {
          return true;
        }

        const rawItemList = Array.isArray(o.rawItems)
          ? o.rawItems
          : Array.isArray(o.orderItems)
          ? o.orderItems
          : Array.isArray(o.items)
          ? o.items
          : [];

        const hasCaseValue = rawItemList.some((it) => {
          const n = String(it?.name || it?.productName || '').toLowerCase();
          const b = String(it?.brand || '').toLowerCase();
          return n.includes('chase value') || n.includes('case value') || b.includes('chase value') || b.includes('case value') || isSameTenant(it?.tenantId, 'tenant-chasevalue');
        });
        if (hasCaseValue && isSameTenant(targetTenantId, 'tenant-chasevalue')) return true;

        const hasChaseUp = rawItemList.some((it) => {
          const n = String(it?.name || it?.productName || '').toLowerCase();
          const b = String(it?.brand || '').toLowerCase();
          return n.includes('chase up') || n.includes('case up') || n.includes('caseup') || b.includes('chase up') || b.includes('case up') || b.includes('caseup') || isSameTenant(it?.tenantId, 'tenant-chaseup');
        });
        if (hasChaseUp && isSameTenant(targetTenantId, 'tenant-chaseup')) return true;

        if (!orderTenant) {
          const id = idLower;
          if (id.includes('701') || id.includes('af')) return isSameTenant('tenant-alfatah', targetTenantId);
          if (id.includes('fm') || id.includes('83459')) return isSameTenant('tenant-freshmart', targetTenantId);
          if (id.includes('cv')) return isSameTenant('tenant-chasevalue', targetTenantId);
          if (id.includes('cu') || id.includes('caseup')) return isSameTenant('tenant-chaseup', targetTenantId);
          return false;
        }

        return false;
      });
    }

    // Branch scoping:
    // If a specific branch is selected in the store admin dropdown, filter by that branch if it belongs to this tenant
    const isFilterBelongToTenant = tenantBranches.some((b) => (b._id || b.id) === currentBranchFilter);
    if (currentBranchFilter && currentBranchFilter !== 'all' && isFilterBelongToTenant) {
      list = list.filter((o) => o.branchId === currentBranchFilter);
    } else if (user?.branchId && user?.role !== 'admin' && user?.role !== 'store_admin') {
      list = list.filter((o) => !o.branchId || o.branchId === user.branchId);
    }

    return list;
  }, [customerOrders, adminOrders, currentTenant, user?.tenantId, user?.branchId, user?.role, currentBranchFilter, tenantBranches]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = liveOrders.length;
    const pending = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return ['pending', 'confirmed', 'order placed'].includes(s);
    }).length;
    const deliverToStaff = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return ['deliver to staff', 'delivered to staff', 'received by pickup staff'].includes(s);
    }).length;
    const preparing = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return ['preparing', 'processing', 'picking', 'packed'].includes(s);
    }).length;
    const prepared = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return ['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(s) || o.isDispatchedByStaff;
    }).length;
    const outForDelivery = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return ['out for delivery', 'dispatched to rider', 'dispatched', 'in transit'].includes(s);
    }).length;
    const delivered = liveOrders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s === 'delivered' || o.isDelivered;
    }).length;
    const cancelled = liveOrders.filter((o) => String(o.status || '').toLowerCase() === 'cancelled').length;

    return { total, pending, deliverToStaff, preparing, prepared, outForDelivery, delivered, cancelled };
  }, [liveOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((o) => {
      const s = String(o.status || 'Pending').toLowerCase();
      // Tab filter
      if (activeTab === 'Pending' && !['pending', 'confirmed', 'order placed', 'deliver to staff', 'delivered to staff'].includes(s)) return false;
      if (activeTab === 'Preparing' && !['preparing', 'processing', 'picking', 'packed'].includes(s)) return false;
      if (activeTab === 'Prepared' && !['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(s) && !o.isDispatchedByStaff) return false;
      if (
        activeTab === 'Out for Delivery' &&
        !['out for delivery', 'dispatched to rider', 'dispatched', 'in transit'].includes(s)
      )
        return false;
      if (activeTab === 'Delivered' && s !== 'delivered' && !o.isDelivered) return false;
      if (activeTab === 'Cancelled' && s !== 'cancelled') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = o.id && String(o.id).toLowerCase().includes(q);
        const custNameStr = getCustomerDisplayName(o.customer || o.customerName, '');
        const matchesCustomer = custNameStr && custNameStr.toLowerCase().includes(q);
        const matchesEmail = typeof o.customerEmail === 'string' && o.customerEmail.toLowerCase().includes(q);
        const matchesPhone = typeof o.customerPhone === 'string' && o.customerPhone.toLowerCase().includes(q);
        const matchesAddress = (typeof o.address === 'string' ? o.address : (o.shippingAddress?.address || '')).toLowerCase().includes(q);
        const matchesCity = (typeof o.city === 'string' ? o.city : (o.shippingAddress?.city || '')).toLowerCase().includes(q);
        const matchesBranch = (o.branchName || '').toLowerCase().includes(q) || (o.branchId || '').toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesPhone && !matchesAddress && !matchesCity && !matchesBranch)
          return false;
      }

      return true;
    });
  }, [liveOrders, activeTab, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    let resolvedStatus = newStatus;
    if (newStatus === 'Completed' || newStatus === 'Complete') resolvedStatus = 'Delivered';
    if (newStatus === 'Dispatched' || newStatus === 'Dispatch') resolvedStatus = 'Out for Delivery';

    const cleanTarget = String(orderId || '').replace(/^#/, '').toLowerCase().trim();
    const ord = (liveOrders || []).find((o) => {
      const oId = String(o.id || o.orderId || o._id || '').replace(/^#/, '').toLowerCase().trim();
      return oId === cleanTarget || String(o.id || '').toLowerCase() === String(orderId || '').toLowerCase() || String(o.orderId || '').toLowerCase() === String(orderId || '').toLowerCase();
    });

    if (resolvedStatus === 'Out for Delivery' && !ord?.assignedRider) {
      await handleAssignRider(orderId);
      return;
    }

    if (updateOrderStatus) {
      await updateOrderStatus(orderId, resolvedStatus);
    } else if (updateDeliveryOrderStatus) {
      await updateDeliveryOrderStatus(orderId, resolvedStatus);
    }

    if (selectedOrder) {
      const selId = String(selectedOrder.id || selectedOrder.orderId || '').replace(/^#/, '').toLowerCase().trim();
      if (selId === cleanTarget || selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: resolvedStatus } : null));
      }
    }

    addToast(
      resolvedStatus === 'Delivered' ? 'Order Completed ✅' : 'Status Updated 📦',
      `Order #${cleanTarget.toUpperCase()} status updated to ${resolvedStatus}.`
    );
  };

  const handleAssignRider = async (orderId, explicitRiderId) => {
    const cleanId = String(orderId || '').replace(/^#/, '').toLowerCase().trim();
    const ord = (liveOrders || []).find((o) => {
      const oId = String(o.id || o.orderId || o._id || '').replace(/^#/, '').toLowerCase().trim();
      return oId === cleanId || String(o.id || '').toLowerCase() === String(orderId || '').toLowerCase() || String(o.orderId || '').toLowerCase() === String(orderId || '').toLowerCase();
    });

    const eligible = (ord && getEligibleRidersForOrder ? getEligibleRidersForOrder(ord) : []) || [];
    const firstEligibleId = eligible?.[0]?.id || eligible?.[0]?._id || eligible?.[0]?.riderId;

    const riderId =
      (explicitRiderId && explicitRiderId !== 'undefined' ? explicitRiderId : '') ||
      selectedRiderMap[orderId] ||
      selectedRiderMap[cleanId] ||
      selectedRiderMap[`#${cleanId}`] ||
      ord?.assignedRider?.id ||
      ord?.assignedRider?._id ||
      firstEligibleId;

    if (!riderId) {
      addToast('Add Rider in Fleet View 🛵', 'No courier registered yet for this store. Please add a rider in the Delivery / Fleet tab first.', 'error');
      return;
    }
    if (assignRiderToOrder) {
      await assignRiderToOrder(orderId, riderId, 'Out for Delivery', true);
      const targetRider = (riders || []).find((r) =>
        r.id === riderId || r._id === riderId || r.riderId === riderId || r.name === riderId
      ) || (eligible && eligible[0]);

      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId || String(selectedOrder.id).replace(/^#/, '').toLowerCase().trim() === cleanId)) {
        if (targetRider) {
          setSelectedOrder((prev) => ({
            ...prev,
            status: 'Out for Delivery',
            assignedRider: {
              id: targetRider.id || targetRider._id || riderId,
              name: targetRider.name,
              phone: targetRider.phone,
              vehicle: targetRider.vehicleNumber || targetRider.vehicleType
            }
          }));
        }
      }
      addToast('Dispatched to Rider 🚀', `Order #${cleanId.toUpperCase()} assigned to ${targetRider?.name || 'Rider'} and is Out for Delivery.`);
    }
  };

  // Helper: Open customer profile modal from order customer details
  const openCustomerDetailsModal = (customerName, customerEmail, customerPhone, customerAddress) => {
    const cleanName = getCustomerDisplayName(customerName, 'Customer');
    const cleanEmail = typeof customerEmail === 'string' ? customerEmail : '';
    const cleanPhone = typeof customerPhone === 'string' ? customerPhone : '';
    const cleanAddr = typeof customerAddress === 'string' ? customerAddress : (customerAddress?.address || 'Lahore');

    // Look up in customers directory or build profile
    const existing = (customers || []).find(
      (c) =>
        (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail.toLowerCase()) ||
        (cleanPhone && c.phone && c.phone === cleanPhone) ||
        (c.name && cleanName && c.name.toLowerCase() === cleanName.toLowerCase())
    );

    // Find all past orders placed by this customer
    const customerOrderHistory = liveOrders.filter((o) => {
      const oCustName = getCustomerDisplayName(o.customer || o.customerName, '');
      const matchName = oCustName && cleanName && oCustName.toLowerCase() === cleanName.toLowerCase();
      const matchEmail = cleanEmail && o.customerEmail && o.customerEmail.toLowerCase() === cleanEmail.toLowerCase();
      const matchPhone = cleanPhone && o.customerPhone && o.customerPhone === cleanPhone;
      return matchName || matchEmail || matchPhone;
    });

    const totalSpentCalculated = customerOrderHistory.reduce(
      (sum, ord) => sum + (Number(ord.total) || Number(ord.totalAmount) || 0),
      0
    );

    const customerObj = {
      name: cleanName || existing?.name || 'Customer',
      email: cleanEmail || existing?.email || 'customer@freshmart.pk',
      phone: cleanPhone || existing?.phone || '+92 300 1234567',
      address: cleanAddr || existing?.address || 'House 12, Johar Town, Lahore',
      totalOrders: customerOrderHistory.length || existing?.totalOrders || 1,
      totalSpent: totalSpentCalculated > 0 ? `Rs. ${totalSpentCalculated.toLocaleString()}` : existing?.totalSpent || 'Rs. 0',
      history: customerOrderHistory,
      joinedDate: existing?.joinedDate || 'Active Customer'
    };

    setSelectedCustomerModal(customerObj);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Prepared':
      case 'Ready for Dispatch':
      case 'Ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Out for Delivery':
      case 'Dispatched to Rider':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Deliver to Staff':
      case 'Delivered to Staff':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold';
      case 'Confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{currentTenant?.name || 'Store'} Orders</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {liveOrders.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, manage, and fulfill customer orders for {currentTenant?.name || 'this supermarket'} in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              window.print();
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>

          <div className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-300 animate-ping" />
            <span>Live Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* All Orders */}
        <div
          onClick={() => setActiveTab('All')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'All'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500">All Orders</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
              <ShoppingBag className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total volume</span>
        </div>

        {/* Pending (Awaiting Processing) */}
        <div
          onClick={() => setActiveTab('Pending')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Pending'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-amber-700">Pending</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900">{stats.pending}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Awaiting Staff</span>
        </div>

        {/* Deliver to Staff */}
        <div
          onClick={() => setActiveTab('Deliver to Staff')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Deliver to Staff'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-indigo-700">Staff Desk</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
              <Boxes className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-950">{stats.deliverToStaff}</div>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">At Packing Desk</span>
        </div>

        {/* Preparing */}
        <div
          onClick={() => setActiveTab('Preparing')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Preparing'
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-700">Preparing</span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              <Package className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.preparing}</div>
          <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">In Packing</span>
        </div>

        {/* Prepared (Ready for Dispatch) */}
        <div
          onClick={() => setActiveTab('Prepared')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Prepared'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700">Prepared</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-950">{stats.prepared}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Ready to Dispatch</span>
        </div>

        {/* Out for Delivery */}
        <div
          onClick={() => setActiveTab('Out for Delivery')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Out for Delivery'
              ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-purple-700">In Transit</span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
              <Truck className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.outForDelivery}</div>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">Out for Delivery</span>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setActiveTab('Delivered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Delivered'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700">Delivered</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.delivered}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Completed</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('Cancelled')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Cancelled'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-rose-700">Cancelled</span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
              <AlertCircle className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.cancelled}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">Cancelled</span>
        </div>

      </div>

      {/* 3. Main Orders Workspace (Table + Optional Side Drawer) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Table & Search Card */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-100 shadow-card p-5 sm:p-6 space-y-5">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by order ID, customer, phone, address, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Branch Filter or Scope Badge */}
              {user?.branchId ? (
                <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-2xl px-3 py-2 text-xs font-bold shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>📍 {user.branchName || 'Branch Scoped'}</span>
                </div>
              ) : tenantBranches.length > 0 ? (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={currentBranchFilter}
                    onChange={(e) => setCurrentBranchFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">🏢 All Branches</option>
                    {tenantBranches.map((b) => (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        📍 {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Tabs Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: 'All', count: stats.total },
              { label: 'Pending', count: stats.pending, sub: 'Awaiting Processing' },
              { label: 'Preparing', count: stats.preparing, sub: 'Staff Packing' },
              { label: 'Prepared', count: stats.prepared, sub: 'Ready for Rider' },
              { label: 'Out for Delivery', count: stats.outForDelivery, sub: 'With Courier' },
              { label: 'Delivered', count: stats.delivered },
              { label: 'Cancelled', count: stats.cancelled }
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.label
                    ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/20'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {liveOrders.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                📦
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base">No Customer Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  When a customer completes checkout, their order will appear here with delivery address details for you to assign a fleet courier.
                </p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 bg-slate-50/40 rounded-2xl">
              No orders found matching "{search}" in {activeTab}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3.5 pl-2">Customer</th>
                    <th className="pb-3.5">Branch</th>
                    <th className="pb-3.5">Type</th>
                    <th className="pb-3.5">Items</th>
                    <th className="pb-3.5">Total & Payment</th>
                    <th className="pb-3.5">Fulfillment & Rider</th>
                    <th className="pb-3.5 pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => {
                    const customerName = getCustomerDisplayName(ord.customer || ord.customerName);
                    const customerPhone = typeof ord.customerPhone === 'string' ? ord.customerPhone : (ord.customer?.phone || ord.phone || '+92 300 0000000');
                    const orderType = ord.orderType || (ord.table ? 'Dine-In' : 'Delivery');
                    const tableRef = ord.table || '—';
                    const itemsLine = formatDetailedItemsLine(ord);
                    const paymentBadgeLabel = `${ord.paymentMethod || 'JAZZCASH'} · ${ord.paymentStatus || 'PENDING'}`.toUpperCase();
                    const eligibleRiders = getEligibleRidersForOrder ? getEligibleRidersForOrder(ord) : [];
                    const orderIsReady = Number(ord.fulfillmentStage || 0) >= 4 || ord.status === 'Ready for Dispatch';

                    return (
                      <tr
                        key={ord.id}
                        className="transition-colors group hover:bg-slate-50/70"
                      >
                        {/* 1. Customer Column */}
                        <td className="py-4 pl-2 min-w-[140px]">
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-amber-800 transition-colors">
                              {customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {customerPhone}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">
                              #{String(ord.id).replace(/^#/, '')}
                            </span>
                          </div>
                        </td>

                        {/* Branch Column */}
                        <td className="py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                            <MapPin className="w-3 h-3 text-sky-600" />
                            <span>{ord.branchName || (ord.branchId === 'branch_um_fsd' ? 'Peoples Colony' : 'Main Branch')}</span>
                          </span>
                        </td>

                        {/* 2. Type Column (Delivery / Dine-in with optional table) */}
                        <td className="py-3 text-slate-700 font-medium whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {orderType}{ord.table ? ` • #${ord.table}` : ''}
                          </span>
                        </td>

                        {/* 4. Items Column (1× Truffle Angus Burger, 1× Cold Brew Coffee) */}
                        <td className="py-4 max-w-[240px]">
                          <p className="text-slate-800 text-xs font-semibold leading-relaxed line-clamp-2">
                            {itemsLine}
                          </p>
                        </td>

                        {/* 5. Total & Payment Column (Rs 1,620.00, JAZZCASH · PENDING, 🔍 Verify Deposit) */}
                        <td className="py-4 font-mono min-w-[150px]">
                          <div>
                            <span className="font-black text-slate-900 text-xs block">
                              Rs {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                            </span>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-block ${
                                  ord.paymentStatus === 'Verified' || ord.isPaymentVerified
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                                }`}
                              >
                                {paymentBadgeLabel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Fulfillment & Rider Column */}
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-start gap-1.5 min-w-[170px] max-w-[220px]">
                            {(() => {
                              const hasPickupStaff = Boolean(ord.pickupStaffId || ord.pickupStaffName || ord.pickupStaff);
                              const isDispatchedByStaff =
                                ['prepared', 'ready for dispatch', 'ready', 'dispatched', 'out for delivery', 'delivered', 'dispatched to rider'].includes(String(ord.status || '').toLowerCase()) ||
                                Boolean(ord.isDispatchedByStaff || ord.isDispatched || ord.readyForDispatchAt || ord.preparedAt || ord.pickupStep === 'verified' || Number(ord.fulfillmentStage) >= 4);

                              const isDeliveredState = ord.status === 'Delivered' || ord.isDelivered;
                              const isInTransitState = !isDeliveredState && (ord.assignedRider || ['out for delivery', 'dispatched to rider', 'dispatched', 'in transit'].includes(String(ord.status || '').toLowerCase()));

                              // 1. Delivered state
                              if (isDeliveredState) {
                                return (
                                  <div className="flex flex-col gap-1 w-full">
                                    <div className="text-[11px] text-emerald-800 font-bold whitespace-nowrap flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Delivered & Verified</span>
                                    </div>
                                    {ord.assignedRider && (
                                      <span className="text-[10px] text-slate-500 font-medium pl-1 truncate">
                                        🛵 {ord.assignedRider.name}
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              // 2. In Transit with Rider
                              if (isInTransitState) {
                                const riderName = ord.assignedRider?.name || 'Assigned Courier';
                                return (
                                  <div className="bg-sky-50 border border-sky-200/90 rounded-lg p-2 w-full shadow-2xs space-y-1.5">
                                    <div className="text-[11px] font-bold text-sky-900 flex items-center justify-between gap-1">
                                      <span className="truncate flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
                                        🛵 {riderName}
                                      </span>
                                      {ord.deliveryOtp && (
                                        <span className="font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1 rounded text-[9px]">
                                          #{ord.deliveryOtp}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-sky-700 font-medium">
                                      <span>In Transit</span>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(ord.id || ord.orderId, 'Delivered')}
                                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                                        title="Mark order Completed"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>Complete</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              // 3. Prepared or Unassigned Rider
                              const orderKey = ord.id || ord.orderId || ord._id;
                              const cleanOrderKey = String(orderKey).replace(/^#/, '').trim();
                              const defaultRiderId = eligibleRiders?.[0]?.id || eligibleRiders?.[0]?._id || eligibleRiders?.[0]?.riderId || '';
                              const currentChosenRider =
                                selectedRiderMap[orderKey] ||
                                selectedRiderMap[cleanOrderKey] ||
                                selectedRiderMap[`#${cleanOrderKey}`] ||
                                ord.assignedRider?.id ||
                                ord.assignedRider?._id ||
                                defaultRiderId;

                              return (
                                <div className="flex flex-col gap-1.5 w-full">
                                  {isDispatchedByStaff || ord.status === 'Prepared' ? (
                                    <div className="flex items-center justify-between text-[10px] font-bold px-2 py-0.5 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 shadow-2xs">
                                      <span className="truncate flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>Ready for Dispatch</span>
                                      </span>
                                      {ord.deliveryOtp && (
                                        <span className="font-mono text-[9px] text-emerald-900 font-bold">#{ord.deliveryOtp}</span>
                                      )}
                                    </div>
                                  ) : hasPickupStaff ? (
                                    <div className="flex items-center justify-between text-[10px] font-bold px-2 py-0.5 rounded-lg text-amber-900 bg-amber-50 border border-amber-200">
                                      <span className="truncate">⏳ Staff: {ord.pickupStaffName || 'Preparing...'}</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0 ml-1"></span>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] font-medium flex items-center justify-between px-2 py-0.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200">
                                      <div className="flex items-center gap-1 truncate">
                                        <Package className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span className="truncate">Awaiting Staff</span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 w-full">
                                    <select
                                      value={currentChosenRider}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedRiderMap((prev) => ({
                                          ...prev,
                                          [orderKey]: val,
                                          [cleanOrderKey]: val,
                                          [`#${cleanOrderKey}`]: val
                                        }));
                                      }}
                                      disabled={eligibleRiders.length === 0}
                                      className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-1 min-w-0"
                                    >
                                      {eligibleRiders.length === 0 && <option value="">No riders available</option>}
                                      {eligibleRiders.map((r) => {
                                        const rId = r.id || r._id || r.riderId;
                                        return (
                                          <option key={rId} value={rId}>
                                            🛵 {r.name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleAssignRider(orderKey, currentChosenRider)}
                                      disabled={!currentChosenRider || eligibleRiders.length === 0}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-40 flex items-center gap-1"
                                      title="Dispatch order to this rider"
                                    >
                                      <Rocket className="w-2.5 h-2.5" />
                                      <span>Dispatch</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>

                        {/* 7. Status Column */}
                        <td className="py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-start gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={
                                  ['out for delivery', 'dispatched to rider', 'dispatched'].includes(String(ord.status || '').toLowerCase())
                                    ? 'Out for Delivery'
                                    : ['delivered', 'completed'].includes(String(ord.status || '').toLowerCase()) || ord.isDelivered
                                    ? 'Delivered'
                                    : ['prepared', 'ready for dispatch', 'ready'].includes(String(ord.status || '').toLowerCase()) || ord.isDispatchedByStaff
                                    ? 'Prepared'
                                    : ord.status || 'Pending'
                                }
                                onChange={(e) => handleStatusChange(ord.id || ord.orderId, e.target.value)}
                                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold py-1 px-2.5 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
                                title="Change Order Status"
                              >
                                <option value="Pending">⏳ Pending</option>
                                <option value="Deliver to Staff">📦 Deliver to Staff</option>
                                <option value="Preparing">🍳 Preparing</option>
                                <option value="Prepared">📦 Prepared (Ready for Dispatch)</option>
                                <option value="Ready for Dispatch">✨ Ready for Dispatch</option>
                                <option value="Out for Delivery">🚀 Dispatch to Rider (Out for Delivery)</option>
                                <option value="Dispatched">🚀 Dispatched</option>
                                <option value="Delivered">✅ Completed (Delivered)</option>
                                <option value="Cancelled">❌ Cancelled</option>
                              </select>
                            </div>

                            {/* 1-Click Quick Action Buttons */}
                            {(() => {
                              const s = String(ord.status || '').toLowerCase();
                              const isPrepared = s === 'prepared' || s === 'ready for dispatch' || ord.isDispatchedByStaff;
                              const isDispatched = s === 'out for delivery' || s === 'dispatched' || s === 'dispatched to rider' || Boolean(ord.assignedRider);
                              const isCompleted = s === 'delivered' || ord.isDelivered;

                              if (isCompleted) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Completed</span>
                                  </span>
                                );
                              }

                              if (isDispatched) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(ord.id || ord.orderId, 'Delivered')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                    title="Mark completed"
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Mark Completed</span>
                                  </button>
                                );
                              }

                              if (isPrepared) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const orderKey = ord.id || ord.orderId || ord._id;
                                      const cleanOrderKey = String(orderKey).replace(/^#/, '').trim();
                                      const defaultRiderId = eligibleRiders?.[0]?.id || eligibleRiders?.[0]?._id || eligibleRiders?.[0]?.riderId || '';
                                      const riderToAssign =
                                        selectedRiderMap[orderKey] ||
                                        selectedRiderMap[cleanOrderKey] ||
                                        defaultRiderId;
                                      if (!riderToAssign) {
                                        addToast('Add Rider in Fleet View 🛵', 'No courier registered yet for this store. Please add a rider in the Delivery / Fleet tab first.', 'error');
                                        return;
                                      }
                                      handleAssignRider(orderKey, riderToAssign);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                    title="Dispatch to Rider now"
                                  >
                                    <Rocket className="w-2.5 h-2.5" />
                                    <span>Dispatch to Rider</span>
                                  </button>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredOrders.length} of {liveOrders.length} orders
            </span>
            <span className="text-[11px] text-slate-400">Status updates come from pickup staff and riders.</span>
          </div>

        </div>

        {/* Right Side Drawer / Order Details Panel matching Screenshot */}
        {selectedOrder && (
          <aside className="w-full lg:w-[420px] shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-5 animate-in slide-in-from-right-4 duration-200">
            
            {/* Header: Order ID & Close */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 font-mono">
                    Order {selectedOrder.id}
                  </h3>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {selectedOrder.dateFormatted || 'Today'} • {selectedOrder.time || '10:30 AM'}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    <MapPin className="w-3 h-3 text-sky-600" />
                    <span>{selectedOrder.branchName || (selectedOrder.branchId === 'branch_um_fsd' ? 'Peoples Colony Dark Store' : 'Main Branch')}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({selectedOrder.tenantName || 'Supermarket'})</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Information Card (with click to inspect history!) */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Information</span>
                </span>
                
                <button
                  onClick={() =>
                    openCustomerDetailsModal(
                      selectedOrder.customer,
                      selectedOrder.customerEmail,
                      selectedOrder.customerPhone,
                      selectedOrder.address
                    )
                  }
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View History</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {getCustomerDisplayName(selectedOrder.customer || selectedOrder.customerName)}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : (selectedOrder.customer?.phone || '+92 300 1234567')}
                  </p>
                  {selectedOrder.customerEmail && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {typeof selectedOrder.customerEmail === 'string' ? selectedOrder.customerEmail : (selectedOrder.customer?.email || '')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : '03001234567'}`}
                    className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs"
                    title="Call customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() =>
                      addToast('Message Copied 💬', `Customer phone ${typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : '03001234567'} ready to WhatsApp.`)
                    }
                    className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs"
                    title="Send message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  Delivery Address
                </span>
                <p className="text-slate-700 text-[11px] font-medium leading-snug">
                  {typeof selectedOrder.address === 'string' ? selectedOrder.address : (selectedOrder.shippingAddress?.address || '123 Main Street, Sector B, Johar Town, Lahore')}
                </p>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Order Items ({getOrderItemsList(selectedOrder).length || 1})</span>
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {getOrderItemsList(selectedOrder).length > 0 ? (
                  getOrderItemsList(selectedOrder).map((item, idx) => {
                    const itemName = typeof item === 'object' ? item.name || 'Order Item' : String(item);
                    const itemQty = typeof item === 'object' ? item.quantity || 1 : 1;
                    const itemPrice = typeof item === 'object' ? Number(item.price || 0) : 0;
                    const itemUnit = typeof item === 'object' && item.unit ? `• ${item.unit}` : '';
                    const itemImg = typeof item === 'object' && item.image
                      ? item.image
                      : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80';

                    return (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 truncate text-xs">{itemName}</h5>
                            {item.isSubstituted && item.originalProduct && (
                              <div className="mt-0.5 space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                                  <span>🔄 Substituted</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  Originally: <strong className="text-slate-700">{item.originalProduct.name}</strong> (Rs. {item.originalProduct.price})
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Qty: {itemQty} {itemUnit}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 font-mono shrink-0">
                          Rs. {(itemPrice * itemQty).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-medium text-slate-700">
                    <span>
                      {typeof selectedOrder.items === 'string' && selectedOrder.items.trim()
                        ? selectedOrder.items
                        : 'Standard Order Items'}
                    </span>
                    <span className="font-bold font-mono">
                      Rs. {Number(selectedOrder.total || selectedOrder.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {Number(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {selectedOrder.deliveryCharges ? `Rs. ${selectedOrder.deliveryCharges}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-emerald-700 font-mono">
                  Rs. {Number(selectedOrder.total || selectedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="font-bold text-slate-900 block">{selectedOrder.payment || 'Cash on Delivery'}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Payment Status: Paid / Verified</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                PAID
              </span>
            </div>

            {/* Rider Assignment Section in Drawer */}
            <div className="pt-2">
              <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-slate-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Courier / Delivery Rider</span>
                  </span>
                  {selectedOrder.assignedRider && (
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Assigned
                    </span>
                  )}
                </div>

                {selectedOrder.assignedRider ? (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">🛵 {selectedOrder.assignedRider.name}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Active Run</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {selectedOrder.assignedRider.phone || selectedOrder.assignedRider.vehicle}
                    </div>
                    {selectedOrder.deliveryOtp && (
                      <div className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg mt-1 flex items-center justify-between">
                        <span>Handover PIN:</span>
                        <span className="font-mono text-sm tracking-widest">#{selectedOrder.deliveryOtp}</span>
                      </div>
                    )}
                  </div>
                ) : (() => {
                  const drawerKey = selectedOrder.id || selectedOrder.orderId || selectedOrder._id;
                  const cleanDrawerKey = String(drawerKey).replace(/^#/, '').trim();
                  const eligibleList = (getEligibleRidersForOrder ? getEligibleRidersForOrder(selectedOrder) : []) || riders || [];
                  const defaultDrawerRiderId = eligibleList[0]?.id || eligibleList[0]?._id || eligibleList[0]?.riderId || '';
                  const currentDrawerRider =
                    selectedRiderMap[drawerKey] ||
                    selectedRiderMap[cleanDrawerKey] ||
                    selectedRiderMap[`#${cleanDrawerKey}`] ||
                    defaultDrawerRiderId;

                  return (
                    <div className="space-y-2">
                      <select
                        value={currentDrawerRider}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedRiderMap((prev) => ({
                            ...prev,
                            [drawerKey]: val,
                            [cleanDrawerKey]: val,
                            [`#${cleanDrawerKey}`]: val
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        {eligibleList.length === 0 && <option value="">No riders available</option>}
                        {eligibleList.map((r) => {
                          const rId = r.id || r._id || r.riderId;
                          return (
                            <option key={rId} value={rId}>
                              🛵 {r.name} {r.distanceKm > 0 ? `· ${r.distanceKm.toFixed(1)}km` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignRider(drawerKey, currentDrawerRider)}
                        disabled={!currentDrawerRider && eligibleList.length === 0}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Dispatch to Rider</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment status</span>
                {renderStatusBadge(selectedOrder.status)}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">Change Status:</label>
                <select
                  value={
                    ['out for delivery', 'dispatched to rider', 'dispatched'].includes(String(selectedOrder.status || '').toLowerCase())
                      ? 'Out for Delivery'
                      : ['delivered', 'completed'].includes(String(selectedOrder.status || '').toLowerCase()) || selectedOrder.isDelivered
                      ? 'Delivered'
                      : ['prepared', 'ready for dispatch', 'ready'].includes(String(selectedOrder.status || '').toLowerCase()) || selectedOrder.isDispatchedByStaff
                      ? 'Prepared'
                      : selectedOrder.status || 'Pending'
                  }
                  onChange={(e) => handleStatusChange(selectedOrder.id || selectedOrder.orderId, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="Pending">⏳ Pending (Order Confirmed)</option>
                  <option value="Deliver to Staff">📦 Deliver to Staff</option>
                  <option value="Preparing">🍳 Preparing (Dark Store Packing)</option>
                  <option value="Prepared">📦 Prepared (Ready for Dispatch)</option>
                  <option value="Ready for Dispatch">✨ Ready for Dispatch (Packed)</option>
                  <option value="Out for Delivery">🚀 Dispatch to Rider (Out for Delivery)</option>
                  <option value="Dispatched">🚀 Dispatched</option>
                  <option value="Delivered">✅ Completed (Delivered)</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                {(!selectedOrder.assignedRider || ['prepared', 'ready for dispatch', 'ready'].includes(String(selectedOrder.status || '').toLowerCase()) || selectedOrder.isDispatchedByStaff) && selectedOrder.status !== 'Delivered' && !selectedOrder.isDelivered && (
                  <button
                    type="button"
                    onClick={() => {
                      const drawerKey = selectedOrder.id || selectedOrder.orderId || selectedOrder._id;
                      const eligibleList = (getEligibleRidersForOrder ? getEligibleRidersForOrder(selectedOrder) : []) || riders || [];
                      const defaultDrawerRiderId = eligibleList[0]?.id || eligibleList[0]?._id || eligibleList[0]?.riderId || '';
                      const riderToAssign = selectedRiderMap[drawerKey] || defaultDrawerRiderId;
                      handleAssignRider(drawerKey, riderToAssign);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>🚀 Dispatch Order to Rider</span>
                  </button>
                )}

                <div className="flex gap-2">
                  {selectedOrder.status !== 'Delivered' && !selectedOrder.isDelivered && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.orderId, 'Delivered')}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 shadow-2xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Order</span>
                    </button>
                  )}
                  {selectedOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.orderId, 'Cancelled')}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* 4. CUSTOMER PROFILE & ORDER HISTORY MODAL (Matching User's Diagram!) */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerModal(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lime-300 text-base border border-white/10 shadow-inner">
                  {selectedCustomerModal.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{selectedCustomerModal.name}</h3>
                  <p className="text-xs text-emerald-200">Customer Profile & Order History</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Contact Information Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {selectedCustomerModal.phone}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email:</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono truncate max-w-[220px]">
                    {selectedCustomerModal.email}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/50">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Address:</span>
                  </span>
                  <span className="font-medium text-slate-700 text-right leading-snug text-[11px]">
                    {selectedCustomerModal.address}
                  </span>
                </div>
              </div>

              {/* Lifetime Metrics Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Total Orders Placed
                  </span>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    {selectedCustomerModal.totalOrders}
                  </div>
                </div>

                <div className="p-3.5 bg-teal-50/70 border border-teal-200/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                    Total Lifetime Spent
                  </span>
                  <div className="text-2xl font-black text-teal-950 font-mono">
                    {selectedCustomerModal.totalSpent}
                  </div>
                </div>
              </div>

              {/* Recent Orders History List (Matching User's ASCII Diagram) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recent Orders History ({selectedCustomerModal.history?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Click order to inspect</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomerModal.history && selectedCustomerModal.history.length > 0 ? (
                    selectedCustomerModal.history.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setSelectedCustomerModal(null);
                        }}
                        className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 hover:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 transition-colors">
                            📦
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                                {order.id}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {order.dateFormatted || order.time || 'Recent'} • {formatOrderItemsSummary(order)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            Rs. {Number(order.total || order.totalAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center justify-end gap-0.5">
                            <span>Details</span>
                            <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No order history found for this customer.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {onNavigateToCustomers && (
                <button
                  onClick={() => {
                    setSelectedCustomerModal(null);
                    onNavigateToCustomers();
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>View Full Profile in Customers</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}


      {/* Deliver Parcel to Staff Modal */}
      {deliverToStaffOrder && (
        <DeliverToStaffModal
          order={deliverToStaffOrder}
          isOpen={Boolean(deliverToStaffOrder)}
          onClose={() => setDeliverToStaffOrder(null)}
          onSuccess={(updates) => {
            if (selectedOrder && selectedOrder.id === deliverToStaffOrder.id) {
              setSelectedOrder((prev) => ({ ...prev, ...updates }));
            }
          }}
        />
      )}

    </div>
  );
};
