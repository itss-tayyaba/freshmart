import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Bike,
  UserPlus,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Package,
  Zap,
  Star,
  Search,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Building,
  Navigation,
  ExternalLink,
  ArrowRight,
  Copy,
  Flame,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Key
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { PAKISTAN_CITIES } from '../../../data/pakistanLocations';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';

export const PAKISTAN_REGIONS = [
  // Lahore
  { name: 'Lahore - Gulberg / Main Hub', city: 'Lahore', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Lahore - DHA Phase 5 & 6', city: 'Lahore', latitude: 31.4826, longitude: 74.4074 },
  { name: 'Lahore - Johar Town & Model Town', city: 'Lahore', latitude: 31.4697, longitude: 74.2728 },
  { name: 'Lahore - Bahria Town & Canal Road', city: 'Lahore', latitude: 31.3673, longitude: 74.1787 },
  { name: 'Lahore - Cantt & Mall Road', city: 'Lahore', latitude: 31.5546, longitude: 74.3572 },
  { name: 'Lahore - Faisal Town & Garden Town', city: 'Lahore', latitude: 31.4872, longitude: 74.3129 },
  // Karachi
  { name: 'Karachi - Clifton Block 2-5', city: 'Karachi', latitude: 24.8270, longitude: 67.0251 },
  { name: 'Karachi - DHA Phase 6 & 8', city: 'Karachi', latitude: 24.8010, longitude: 67.0680 },
  { name: 'Karachi - Gulshan-e-Iqbal', city: 'Karachi', latitude: 24.9180, longitude: 67.0971 },
  { name: 'Karachi - North Nazimabad', city: 'Karachi', latitude: 24.9312, longitude: 67.0372 },
  { name: 'Karachi - PECHS & Tariq Road', city: 'Karachi', latitude: 24.8716, longitude: 67.0599 },
  // Islamabad & Rawalpindi
  { name: 'Islamabad - F-6 / F-7 / Blue Area', city: 'Islamabad', latitude: 33.7215, longitude: 73.0565 },
  { name: 'Islamabad - G-10 / G-11 / F-10', city: 'Islamabad', latitude: 33.6844, longitude: 73.0479 },
  { name: 'Islamabad - DHA & Bahria Enclave', city: 'Islamabad', latitude: 33.5353, longitude: 73.1895 },
  { name: 'Rawalpindi - Saddar / Cantt', city: 'Rawalpindi', latitude: 33.5973, longitude: 73.0479 },
  { name: 'Rawalpindi - Bahria Town Phase 1-8', city: 'Rawalpindi', latitude: 33.5138, longitude: 73.0977 },
  // Faisalabad
  { name: 'Faisalabad - D Ground Commercial', city: 'Faisalabad', latitude: 31.4110, longitude: 73.0980 },
  { name: 'Faisalabad - Peoples Colony No 1 & 2', city: 'Faisalabad', latitude: 31.4050, longitude: 73.1090 },
  { name: 'Faisalabad - Madina Town & Kohinoor', city: 'Faisalabad', latitude: 31.4326, longitude: 73.1118 },
  // Multan
  { name: 'Multan - Bosan Road & Gulgasht', city: 'Multan', latitude: 30.2244, longitude: 71.4889 },
  { name: 'Multan - Cantt & Abdali Road', city: 'Multan', latitude: 30.1984, longitude: 71.4687 },
  // Peshawar
  { name: 'Peshawar - University Town & Hayatabad', city: 'Peshawar', latitude: 34.0151, longitude: 71.5249 },
  // Other
  { name: 'Gujranwala - Model Town & DC Colony', city: 'Gujranwala', latitude: 32.1877, longitude: 74.1945 },
  { name: 'Sialkot - Cantt & Paris Road', city: 'Sialkot', latitude: 32.4945, longitude: 74.5229 }
];

// Helper component: Live Elapsed Timer (Ticks every second matching Pickup Staff portal)
const ElapsedTimer = ({ createdAt, fallbackSeconds = 34 }) => {
  const [elapsed, setElapsed] = useState(() => {
    if (!createdAt) return fallbackSeconds;
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return diff > 0 ? diff : fallbackSeconds;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-center rounded-xl min-w-[64px] shadow-2xs">
      <span className="font-mono font-black text-emerald-800 text-xs tracking-wider block leading-none">
        {mins}:{secs}
      </span>
      <span className="text-[8px] font-black uppercase tracking-widest text-[#059669] block mt-0.5">
        ELAPSED
      </span>
    </div>
  );
};

export const DeliveryView = () => {
  const {
    riders = [],
    addRider,
    updateRider,
    deleteRider,
    clearAllRiders,
    toggleRiderStatus,
    customerOrders = [],
    adminOrders = [],
    assignRiderToOrder,
    getEligibleRidersForOrder,
    updateDeliveryOrderStatus,
    verifyOrderDeliveryOtp,
    currency = 'PKR',
    addToast,
    adminRole,
    user,
    allBranches = [],
    branches = [],
    currentBranch,
    currentTenant,
    navigateTo
  } = useStore();

  const isAdmin = adminRole === 'admin' || adminRole === 'superadmin';

  // Get only the real branch and areas that are actually added or configured for this store
  // Do NOT auto-inject fake/unreal mock branches
  const availableBranches = useMemo(() => {
    const canonicalTenantId = resolveTenantId ? resolveTenantId(currentTenant?.id) : (currentTenant?.id || 'company_002');

    // 1. Check branches explicitly added by user in allBranches for this store
    const storeAddedBranches = (allBranches || []).filter(
      (b) =>
        b &&
        (b.status === 'active' || b.status === 'Active' || !b.status) &&
        (b.tenantId === canonicalTenantId || b.tenantId === currentTenant?.id || isSameTenant(b.tenantId, currentTenant?.id))
    );

    if (storeAddedBranches.length > 0) {
      return storeAddedBranches;
    }

    // 2. Real hubs explicitly configured on the store/tenant (from SuperAdmin Manage store settings)
    if (currentTenant?.hubs && Array.isArray(currentTenant.hubs) && currentTenant.hubs.length > 0) {
      return currentTenant.hubs.map((hubName, idx) => ({
        _id: `hub_${currentTenant.id || 'curr'}_${idx}`,
        id: `hub_${currentTenant.id || 'curr'}_${idx}`,
        name: hubName,
        tenantId: currentTenant?.id || 'tenant-chaseup',
        city: currentTenant?.city || 'Faisalabad',
        latitude: 31.4125,
        longitude: 73.0915,
        deliveryRadius: 15,
        status: 'active'
      }));
    }

    // 3. Fallback: single real primary branch for current store — DO NOT inject unadded fake branches!
    const realBranchName = `${currentTenant?.name || 'Store'} (Faisalabad Flagship Hub)`;
    return [
      {
        _id: `real_branch_${currentTenant?.id || 'main'}`,
        id: `real_branch_${currentTenant?.id || 'main'}`,
        name: realBranchName,
        tenantId: currentTenant?.id || 'tenant-chaseup',
        city: currentTenant?.city || 'Faisalabad',
        latitude: 31.4125,
        longitude: 73.0915,
        deliveryRadius: 15,
        status: 'active'
      }
    ];
  }, [allBranches, currentTenant]);

  const [activeSubTab, setActiveSubTab] = useState('fleet'); // 'fleet' | 'queue' | 'delivered'
  const [searchRider, setSearchRider] = useState('');
  const [filterZone, setFilterZone] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedRiderMap, setSelectedRiderMap] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [targetOtpOrder, setTargetOtpOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Modal State for Adding New Rider by Admin
  const [isAddRiderModalOpen, setIsAddRiderModalOpen] = useState(false);
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [customRegionName, setCustomRegionName] = useState('');

  const initialBranch = availableBranches[0] || {
    name: 'Mall of Faisalabad Flagship (Faisalabad)',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0915,
    deliveryRadius: 15
  };

  const [newRiderForm, setNewRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: '',
    branchId: initialBranch.id || initialBranch._id || '',
    branchName: initialBranch.name,
    region: 'Samanabad',
    zone: 'Samanabad',
    city: initialBranch.city || 'Faisalabad',
    latitude: String(initialBranch.latitude || 31.4125),
    longitude: String(initialBranch.longitude || 73.0915),
    coverageRadiusKm: String(initialBranch.deliveryRadius || initialBranch.coverageRadiusKm || 15),
    status: 'Active',
    cnic: '',
    username: '',
    password: 'rider123'
  });

  const [showRiderPassword, setShowRiderPassword] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [editRiderForm, setEditRiderForm] = useState({
    id: '',
    name: '',
    username: '',
    phone: '',
    region: '',
    password: '',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: ''
  });
  const [showEditRiderPassword, setShowEditRiderPassword] = useState(false);

  // Selected rider for mobile app simulator
  const [simulatedRiderId, setSimulatedRiderId] = useState(riders[0]?.id || '');

  // Filter riders - show all riders if no riders match the active tenant (fallback to all)
  const storeRiders = useMemo(() => {
    const tId = currentTenant?.id || user?.tenantId;
    if (!tId || adminRole === 'superadmin') return riders || [];
    const tenantMatched = (riders || []).filter(
      (r) => !r.tenantId || isSameTenant(r.tenantId, tId) || r.isGlobal
    );
    // Fallback: if no riders match this store's tenant, show all riders so fleet is never empty
    return tenantMatched.length > 0 ? tenantMatched : (riders || []);
  }, [riders, currentTenant?.id, user?.tenantId, adminRole]);

  // Filter riders based on search and branch/zone
  const filteredRiders = storeRiders.filter((r) => {
    const query = searchRider.toLowerCase().trim();
    if (!query) return true;
    const riderRegion = String(r.branchName || r.region || r.zone || '').toLowerCase();
    const matchesSearch =
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.phone && r.phone.includes(query)) ||
      (r.username && r.username.toLowerCase().includes(query)) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(query)) ||
      riderRegion.includes(query);
    const matchesZone =
      filterZone === 'All' ||
      riderRegion.includes(filterZone.toLowerCase()) ||
      (r.branchId && String(r.branchId) === String(filterZone));
    return matchesSearch && matchesZone;
  });

  // Unified Orders List (Deduplicated with Delivered state prioritized and filtered strictly by tenant)
  const allOrdersList = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])];
    const uniqueMap = new Map();
    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId || ord._id)) {
        const bareKey = String(ord.id || ord.orderId || ord._id).replace(/^#/, '').trim().toLowerCase();
        const cust = String(ord.customer || ord.customerName || '').toLowerCase();
        if (bareKey === 'cu5011' || cust.includes('danish qureshi') || cust.includes('hamza tariq') || cust.includes('zainab merchant')) return;
        const existing = uniqueMap.get(bareKey);
        if (!existing) {
          uniqueMap.set(bareKey, ord);
        } else if (ord.status === 'Delivered' || ord.isDelivered || Number(ord.fulfillmentStage) >= 4) {
          uniqueMap.set(bareKey, ord);
        }
      }
    });
    const list = Array.from(uniqueMap.values());
    const isSuperAdmin = user?.role === 'superadmin' || adminRole === 'superadmin' || user?.isSuperAdmin;
    const targetTenantId = isSuperAdmin ? null : (user?.tenantId || currentTenant?.id);
    if (!targetTenantId) return list;
    return list.filter((ord) => {
      const orderTenant =
        ord.tenantId ||
        ord.companyId ||
        ord.tenantName ||
        ord.storeName ||
        ord.tenant ||
        ord.items?.[0]?.tenantId ||
        ord.rawItems?.[0]?.tenantId ||
        ord.orderItems?.[0]?.tenantId;

      const rawItemList = Array.isArray(ord.rawItems)
        ? ord.rawItems
        : Array.isArray(ord.orderItems)
        ? ord.orderItems
        : Array.isArray(ord.items)
        ? ord.items
        : [];
      const hasCaseValue = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase value') || n.includes('case value') || b.includes('chase value') || b.includes('case value') || isSameTenant(it?.tenantId, 'tenant-chasevalue');
      });
      if (hasCaseValue && isSameTenant(targetTenantId, 'tenant-chasevalue')) return true;
      if (hasCaseValue && !isSameTenant(targetTenantId, 'tenant-chasevalue')) return false;

      const hasChaseUp = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase up') || n.includes('case up') || n.includes('caseup') || b.includes('chase up') || b.includes('case up') || b.includes('caseup') || isSameTenant(it?.tenantId, 'tenant-chaseup');
      });
      if (hasChaseUp && isSameTenant(targetTenantId, 'tenant-chaseup')) return true;
      if (hasChaseUp && !isSameTenant(targetTenantId, 'tenant-chaseup')) return false;

      if (!orderTenant) {
        const id = String(ord.id || ord.orderId || '').toLowerCase();
        if (id.includes('701') || id.includes('af')) return isSameTenant('tenant-alfatah', targetTenantId);
        if (id.includes('fm') || id.includes('83459')) return isSameTenant('tenant-freshmart', targetTenantId);
        if (id.includes('cv')) return isSameTenant('tenant-chasevalue', targetTenantId);
        if (id.startsWith('#cu') || id.startsWith('cu-') || id.startsWith('ord-cu') || id.includes('-cu-') || id.includes('caseup')) return isSameTenant('tenant-chaseup', targetTenantId);
        return false;
      }
      return isSameTenant(orderTenant, targetTenantId);
    });
  }, [customerOrders, adminOrders, currentTenant?.id, user?.tenantId]);

  // KPI Metrics scoped to this store
  const activeRidersCount = storeRiders.filter((r) => r.status === 'On-Duty' || r.status === 'Busy').length;
  const totalDeliveries = storeRiders.reduce((sum, r) => sum + (r.deliveriesCount || 0), 0);

  const pendingDispatches = useMemo(() => {
    return allOrdersList.filter((o) => {
      if (adminRole === 'rider') {
        const assignedRiderId = o.assignedRider?.id || o.assignedRider?.riderId;
        return (
          assignedRiderId === (user?.riderId || user?.id) &&
          o.status !== 'Delivered'
        );
      }
      return o.status !== 'Delivered';
    });
  }, [allOrdersList, adminRole, user]);

  const completedDeliveries = useMemo(() => {
    return allOrdersList.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      const isDel = s === 'delivered' || o.isDelivered || Number(o.fulfillmentStage) >= 4;
      if (adminRole === 'rider') {
        const assignedRiderId = o.assignedRider?.id || o.assignedRider?.riderId;
        return (
          assignedRiderId === (user?.riderId || user?.id) && isDel
        );
      }
      return isDel;
    }).sort((a, b) => {
      const timeA = new Date(a.deliveredAt || a.fulfillmentUpdatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.deliveredAt || b.fulfillmentUpdatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [allOrdersList, adminRole, user]);

  const [queueFilter, setQueueFilter] = useState('active'); // 'active' | 'delivered' | 'all'

  const queueOrders = useMemo(() => {
    if (queueFilter === 'delivered') return completedDeliveries;
    if (queueFilter === 'all') return allOrdersList;
    return pendingDispatches;
  }, [queueFilter, completedDeliveries, allOrdersList, pendingDispatches]);

  const handleAssignRiderToOrder = (orderId, riderId) => {
    const rId = riderId || selectedRiderMap[orderId];
    if (!rId) {
      addToast('Select Rider', 'Please choose an available courier from the list.', 'error');
      return;
    }
    assignRiderToOrder(orderId, rId);
    setSelectedRiderMap((prev) => ({ ...prev, [orderId]: '' }));
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    addToast('Copied to Clipboard', `${label} copied: ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBranchSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomRegion(true);
      setNewRiderForm((prev) => ({
        ...prev,
        branchId: 'custom',
        branchName: customRegionName || 'Custom Area',
        region: customRegionName || 'Custom Area',
        zone: customRegionName || 'Custom Area'
      }));
    } else {
      setIsCustomRegion(false);
      const found = availableBranches.find((b) => (b.id || b._id || b.name) === val || b.name === val);
      if (found) {
        setNewRiderForm((prev) => ({
          ...prev,
          branchId: found.id || found._id || '',
          branchName: found.name,
          region: `${found.name} (${found.city || 'Faisalabad'})`,
          zone: found.name,
          city: found.city || 'Faisalabad',
          latitude: String(found.latitude || 31.4125),
          longitude: String(found.longitude || 73.0915),
          coverageRadiusKm: String(found.deliveryRadius || found.coverageRadiusKm || 15)
        }));
      }
    }
  };

  const handleCustomRegionNameChange = (val) => {
    setCustomRegionName(val);
    setNewRiderForm((prev) => ({
      ...prev,
      branchName: val,
      region: val,
      zone: val
    }));
  };

  const handleOpenAddRiderModal = () => {
    if (availableBranches.length > 0 && !isCustomRegion) {
      const activeBr = availableBranches.find((b) => isSameTenant(b.tenantId, currentTenant?.id)) || availableBranches[0];
      setNewRiderForm((prev) => ({
        ...prev,
        branchId: activeBr.id || activeBr._id || '',
        branchName: activeBr.name,
        region: `${activeBr.name} (${activeBr.city || 'Faisalabad'})`,
        zone: activeBr.name,
        city: activeBr.city || 'Faisalabad',
        latitude: String(activeBr.latitude || 31.4125),
        longitude: String(activeBr.longitude || 73.0915),
        coverageRadiusKm: String(activeBr.deliveryRadius || activeBr.coverageRadiusKm || 15)
      }));
    }
    setIsAddRiderModalOpen(true);
  };

  const handleAddRiderSubmit = (e) => {
    e.preventDefault();
    if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
      addToast('Missing Details', 'Please provide rider name and contact number.', 'error');
      return;
    }

    const selectedBranch = availableBranches.find(
      (b) => (b.id || b._id || b.name) === newRiderForm.branchId || b.name === newRiderForm.branchName
    ) || availableBranches[0];

    let lat = Number(newRiderForm.latitude);
    let lng = Number(newRiderForm.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      lat = selectedBranch ? Number(selectedBranch.latitude) : 31.4125;
      lng = selectedBranch ? Number(selectedBranch.longitude) : 73.0915;
    }

    const finalBranchName = isCustomRegion
      ? (customRegionName.trim() || 'Custom Area')
      : (selectedBranch?.name || newRiderForm.branchName || 'Store Branch');

    const finalRegion = isCustomRegion
      ? (customRegionName.trim() || 'Custom Area')
      : `${finalBranchName} (${selectedBranch?.city || 'Faisalabad'})`;

    const generatedUsername =
      newRiderForm.username.trim() ||
      newRiderForm.phone.trim().replace(/[^0-9]/g, '') ||
      newRiderForm.name.toLowerCase().replace(/\s+/g, '_');
    const generatedPassword = newRiderForm.password.trim() || 'rider123';
    const generatedPlate =
      newRiderForm.vehicleNumber.trim() || `FSD-${Math.floor(1000 + Math.random() * 9000)}`;

    addRider({
      name: newRiderForm.name.trim(),
      phone: newRiderForm.phone.trim(),
      vehicleType: newRiderForm.vehicleType || '🏍️ Honda 125',
      vehicleNumber: generatedPlate,
      branchId: isCustomRegion ? 'custom' : (selectedBranch?.id || selectedBranch?._id || ''),
      branchName: finalBranchName,
      city: selectedBranch?.city || currentTenant?.city || 'Faisalabad',
      region: finalRegion,
      zone: finalBranchName,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng },
      coverageRadiusKm: Number(newRiderForm.coverageRadiusKm || selectedBranch?.deliveryRadius || 15),
      status: 'Active',
      tenantId: currentTenant?.id || user?.tenantId || 'tenant-alfatah',
      tenantName: currentTenant?.name || user?.tenantName || 'Al-Fatah',
      cnic: newRiderForm.cnic ? newRiderForm.cnic.trim() : '',
      username: generatedUsername,
      password: generatedPassword,
      deliveriesCount: 0,
      rating: 5.0
    });

    setIsAddRiderModalOpen(false);
    setIsCustomRegion(false);
    setCustomRegionName('');

    const nextBr = availableBranches[0] || {};
    setNewRiderForm({
      name: '',
      phone: '',
      vehicleType: '🏍️ Honda 125',
      vehicleNumber: '',
      branchId: nextBr.id || nextBr._id || '',
      branchName: nextBr.name || 'Main Hub',
      region: 'Samanabad',
      zone: 'Samanabad',
      city: nextBr.city || '',
      latitude: String(nextBr.latitude || 31.5204),
      longitude: String(nextBr.longitude || 74.3587),
      coverageRadiusKm: String(nextBr.deliveryRadius || 15),
      status: 'Active',
      cnic: '',
      username: '',
      password: 'rider123'
    });
  };

  const handleEditRiderSubmit = (e) => {
    e.preventDefault();
    if (!editingRider) return;
    const finalPassword = editRiderForm.password?.trim() || 'rider123';
    updateRider(editingRider.id, {
      name: editRiderForm.name.trim(),
      username: editRiderForm.username ? editRiderForm.username.trim() : editingRider.username,
      phone: editRiderForm.phone.trim(),
      region: editRiderForm.region ? editRiderForm.region.trim() : editingRider.region,
      zone: editRiderForm.region ? editRiderForm.region.trim() : editingRider.zone,
      password: finalPassword,
      vehicleType: editRiderForm.vehicleType || '🏍️ Honda 125',
      vehicleNumber: editRiderForm.vehicleNumber ? editRiderForm.vehicleNumber.trim() : (editingRider.vehicleNumber || '')
    });
    addToast('Credentials Updated 🔑', `${editRiderForm.name}'s details updated successfully.`);
    setEditingRider(null);
  };

  const simulatedRider =
    (riders && riders.find((r) => r.id === simulatedRiderId)) ||
    (riders && riders[0]) ||
    null;

  const activeRiderOrder =
    simulatedRider
      ? (customerOrders || []).find(
          (o) =>
            o.status !== 'Delivered' &&
            (o.assignedRider?.id === simulatedRider?.id || o.assignedRider?.name === simulatedRider?.name)
        ) ||
        (customerOrders || []).find((o) => o.status !== 'Delivered' && o.assignedRider) ||
        null
      : null;

  const handleOpenOtpModal = (order) => {
    setTargetOtpOrder(order || activeRiderOrder);
    setEnteredOtp('');
    setOtpError('');
    setIsOtpModalOpen(true);
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.trim().length !== 4) {
      setOtpError('Please enter a 4-digit numeric handover PIN.');
      return;
    }
    const orderIdToVerify = targetOtpOrder?.id || targetOtpOrder?.orderId || activeRiderOrder?.id;
    if (!orderIdToVerify) {
      setOtpError('No active order reference found.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    const res = await verifyOrderDeliveryOtp(orderIdToVerify, enteredOtp.trim(), targetOtpOrder?.assignedRider?.id || user?.id || simulatedRider?.id);
    setIsVerifyingOtp(false);

    if (res && res.success) {
      setIsOtpModalOpen(false);
      setEnteredOtp('');
    } else {
      setOtpError(res?.message || 'Invalid handover OTP code. Ask customer for 4-digit PIN.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* ===================================================================== */}
      {/* 1. TOP HEADER: Clean Header with + Add Rider Option (No Banner)       */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛵</span>
            <span>Rider Fleet & Logistics</span>
          </h2>
          <p className="text-xs text-slate-500">Manage delivery couriers, assign regional coverage zones, and track GPS telemetry.</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddRiderModal}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Rider</span>
            </button>
          </div>
        )}
      </div>
      {/* ===================================================================== */}
      {/* 2. KEY FLEET KPI STATS (4 Vibrant Gradient Cards)                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Card 1: Pending Orders */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white rounded-3xl p-5 border border-amber-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Pending Queue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-600 font-mono">
              {pendingDispatches.length}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Orders Awaiting / Dispatched</p>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1 text-[10px] font-bold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Needs Courier Assignment</span>
          </div>
        </div>

        {/* Card 2: Active On-Duty Riders */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-emerald-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Active Couriers
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              🛵
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {activeRidersCount} <span className="text-sm font-bold text-slate-400">/ {riders.length}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Fleet On-Duty & Available</p>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Instant Dispatch Ready</span>
          </div>
        </div>

        {/* Card 3: Completed Deliveries */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-50/40 to-white rounded-3xl p-5 border border-sky-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-sky-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
              Fulfilled Orders
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
              📦
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {totalDeliveries}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Parcels Doorstep Verified</p>
          </div>
          <div className="pt-2 border-t border-sky-200/60 flex items-center gap-1 text-[10px] font-bold text-sky-700">
            <ShieldCheck className="w-3 h-3 text-sky-600" />
            <span>100% Verified Delivery</span>
          </div>
        </div>


      </div>

      {/* ===================================================================== */}
      {/* 3. SUB-NAVIGATION TABS (Modern Sleek Pill Navigation Bar)              */}
      {/* ===================================================================== */}
      <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-md inline-flex flex-wrap items-center gap-1.5 text-xs font-bold">
        {(adminRole === 'rider' ? [
          { id: 'queue', label: 'My Deliveries', icon: Package, count: pendingDispatches.length },
          { id: 'delivered', label: 'Delivered Records', icon: CheckCircle2, count: completedDeliveries.length }
        ] : [
          { id: 'fleet', label: 'Riders Fleet Manager', icon: Bike, count: storeRiders.length },
          { id: 'queue', label: 'Order Dispatch Queue', icon: Package, count: pendingDispatches.length },
          { id: 'delivered', label: 'Delivered / Completed Records', icon: CheckCircle2, count: completedDeliveries.length },
        ]).map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* SUB-VIEW 1: ORDER DISPATCH QUEUE                                      */}
      {/* ===================================================================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>Active Customer Orders Dispatch Queue</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Live Feed
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified customer delivery addresses and assign an available on-duty courier from your fleet.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQueueFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  queueFilter === 'active'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ready for Courier ({pendingDispatches.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('delivered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  queueFilter === 'delivered'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Delivered Records ({completedDeliveries.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  queueFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({allOrdersList.length})
              </button>
            </div>
          </div>

          {queueOrders.length === 0 ? (
            <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                📦
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-900">
                  {queueFilter === 'delivered' ? 'No Delivered Records in this View' : 'No Orders in Dispatch Queue'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {queueFilter === 'active' && completedDeliveries.length > 0 ? (
                    <span>All active dispatches are completed! You can view past fulfilled orders in Delivered Records.</span>
                  ) : (
                    <span>When customers place orders at checkout, they will immediately appear here for address verification and rider assignment.</span>
                  )}
                </p>
                {completedDeliveries.length > 0 && queueFilter === 'active' && (
                  <button
                    type="button"
                    onClick={() => setQueueFilter('delivered')}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>View Delivered Orders ({completedDeliveries.length}) →</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {queueOrders.map((order) => {
                const orderId = order.id || order.orderId;
                const cleanId = String(orderId).replace(/^#/, '');
                const customerName = order.customerName || order.customer || 'Valued Customer';
                const customerPhone = order.customerPhone || order.phone || '+92 300 1234567';
                const orderType = order.orderType || (order.table ? 'DINE-IN' : 'DELIVERY');
                const items = Array.isArray(order.rawItems) && order.rawItems.length > 0
                  ? order.rawItems
                  : Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : Array.isArray(order.orderItems) && order.orderItems.length > 0
                  ? order.orderItems
                  : [{ name: 'Grocery Package', quantity: 1, price: order.totalAmount || order.totalPrice || order.total || 810 }];

                const eligibleRiders = getEligibleRidersForOrder ? getEligibleRidersForOrder(order) : [];

                // Match order branch / area from available store branches
                const orderBranch = availableBranches.find(
                  (b) => (b.id || b._id) === order.branchId || b.name === order.branchName
                ) || availableBranches.find((b) => b.city?.toLowerCase() === order.city?.toLowerCase()) || currentBranch || availableBranches[0];

                // Filter riders by order's added & available branch / area
                const branchMatchedRiders = eligibleRiders.filter((r) => {
                  if (order.branchId && r.branchId === order.branchId) return true;
                  if (orderBranch?.name && (
                    (r.branchName && r.branchName.toLowerCase() === orderBranch.name.toLowerCase()) ||
                    (r.zone && r.zone.toLowerCase() === orderBranch.name.toLowerCase()) ||
                    (r.region && r.region.toLowerCase().includes(orderBranch.name.toLowerCase()))
                  )) return true;
                  return false;
                });

                const ridersToChoose = branchMatchedRiders.length > 0 ? branchMatchedRiders : eligibleRiders;
                const isUnassigned = !order.assignedRider;
                const statusRaw = (order.status || 'Ready for Dispatch').toLowerCase();
                const isReady = ['ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusRaw);
                const isDispatched = ['dispatched', 'out for delivery', 'delivered'].includes(statusRaw);

                // Status badge text
                const statusBadgeText = isReady
                  ? 'READY'
                  : statusRaw === 'out for delivery'
                  ? 'IN TRANSIT'
                  : statusRaw === 'arrived at customer'
                  ? 'ARRIVED'
                  : isDispatched
                  ? 'DISPATCHED'
                  : 'PENDING';

                return (
                  <article
                    key={orderId}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-[#d1d5db] shadow-xs hover:shadow-md transition-all overflow-hidden border-t-4 border-t-[#059669] flex flex-col justify-between"
                  >
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* TOP ROW: Order Code, Customer Info & Timer / Status Pill */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight leading-none">
                            #{cleanId}
                          </h2>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#059669] font-black">{orderType}</span>
                            <span>-</span>
                            <span className="text-slate-800">{customerName}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{customerPhone}</span>
                          </div>
                        </div>

                        {/* Right: Status Pill & Elapsed Timer Box */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full border ${
                            isReady
                              ? 'text-emerald-900 bg-[#ecfdf5] border-[#a7f3d0]'
                              : isDispatched
                              ? 'text-sky-900 bg-sky-50 border-sky-200'
                              : 'text-amber-900 bg-amber-50 border-amber-200'
                          }`}>
                            {statusBadgeText}
                          </span>
                          <ElapsedTimer createdAt={order.createdAt} />
                        </div>
                      </div>

                      {/* ITEMS ROW-WISE LIST (Exact like Pickup Staff) */}
                      <div className="space-y-1.5 pt-1.5 border-t border-[#e2e8f0]">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-[#059669]" />
                            <span>Package Items ({items.length})</span>
                          </span>
                          <span className="text-[#059669] font-mono text-[10px] font-semibold">
                            {order.deliverySlot || 'Express 10-15m'}
                          </span>
                        </div>

                        <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
                          {items.map((item, idx) => {
                            const qty = item.quantity || item.qty || 1;
                            const name = item.name || item.productName || item.title || 'Grocery Item';
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                <span className="font-bold text-slate-800 truncate">
                                  <span className="text-[#059669] font-black mr-1.5">{qty}*</span>
                                  <span>{name}</span>
                                </span>
                                <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                                  PKR {item.price || 0}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* DESTINATION ADDRESS (Compact) */}
                      <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#059669] shrink-0" />
                            <span>Destination • <strong className="text-slate-700">{order.city || 'Lahore'}</strong></span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(order.address || 'Standard Address', 'Address')}
                            className="text-[#059669] hover:underline flex items-center gap-0.5 cursor-pointer font-bold text-[10px]"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1 leading-tight">
                          {order.address || order.shippingAddress?.address || 'Customer Delivery Address, Pakistan'}
                        </p>
                      </div>

                      {/* RIDER ASSIGNMENT SECTION */}
                      <div className="pt-1.5 border-t border-[#e2e8f0] space-y-1.5">
                        {order.assignedRider ? (
                          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">🛵</span>
                              <div className="min-w-0">
                                <span className="text-[9px] text-[#059669] font-black uppercase block leading-none">Assigned Courier</span>
                                <span className="font-bold text-slate-900 text-xs truncate block">{order.assignedRider.name}</span>
                              </div>
                            </div>
                            <a
                              href={`tel:${order.assignedRider.phone}`}
                              className="px-2.5 py-1 bg-white hover:bg-[#d1fae5] text-[#059669] border border-[#a7f3d0] rounded-lg text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>Call</span>
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                              <span>Assign Fleet Courier:</span>
                              <span className="text-[#059669]">
                                {branchMatchedRiders.length > 0
                                  ? `${branchMatchedRiders.length} in ${orderBranch?.name || 'branch'}`
                                  : `${eligibleRiders.length} available`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={selectedRiderMap[orderId] || ''}
                                onChange={(e) => setSelectedRiderMap((prev) => ({ ...prev, [orderId]: e.target.value }))}
                                disabled={order.status === 'Delivered'}
                                className="flex-1 bg-white border border-[#cbd5e1] rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                <option value="">
                                  {branchMatchedRiders.length > 0
                                    ? `Choose rider (${orderBranch?.name || 'Branch'})...`
                                    : 'Choose rider...'}
                                </option>
                                {ridersToChoose.map((r) => {
                                  const isExact = branchMatchedRiders.some((bm) => bm.id === r.id);
                                  return (
                                    <option key={r.id} value={r.id}>
                                      {isExact ? '🟢 ' : '📍 '}
                                      {r.name} ({r.vehicleType || '🏍️'} • {r.branchName || r.zone || r.region || 'Courier'})
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAssignRiderToOrder(orderId)}
                                disabled={!selectedRiderMap[orderId] || order.status === 'Delivered'}
                                className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs shrink-0"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM ROW: Price on Left, Action Button on Right (Exact match to Pickup Staff) */}
                    <div className="p-3.5 sm:p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono font-black text-slate-900 text-base sm:text-lg leading-tight">
                          PKR {Number(order.totalAmount || order.totalPrice || order.total || 810).toLocaleString()}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {order.payment === 'Cash on Delivery' || !order.payment ? '💵 COD' : `💳 ${order.payment}`}
                        </span>
                      </div>

                      {adminRole === 'rider' ? (
                        <div className="flex items-center gap-1.5">
                          {order.status === 'Ready for Dispatch' && (
                            <button
                              type="button"
                              onClick={() => updateDeliveryOrderStatus(orderId, 'Dispatched')}
                              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                            >
                              Pick Up Parcel
                            </button>
                          )}
                          {order.status === 'Dispatched' && (
                            <button
                              type="button"
                              onClick={() => updateDeliveryOrderStatus(orderId, 'Out for Delivery')}
                              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                            >
                              Start Delivery
                            </button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <button
                              type="button"
                              onClick={() => updateDeliveryOrderStatus(orderId, 'Arrived at Customer')}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                            >
                              Arrived
                            </button>
                          )}
                          {order.status === 'Arrived at Customer' && (
                            <button
                              type="button"
                              onClick={() => handleOpenOtpModal(order)}
                              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 size={14} />
                              <span>Verify OTP</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {(order.status === 'Out for Delivery' || order.status === 'Arrived at Customer') && (
                            <button
                              type="button"
                              onClick={() => handleOpenOtpModal(order)}
                              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 size={13} />
                              <span>Verify OTP</span>
                            </button>
                          )}
                          {order.status !== 'Out for Delivery' && order.status !== 'Arrived at Customer' && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                              order.assignedRider
                                ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                                : 'bg-white text-slate-500 border-[#d1d5db]'
                            }`}>
                              {order.assignedRider ? '● Rider Assigned' : '○ Awaiting Rider'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 2: DELIVERED & COMPLETED ORDERS ARCHIVE                      */}
      {/* ===================================================================== */}
      {activeSubTab === 'delivered' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>Completed & Verified Deliveries Archive</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Permanent Store Records
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full delivery logs for orders completed, verified via Customer Doorstep OTP, and collected.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
                Total Delivered: <strong>{completedDeliveries.length}</strong> Orders
              </span>
            </div>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-xs space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✅
              </div>
              <h4 className="font-black text-base text-slate-900">No Delivered Orders Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When riders verify customer delivery PINs or admins mark deliveries complete, the permanent audit records will remain archived here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-3.5 pl-5">Order ID & Date</th>
                      <th className="py-3.5">Customer & Phone</th>
                      <th className="py-3.5">Delivery Address</th>
                      <th className="py-3.5">Courier</th>
                      <th className="py-3.5">Amount & Payment</th>
                      <th className="py-3.5 pr-5 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedDeliveries.map((ord) => {
                      const id = ord.id || ord.orderId;
                      const customerName = ord.customerName || ord.customer || 'Customer';
                      const customerPhone = ord.customerPhone || ord.phone || '—';
                      const address = ord.address || ord.shippingAddress?.address || '—';
                      const city = ord.city || ord.shippingAddress?.city || '';
                      const riderName = ord.assignedRider?.name || 'Assigned Courier';
                      const amount = Number(ord.total || ord.totalAmount || 0);

                      return (
                        <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 pl-5">
                            <span className="font-mono font-bold text-slate-900 block">#{String(id).replace(/^#/, '')}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Verified Delivery'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-bold text-slate-900 block">{customerName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{customerPhone}</span>
                          </td>
                          <td className="py-4 max-w-[240px]">
                            <span className="text-slate-700 block truncate" title={address}>{address}</span>
                            {city && <span className="text-[10px] text-slate-400 block">{city}</span>}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span>🛵</span>
                              <span>{riderName}</span>
                            </div>
                            {ord.assignedRider?.vehicleNumber && (
                              <span className="text-[10px] text-slate-400 font-mono block pl-5">{ord.assignedRider.vehicleNumber}</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="font-black text-slate-900 block">Rs. {amount.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              PAID · {ord.paymentMethod || 'Cash on Delivery'}
                            </span>
                          </td>
                          <td className="py-4 pr-5 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[11px] shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Delivered & Verified</span>
                            </span>
                            {ord.deliveryOtp && (
                              <span className="text-[9px] text-emerald-800 font-mono block mt-1 font-bold">
                                OTP: #{ord.deliveryOtp}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 3: RIDER FLEET MANAGEMENT (Matching Screenshot Layout)       */}
      {/* ===================================================================== */}
      {activeSubTab === 'fleet' && (
        <div className="space-y-6">
          
          {/* Top Bar matching screenshot */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Delivery Riders
            </h1>

            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders or dishes..."
                value={searchRider}
                onChange={(e) => setSearchRider(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-full pl-10 pr-4 py-2 font-medium text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div className="bg-white/90 border border-stone-200/90 rounded-full px-4 py-1.5 text-xs font-medium text-stone-600 shadow-2xs shrink-0 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Section Heading & + Add Rider button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Delivery Riders
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {filteredRiders.length} riders · max 5 active orders each
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAddRiderModal}
                className="px-5 py-2.5 bg-[#ca8a04] hover:bg-[#b47b04] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] shrink-0"
              >
                <span>+ Add Rider</span>
              </button>
            )}
          </div>

          {/* Clean Delivery Riders Table */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 bg-white">
                    <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-stone-400">NAME</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">USERNAME</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">PHONE</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">REGION</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400 text-center">ACTIVE ORDERS</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">STATUS</th>
                    <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-stone-400">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredRiders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-stone-400">
                        No delivery riders found matching "{searchRider}". Click "+ Add Rider" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredRiders.map((rider) => {
                      // Calculate real in-progress orders assigned to this rider
                      const rId = String(rider.id || rider.riderId || '').toLowerCase().trim();
                      const rName = String(rider.name || '').toLowerCase().trim();
                      const rUser = String(rider.username || '').toLowerCase().trim();

                      const activeOrdersForRider = (allOrdersList || []).filter((o) => {
                        const s = String(o.status || '').toLowerCase();
                        const isDelivered = s === 'delivered' || s === 'completed' || o.isDelivered || Number(o.fulfillmentStage) >= 4;
                        if (isDelivered) return false;

                        const assigned = o.assignedRider;
                        const assignedId = typeof assigned === 'object'
                          ? String(assigned?.id || assigned?._id || assigned?.riderId || '').toLowerCase().trim()
                          : String(assigned || '').toLowerCase().trim();
                        const assignedName = (typeof assigned === 'object'
                          ? String(assigned?.name || '')
                          : String(o.assignedRiderName || o.riderName || '')).toLowerCase().trim();

                        return (
                          (rId && assignedId && (assignedId === rId || assignedId.includes(rId) || rId.includes(assignedId))) ||
                          (rName && assignedName && (assignedName === rName || assignedName.includes(rName))) ||
                          (rUser && assignedName && (assignedName === rUser || assignedName.includes(rUser)))
                        );
                      });

                      const activeCount = activeOrdersForRider.length;
                      const isActive = rider.status === 'Active' || rider.status === 'On-Duty';

                      return (
                        <tr key={rider.id} className="hover:bg-stone-50/60 transition-colors">
                          {/* NAME */}
                          <td className="py-4 px-6 font-semibold text-stone-900 text-xs">
                            {rider.name}
                          </td>

                          {/* USERNAME */}
                          <td className="py-4 px-4 font-mono text-stone-500 text-xs">
                            {rider.username || rider.name.toLowerCase().replace(/\s+/g, '_')}
                          </td>

                          {/* PHONE */}
                          <td className="py-4 px-4 font-mono font-medium text-stone-800 text-xs">
                            {rider.phone || 'Not set'}
                          </td>

                          {/* REGION */}
                          <td className="py-4 px-4 text-stone-700 text-xs font-medium">
                            {rider.region || rider.zone || rider.branchName || 'Samanabad'}
                          </td>

                          {/* ACTIVE ORDERS */}
                          <td className="py-4 px-4 font-mono font-bold text-stone-800 text-xs text-center">
                            {activeCount}/5
                          </td>

                          {/* STATUS */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                isActive
                                  ? 'bg-[#e2ede2] text-[#366838] border border-[#ceead6]'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#2e7d32]' : 'bg-slate-400'}`}></span>
                              <span>{isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap items-center gap-2">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRider(rider);
                                    setEditRiderForm({
                                      id: rider.id,
                                      name: rider.name || '',
                                      username: rider.username || rider.name.toLowerCase().replace(/\s+/g, '_'),
                                      phone: rider.phone || '',
                                      region: rider.region || rider.zone || 'Samanabad',
                                      password: rider.password || 'rider123',
                                      vehicleType: rider.vehicleType || '🏍️ Honda 125',
                                      vehicleNumber: rider.vehicleNumber || ''
                                    });
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                                >
                                  Edit Rider
                                </button>
                              )}

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => toggleRiderStatus(rider.id)}
                                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSimulatedRiderId(rider.id);
                                  if (typeof navigateTo === 'function') {
                                    navigateTo('delivery-portal');
                                  }
                                }}
                                className="px-3 py-1 bg-[#fdf8ee] hover:bg-[#faedd4] text-[#855318] border border-[#faedd4] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Dashboard</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CUSTOMER HANDOVER OTP VERIFICATION                             */}
      {/* ===================================================================== */}

      {/* ===================================================================== */}
      {/* MODAL: CUSTOMER HANDOVER OTP VERIFICATION                             */}
      {/* ===================================================================== */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 border border-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                  🔐
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Verify Customer Handover OTP</h3>
                  <p className="text-[11px] text-slate-500">
                    Order {targetOtpOrder?.id || targetOtpOrder?.orderId || 'Active Order'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOtpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-1 text-xs">
                <span className="font-bold text-amber-950 block">Customer Verification Required</span>
                <p className="text-amber-800 text-[11px]">
                  Ask customer <strong>{targetOtpOrder?.customerName || targetOtpOrder?.customer || 'Recipient'}</strong> for the 4-digit Handover PIN displayed on their app.
                </p>
                {targetOtpOrder?.deliveryOtp && (
                  <div className="pt-1 flex items-center justify-between text-[10px] text-amber-700">
                    <span>Customer PIN:</span>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(targetOtpOrder.deliveryOtp)}
                      className="font-mono font-bold underline cursor-pointer hover:text-amber-950"
                    >
                      Fill: {targetOtpOrder.deliveryOtp}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-slate-700 block">Enter 4-Digit Handover OTP</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="• • • •"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError('');
                  }}
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black p-3 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 block font-mono">Master Bypass Code: 9999</span>
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                  ⚠️ {otpError}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs flex justify-between items-center font-mono">
                <span className="text-slate-500">Cash to Collect:</span>
                <span className="font-black text-emerald-700 text-sm">
                  PKR {targetOtpOrder?.totalPrice || targetOtpOrder?.totalAmount || targetOtpOrder?.total || 0}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-60"
                >
                  {isVerifyingOtp ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Complete Delivery</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMIN ADD NEW RIDER (STREAMLINED & PROFESSIONAL)              */}
      {/* ===================================================================== */}
      {isAddRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 text-xs">
            
            {/* Modal Header (Fixed at top) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-900/15">
                  🛵
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">Register Delivery Rider</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Add courier to dispatch fleet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRiderModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddRiderSubmit} className="flex flex-col flex-1 min-h-0">
              
              {/* Scrollable Form Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* 1. Full Name */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Rider Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Farooq"
                    value={newRiderForm.name}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Rider Username */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Username / Handle <span className="text-slate-400 font-normal">(Optional, e.g. hamza)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. hamza or ahmad"
                    value={newRiderForm.username}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                {/* 2. Phone Number */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Phone Number (Mobile) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">🇵🇰</span>
                    <input
                      type="tel"
                      required
                      placeholder="0300-1234567"
                      value={newRiderForm.phone}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-mono font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 3. Rider Login Password (Custom Credentials) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rider Login Password <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Rider App Access Key
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showRiderPassword ? 'text' : 'password'}
                      required
                      placeholder="Set rider password (e.g. rider123 or custom)"
                      value={newRiderForm.password}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 font-mono font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRiderPassword(!showRiderPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                      title={showRiderPassword ? "Hide password" : "Show password"}
                    >
                      {showRiderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>
                      Rider will log in with <strong>{newRiderForm.phone.trim() || 'mobile number'}</strong> & this password.
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewRiderForm({ ...newRiderForm, password: 'rider' + Math.floor(100 + Math.random() * 900) })}
                      className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>

                {/* 3. Assigned Branch & Delivery Area */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Assigned Branch & Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={isCustomRegion ? 'custom' : (newRiderForm.branchId || newRiderForm.branchName || newRiderForm.region)}
                    onChange={handleBranchSelectChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none cursor-pointer transition-all"
                  >
                    <optgroup label="Added & Available Store Branches">
                      {availableBranches.map((b) => {
                        const branchKey = b.id || b._id || b.name;
                        return (
                          <option key={branchKey} value={branchKey}>
                            🏪 {b.name} — {b.city} {b.address ? `(${b.address})` : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Custom Area">
                      <option value="custom">📍 + Add Custom Area / Location</option>
                    </optgroup>
                  </select>

                  {/* Active Branch GPS Info Badge */}
                  {!isCustomRegion && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 font-medium">
                      <span className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Assigned: <strong>{newRiderForm.branchName || newRiderForm.zone}</strong> ({newRiderForm.city || 'Active Branch'})
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 shrink-0 ml-2">
                        📍 {newRiderForm.latitude}° N, {newRiderForm.longitude}° E
                      </span>
                    </div>
                  )}

                  {isCustomRegion && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Model Town Branch / Johar Town Area"
                        value={customRegionName}
                        onChange={(e) => handleCustomRegionNameChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Login Credentials Confirmation Notice */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Login Credentials: Username is <strong className="font-mono text-emerald-950 font-bold">{newRiderForm.phone.trim() || 'mobile number'}</strong>, Password is <strong className="font-mono text-emerald-950 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{newRiderForm.password.trim() || 'rider123'}</strong>.
                  </span>
                </div>

              </div>

              {/* Modal Footer (Sticky & Always Visible at Bottom) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddRiderModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Register Rider 🛵
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ✏️ EDIT RIDER & CREDENTIALS MODAL */}
      {editingRider && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
                  ✏️
                </div>
                <div>
                  <h2 className="font-black text-base leading-tight">Edit Courier & Password</h2>
                  <p className="text-[11px] text-emerald-100">Update credentials for {editingRider.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRider(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditRiderSubmit} className="p-6 space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Rider Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRiderForm.name}
                  onChange={(e) => setEditRiderForm({ ...editRiderForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRiderForm.username}
                  onChange={(e) => setEditRiderForm({ ...editRiderForm, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Phone Number (Login ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editRiderForm.phone}
                  onChange={(e) => setEditRiderForm({ ...editRiderForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Region / Delivery Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRiderForm.region}
                  onChange={(e) => setEditRiderForm({ ...editRiderForm, region: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rider Access Password <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Rider App Key
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showEditRiderPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={editRiderForm.password}
                    onChange={(e) => setEditRiderForm({ ...editRiderForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditRiderPassword(!showEditRiderPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showEditRiderPassword ? "Hide password" : "Show password"}
                  >
                    {showEditRiderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
