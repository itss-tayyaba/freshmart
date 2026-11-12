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
  Key,
  MessageCircle
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { PAKISTAN_CITIES, calculateDistanceKm } from '../../../data/pakistanLocations';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';
import { getWhatsAppDeliveryLink } from '../../../utils/whatsappHelper';
import { normalizeOrderTenantId } from '../../../utils/orderScope';
import { DeliveryZoneView } from './DeliveryZoneView';

export const FAISALABAD_DELIVERY_SECTORS = [
  {
    id: 'ZONE-FSD-CENTRAL-BLUE',
    name: 'Central Region (D-Ground & Peoples Colony)',
    shortName: 'Central Sector',
    color: '#2563eb',
    center: [31.4125, 73.0950],
    neighborhoods: [
      'Peoples Colony 1',
      'Peoples Colony 2',
      'D-Ground Commercial',
      'Batala Colony',
      'Jaranwala Road',
      'ChenOne Road',
      'Civil Lines'
    ]
  },
  {
    id: 'ZONE-FSD-NORTH-GREEN',
    name: 'North-East Region (Susan Road & Canal Road)',
    shortName: 'North-East Sector',
    color: '#16a34a',
    center: [31.4350, 73.1350],
    neighborhoods: [
      'Susan Road',
      'Madina Town',
      'East Canal Road',
      'Kohinoor City',
      'Fateh Abad',
      'Gatwala Commercial'
    ]
  },
  {
    id: 'ZONE-FSD-WEST-ORANGE',
    name: 'West-South Region (Samanabad & Clock Tower)',
    shortName: 'West-South Sector',
    color: '#ea580c',
    center: [31.3980, 73.0550],
    neighborhoods: [
      'Samanabad',
      'Clock Tower / 8 Bazaars',
      'Gulberg Colony',
      'Main Jhang Road',
      'D-Type Colony',
      'Allama Iqbal Colony'
    ]
  }
];

export const getSectorForBranch = (branch) => {
  if (!branch) return FAISALABAD_DELIVERY_SECTORS[0];
  const name = String(branch.name || '').toLowerCase();
  if (name.includes('susan') || name.includes('canal') || name.includes('madina') || name.includes('kohinoor')) {
    return FAISALABAD_DELIVERY_SECTORS[1];
  }
  if (name.includes('samanabad') || name.includes('clock tower') || name.includes('gulberg') || name.includes('jhang')) {
    return FAISALABAD_DELIVERY_SECTORS[2];
  }
  if (name.includes('peoples colony') || name.includes('d-ground') || name.includes('batala')) {
    return FAISALABAD_DELIVERY_SECTORS[0];
  }
  const bLat = Number(branch.latitude ?? branch.coordinates?.lat ?? 31.4125);
  const bLng = Number(branch.longitude ?? branch.coordinates?.lng ?? 73.0950);
  let bestSector = FAISALABAD_DELIVERY_SECTORS[0];
  let minD = Infinity;
  for (const sector of FAISALABAD_DELIVERY_SECTORS) {
    const d = calculateDistanceKm(bLat, bLng, sector.center[0], sector.center[1]);
    if (d < minD) {
      minD = d;
      bestSector = sector;
    }
  }
  return bestSector;
};

export const PAKISTAN_REGIONS = [
  // Faisalabad
  { name: 'Faisalabad - D Ground Commercial', city: 'Faisalabad', latitude: 31.4110, longitude: 73.0980 },
  { name: 'Faisalabad - Peoples Colony No 1 & 2', city: 'Faisalabad', latitude: 31.4050, longitude: 73.1090 },
  { name: 'Faisalabad - Madina Town & Kohinoor', city: 'Faisalabad', latitude: 31.4326, longitude: 73.1118 },
  { name: 'Faisalabad - Susan Road Commercial', city: 'Faisalabad', latitude: 31.4350, longitude: 73.1350 },
  { name: 'Faisalabad - Samanabad & Clock Tower', city: 'Faisalabad', latitude: 31.3980, longitude: 73.0550 }
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

  // Get only the real branch and areas that are actually added or configured for this store in Faisalabad (FSD only)
  // Do NOT auto-inject fake/unreal mock branches or branches from other cities
  const availableBranches = useMemo(() => {
    const activeTenantId = (user?.role !== 'superadmin' && user?.tenantId)
      ? user.tenantId
      : (currentTenant?.id || user?.tenantId || 'tenant-chaseup');
    const canonicalTenantId = resolveTenantId ? resolveTenantId(activeTenantId) : activeTenantId;

    const isFsdCity = (cityStr = '') => {
      const lower = String(cityStr || '').toLowerCase().trim();
      if (!lower) return true;
      if (lower.includes('fsd') || lower.includes('faisalabad')) return true;
      if (['lahore', 'karachi', 'islamabad', 'rawalpindi', 'multan', 'peshawar', 'sialkot', 'gujranwala'].includes(lower)) return false;
      return true;
    };

    const isFsdName = (nameStr = '') => {
      const lower = String(nameStr || '').toLowerCase();
      if (lower.includes('lahore') || lower.includes('karachi') || lower.includes('islamabad') || lower.includes('multan') || lower.includes('rawalpindi')) return false;
      return true;
    };

    // 1. Check branches explicitly added by user in allBranches for this store - FILTERED TO FAISALABAD ONLY!
    const isSuperAdmin = user?.role === 'superadmin' || user?.isSuperAdmin || adminRole === 'superadmin';
    const storeAddedBranches = (allBranches || []).filter(
      (b) =>
        b &&
        (b.status === 'active' || b.status === 'Active' || !b.status) &&
        (isSuperAdmin || b.tenantId === canonicalTenantId || b.tenantId === activeTenantId || isSameTenant(b.tenantId, activeTenantId)) &&
        isFsdCity(b.city) &&
        isFsdName(b.name)
    );

    if (storeAddedBranches.length > 0) {
      return storeAddedBranches;
    }

    // 2. Real hubs explicitly configured on the store/tenant (from SuperAdmin Manage store settings) - FILTERED TO FSD ONLY
    if (currentTenant?.hubs && Array.isArray(currentTenant.hubs) && currentTenant.hubs.length > 0) {
      const fsdHubs = currentTenant.hubs.filter(isFsdName);
      if (fsdHubs.length > 0) {
        return fsdHubs.map((hubName, idx) => ({
          _id: `hub_${currentTenant.id || 'curr'}_${idx}`,
          id: `hub_${currentTenant.id || 'curr'}_${idx}`,
          name: hubName,
          tenantId: currentTenant?.id || 'tenant-chaseup',
          city: 'Faisalabad',
          latitude: 31.4125,
          longitude: 73.0915,
          deliveryRadius: 15,
          status: 'active'
        }));
      }
    }

    // 3. Fallback: single real primary branch for current store in Faisalabad
    const realBranchName = `${currentTenant?.name || 'Store'} (Faisalabad Flagship Hub)`;
    return [
      {
        _id: `real_branch_${currentTenant?.id || 'main'}`,
        id: `real_branch_${currentTenant?.id || 'main'}`,
        name: realBranchName,
        tenantId: currentTenant?.id || 'tenant-chaseup',
        city: 'Faisalabad',
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

  // Order Assignment Sidebar
  const [sidebarOrder, setSidebarOrder] = useState(null);
  const [sidebarRiderId, setSidebarRiderId] = useState('');
  const [sidebarAssigning, setSidebarAssigning] = useState(false);

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
    serviceArea: 'Peoples Colony',
    region: 'Peoples Colony',
    zone: 'Peoples Colony',
    city: initialBranch.city || 'Faisalabad',
    address: '',
    latitude: String(initialBranch.latitude || 31.4125),
    longitude: String(initialBranch.longitude || 73.0915),
    coverageRadiusKm: String(initialBranch.deliveryRadius || initialBranch.coverageRadiusKm || 15),
    status: 'Active',
    cnic: '',
    username: '',
    password: 'rider123',
    isGlobal: true
  });

  const selectedBranchForForm = useMemo(() => {
    return availableBranches.find(
      (b) => (b.id || b._id || b.name) === newRiderForm.branchId || b.name === newRiderForm.branchName
    ) || availableBranches[0];
  }, [availableBranches, newRiderForm.branchId, newRiderForm.branchName]);

  const branchSectorForForm = useMemo(() => {
    return getSectorForBranch(selectedBranchForForm);
  }, [selectedBranchForForm]);

  const [showRiderPassword, setShowRiderPassword] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [editRiderForm, setEditRiderForm] = useState({
    id: '',
    name: '',
    username: '',
    phone: '',
    city: 'Faisalabad',
    serviceArea: '',
    address: '',
    region: '',
    password: '',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: ''
  });
  const [showEditRiderPassword, setShowEditRiderPassword] = useState(false);

  // Selected rider for mobile app simulator
  const [simulatedRiderId, setSimulatedRiderId] = useState(riders[0]?.id || '');
  const [dutyFilter, setDutyFilter] = useState('All'); // 'All' | 'On-Duty' | 'Off-Duty'

  // Filter riders - strictly scoped to store tenant or all active registered riders
  const storeRiders = useMemo(() => {
    const tId = (user?.role !== 'superadmin' && user?.tenantId)
      ? user.tenantId
      : (currentTenant?.id || user?.tenantId);
    const allRidersList = Array.isArray(riders) ? riders : [];
    if (!tId || adminRole === 'superadmin') return allRidersList;
    const tenantMatched = allRidersList.filter(
      (r) => isSameTenant(r.tenantId, tId)
    );
    return tenantMatched;
  }, [riders, currentTenant?.id, user?.tenantId, adminRole]);

  // Filter riders based on search, branch/zone, and duty status
  const filteredRiders = storeRiders.filter((r) => {
    const rStatusLower = String(r.status || '').toLowerCase();
    const isOffDuty = rStatusLower === 'off-duty' || rStatusLower === 'offline' || rStatusLower === 'inactive' || r.isOnline === false;
    const isOnDuty = !isOffDuty;

    if (dutyFilter === 'On-Duty' && !isOnDuty) return false;
    if (dutyFilter === 'Off-Duty' && !isOffDuty) return false;

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
        if (bareKey === 'cu5011') return;
        const existing = uniqueMap.get(bareKey);
        if (!existing) {
          uniqueMap.set(bareKey, ord);
        } else if (ord.status === 'Delivered' || ord.isDelivered === true || Number(ord.fulfillmentStage) >= 7) {
          uniqueMap.set(bareKey, ord);
        }
      }
    });
    const list = Array.from(uniqueMap.values());
    const isSuperAdmin = user?.role === 'superadmin' || adminRole === 'superadmin' || user?.isSuperAdmin;
    const targetTenantId = isSuperAdmin
      ? null
      : ((user?.role !== 'superadmin' && user?.tenantId) ? user.tenantId : (currentTenant?.id || user?.tenantId));
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
  const onDutyRidersCount = storeRiders.filter((r) => {
    const s = String(r.status || '').toLowerCase();
    return (s === 'on-duty' || s === 'active' || s === 'busy') && r.isOnline !== false;
  }).length;
  const offDutyRidersCount = storeRiders.filter((r) => {
    const s = String(r.status || '').toLowerCase();
    return s === 'off-duty' || s === 'offline' || s === 'inactive' || r.isOnline === false;
  }).length;
  const activeRidersCount = onDutyRidersCount;
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
      const isDel = s === 'delivered' || o.isDelivered === true || Number(o.fulfillmentStage) >= 7;
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
    const chosenRider = (riders || []).find((r) => r.id === rId);
    const rStatus = String(chosenRider?.status || '').toLowerCase();
    if (chosenRider && (rStatus === 'off-duty' || rStatus === 'offline' || chosenRider.isOnline === false)) {
      addToast('Rider Off-Duty 🔴', `${chosenRider.name || 'This rider'} is currently Off-Duty and cannot accept dispatches.`, 'warning');
      return;
    }
    assignRiderToOrder(orderId, rId);
    setSelectedRiderMap((prev) => ({ ...prev, [orderId]: '' }));
  };

  // Sidebar assign handler
  const handleSidebarAssign = async () => {
    if (!sidebarOrder || !sidebarRiderId) {
      addToast('Select Rider', 'Please choose a rider first.', 'error');
      return;
    }
    const chosenRider = (riders || []).find((r) => r.id === sidebarRiderId);
    const rStatus = String(chosenRider?.status || '').toLowerCase();
    if (chosenRider && (rStatus === 'off-duty' || rStatus === 'offline' || chosenRider.isOnline === false)) {
      addToast('Rider Off-Duty 🔴', `${chosenRider.name || 'This rider'} is currently Off-Duty and cannot accept dispatches.`, 'warning');
      return;
    }
    setSidebarAssigning(true);
    await assignRiderToOrder(sidebarOrder.id || sidebarOrder.orderId, sidebarRiderId);
    setSidebarAssigning(false);
    setSidebarOrder(null);
    setSidebarRiderId('');
    addToast('Rider Assigned 🛵', 'Courier has been dispatched to the order.');
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
        const sector = getSectorForBranch(found);
        setNewRiderForm((prev) => ({
          ...prev,
          branchId: found.id || found._id || '',
          branchName: found.name,
          region: `${sector.shortName} (${found.name})`,
          zone: sector.shortName,
          serviceArea: sector.neighborhoods[0] || 'Peoples Colony',
          city: 'Faisalabad',
          latitude: String(found.latitude || sector.center[0] || 31.4125),
          longitude: String(found.longitude || sector.center[1] || 73.0915),
          coverageRadiusKm: String(found.deliveryRadius || found.deliveryRadiusKm || 5)
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
      const sector = getSectorForBranch(activeBr);
      setNewRiderForm((prev) => ({
        ...prev,
        branchId: activeBr.id || activeBr._id || '',
        branchName: activeBr.name,
        region: `${sector.shortName} (${activeBr.name})`,
        zone: sector.shortName,
        serviceArea: sector.neighborhoods[0] || 'Peoples Colony',
        city: 'Faisalabad',
        latitude: String(activeBr.latitude || sector.center[0] || 31.4125),
        longitude: String(activeBr.longitude || sector.center[1] || 73.0915),
        coverageRadiusKm: String(activeBr.deliveryRadius || activeBr.deliveryRadiusKm || 5)
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

    // Enforce that rider's location must be in Faisalabad and within the branch's delivery region:
    const branchSector = getSectorForBranch(selectedBranch);
    const areaLower = (newRiderForm.serviceArea || '').toLowerCase().trim();

    // Check if the area belongs to another distant sector
    const otherSectors = FAISALABAD_DELIVERY_SECTORS.filter((s) => s.id !== branchSector.id);
    const isOutOfRegion = otherSectors.some((other) =>
      other.neighborhoods.some((n) => areaLower.includes(n.toLowerCase()))
    );

    if (isOutOfRegion) {
      addToast(
        'Out of Delivery Region ❌',
        `Cannot add rider: "${newRiderForm.serviceArea}" is outside ${selectedBranch.name}'s delivery region (${branchSector.shortName}). Please assign a location around this store.`,
        'error'
      );
      return;
    }

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
      : `${branchSector.shortName} (${finalBranchName})`;

    const generatedUsername =
      newRiderForm.username.trim() ||
      newRiderForm.phone.trim().replace(/[^0-9]/g, '') ||
      newRiderForm.name.toLowerCase().replace(/\s+/g, '_');
    const generatedPassword = newRiderForm.password.trim() || 'rider123';
    const generatedPlate =
      newRiderForm.vehicleNumber.trim() || `FSD-${Math.floor(1000 + Math.random() * 9000)}`;

    const riderCity = 'Faisalabad';
    const riderArea = newRiderForm.serviceArea?.trim() || branchSector.neighborhoods[0] || 'Peoples Colony';

    addRider({
      name: newRiderForm.name.trim(),
      phone: newRiderForm.phone.trim(),
      vehicleType: newRiderForm.vehicleType || '🏍️ Honda 125',
      vehicleNumber: generatedPlate,
      branchId: isCustomRegion ? 'custom' : (selectedBranch?.id || selectedBranch?._id || ''),
      branchName: finalBranchName,
      city: riderCity,
      serviceArea: riderArea,
      address: newRiderForm.address?.trim() || '',
      region: finalRegion,
      zone: branchSector.shortName,
      regionSector: branchSector.id,
      zoneId: branchSector.id,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng },
      coverageRadiusKm: Number(newRiderForm.coverageRadiusKm || selectedBranch?.deliveryRadius || 5),
      status: 'Active',
      tenantId: (user?.role !== 'superadmin' && user?.tenantId)
        ? user.tenantId
        : (selectedBranch?.tenantId || currentTenant?.id || 'tenant-alfatah'),
      tenantName: (user?.role !== 'superadmin' && user?.tenantName)
        ? user.tenantName
        : (selectedBranch?.tenantName || currentTenant?.name || 'Al-Fatah'),
      cnic: newRiderForm.cnic ? newRiderForm.cnic.trim() : '',
      username: generatedUsername,
      password: generatedPassword,
      isGlobal: false,
      deliveriesCount: 0,
      rating: 5.0
    });

    setIsAddRiderModalOpen(false);
    setIsCustomRegion(false);
    setCustomRegionName('');

    const nextBr = availableBranches[0] || {};
    const nextSector = getSectorForBranch(nextBr);
    setNewRiderForm({
      name: '',
      phone: '',
      vehicleType: '🏍️ Honda 125',
      vehicleNumber: '',
      branchId: nextBr.id || nextBr._id || '',
      branchName: nextBr.name || 'Main Hub',
      serviceArea: nextSector.neighborhoods[0] || 'Peoples Colony',
      region: `${nextSector.shortName} (${nextBr.name || 'Main Hub'})`,
      zone: nextSector.shortName,
      city: 'Faisalabad',
      address: '',
      latitude: String(nextBr.latitude || nextSector.center[0] || 31.4125),
      longitude: String(nextBr.longitude || nextSector.center[1] || 73.0915),
      coverageRadiusKm: String(nextBr.deliveryRadius || nextBr.deliveryRadiusKm || 5),
      status: 'Active',
      cnic: '',
      username: '',
      password: 'rider123',
      isGlobal: true
    });
  };

  const handleEditRiderSubmit = (e) => {
    e.preventDefault();
    if (!editingRider) return;
    const finalPassword = editRiderForm.password?.trim() || 'rider123';
    const finalCity = editRiderForm.city?.trim() || editingRider.city || 'Faisalabad';
    const finalArea = editRiderForm.serviceArea?.trim() || editRiderForm.region?.trim() || editingRider.serviceArea || editingRider.zone || 'Peoples Colony';
    const finalAddress = editRiderForm.address?.trim() || editingRider.address || '';
    updateRider(editingRider.id, {
      name: editRiderForm.name.trim(),
      username: editRiderForm.username ? editRiderForm.username.trim() : editingRider.username,
      phone: editRiderForm.phone.trim(),
      city: finalCity,
      serviceArea: finalArea,
      address: finalAddress,
      region: `${finalArea} (${finalCity})`,
      zone: finalArea,
      password: finalPassword,
      vehicleType: editRiderForm.vehicleType || '🏍️ Honda 125',
      vehicleNumber: editRiderForm.vehicleNumber ? editRiderForm.vehicleNumber.trim() : (editingRider.vehicleNumber || ''),
      isGlobal: editingRider.isGlobal ?? true
    });
    addToast('Courier & Location Saved 🔑', `${editRiderForm.name}'s coverage area (${finalArea}) updated.`);
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
              {onDutyRidersCount} <span className="text-sm font-bold text-slate-400">/ {storeRiders.length}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              <span className="text-emerald-700 font-black">{onDutyRidersCount} On-Duty</span> • <span className="text-rose-600 font-black">{offDutyRidersCount} Off-Duty</span>
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Instant Dispatch Ready</span>
            </div>
            {offDutyRidersCount > 0 && (
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                {offDutyRidersCount} Off-Duty
              </span>
            )}
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
          { id: 'zone', label: 'Área de Entrega (Delivery Zones)', icon: MapPin }
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
      {/* SUB-VIEW 1: ORDER DISPATCH QUEUE (Table + Sidebar)                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">

          {/* Top Bar matching fleet style */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Order Dispatch Queue
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setQueueFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${queueFilter === 'active' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                Active ({pendingDispatches.length})
              </button>
              <button type="button" onClick={() => setQueueFilter('delivered')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${queueFilter === 'delivered' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                Delivered ({completedDeliveries.length})
              </button>
              <button type="button" onClick={() => setQueueFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${queueFilter === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                All ({allOrdersList.length})
              </button>
            </div>
          </div>

          {/* Main layout: Order Table + Sidebar */}
          <div className={`flex gap-5 items-start transition-all ${sidebarOrder ? 'flex-col lg:flex-row' : ''}`}>

            {/* ── ORDER TABLE ── */}
            <div className={`flex-1 min-w-0 bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden ${sidebarOrder ? 'lg:max-w-[calc(100%-380px)]' : 'w-full'}`}>
              {queueOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-3xl">📦</div>
                  <h4 className="font-bold text-base text-stone-800">
                    {queueFilter === 'delivered' ? 'No delivered orders yet' : 'No orders in queue'}
                  </h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    {queueFilter === 'active' && completedDeliveries.length > 0
                      ? 'All dispatches complete. View past records below.'
                      : 'Orders placed by customers will appear here for rider assignment.'}
                  </p>
                  {completedDeliveries.length > 0 && queueFilter === 'active' && (
                    <button type="button" onClick={() => setQueueFilter('delivered')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      View Delivered Orders ({completedDeliveries.length}) →
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 bg-white">
                        <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-stone-400">ORDER</th>
                        <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">CUSTOMER</th>
                        <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400 hidden md:table-cell">ADDRESS</th>
                        <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400 text-center">AMOUNT</th>
                        <th className="py-4 px-4 text-[11px] font-black uppercase tracking-wider text-stone-400">STATUS</th>
                        <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-stone-400">RIDER / ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs">
                      {queueOrders.map((order) => {
                        const orderId = order.id || order.orderId;
                        const cleanId = String(orderId).replace(/^#/, '');
                        const customerName = order.customerName || order.customer || 'Customer';
                        const customerPhone = order.customerPhone || order.phone || '—';
                        const address = order.address || order.shippingAddress?.address || '—';
                        const city = order.city || order.shippingAddress?.city || '';
                        const amount = Number(order.totalAmount || order.totalPrice || order.total || 0);
                        const statusRaw = (order.status || 'Pending').toLowerCase();
                        const isDelivered = statusRaw === 'delivered';
                        const isDispatched = ['dispatched', 'out for delivery', 'arrived at customer'].includes(statusRaw);
                        const isReady = ['ready', 'ready for dispatch'].includes(statusRaw);
                        const isSelected = sidebarOrder && (sidebarOrder.id || sidebarOrder.orderId) === orderId;

                        const statusLabel = isDelivered ? 'Delivered'
                          : statusRaw === 'out for delivery' ? 'In Transit'
                          : statusRaw === 'arrived at customer' ? 'Arrived'
                          : isDispatched ? 'Dispatched'
                          : isReady ? 'Ready'
                          : 'Pending';

                        const statusClass = isDelivered
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isDispatched
                          ? 'bg-sky-100 text-sky-800 border-sky-200'
                          : isReady
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200';

                        return (
                          <tr
                            key={orderId}
                            onClick={() => {
                              if (isDelivered) return;
                              setSidebarOrder(isSelected ? null : order);
                              setSidebarRiderId(order.assignedRider?.id || '');
                            }}
                            className={`transition-colors cursor-pointer ${isSelected ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'hover:bg-stone-50/60'}`}
                          >
                            {/* ORDER ID */}
                            <td className="py-4 px-6">
                              <span className="font-mono font-black text-stone-900 block text-sm">#{cleanId}</span>
                              <span className="text-[10px] text-stone-400 font-medium">
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                            </td>

                            {/* CUSTOMER */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-stone-900 block">{customerName}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{customerPhone}</span>
                            </td>

                            {/* ADDRESS */}
                            <td className="py-4 px-4 hidden md:table-cell max-w-[200px]">
                              <span className="text-stone-700 block truncate" title={address}>{address}</span>
                              {city && <span className="text-[10px] text-stone-400 block">{city}</span>}
                            </td>

                            {/* AMOUNT */}
                            <td className="py-4 px-4 text-center">
                              <span className="font-black text-stone-900 font-mono block">Rs. {amount.toLocaleString()}</span>
                              <span className="text-[10px] text-stone-400">COD</span>
                            </td>

                            {/* STATUS */}
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {statusLabel}
                              </span>
                            </td>

                            {/* RIDER / ACTION */}
                            <td className="py-4 px-6">
                              {order.assignedRider ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">🛵</span>
                                  <div>
                                    <span className="font-semibold text-stone-900 block">{order.assignedRider.name}</span>
                                    {isDelivered ? (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-emerald-700 font-bold">✓ Delivered</span>
                                        <a
                                          href={getWhatsAppDeliveryLink(order)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded text-[10px] font-bold shadow-2xs transition"
                                          title="Notify customer on WhatsApp"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5" />
                                          <span>WhatsApp</span>
                                        </a>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSidebarOrder(order); setSidebarRiderId(order.assignedRider?.id || ''); }}
                                        className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                                      >Reassign →</button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSidebarOrder(order); setSidebarRiderId(''); }}
                                  className="px-3 py-1.5 bg-[#ca8a04] hover:bg-[#b47b04] text-white rounded-lg text-[11px] font-bold cursor-pointer transition shadow-xs flex items-center gap-1"
                                >
                                  <span>Assign Rider</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── ORDER ASSIGNMENT SIDEBAR ── */}
            {sidebarOrder && (() => {
              const o = sidebarOrder;
              const oId = o.id || o.orderId;
              const items = Array.isArray(o.rawItems) && o.rawItems.length > 0 ? o.rawItems
                : Array.isArray(o.items) && o.items.length > 0 ? o.items
                : Array.isArray(o.orderItems) && o.orderItems.length > 0 ? o.orderItems
                : [];
              const amount = Number(o.totalAmount || o.totalPrice || o.total || 0);
              const orderTenant = normalizeOrderTenantId(o) || currentTenant?.id || user?.tenantId;
              const eligibleRiders = (getEligibleRidersForOrder ? getEligibleRidersForOrder(o) : []).filter((r) => isSameTenant(r.tenantId, orderTenant));
              const allAvailable = (eligibleRiders && eligibleRiders.length > 0)
                ? eligibleRiders
                : (storeRiders && storeRiders.length > 0)
                  ? storeRiders.filter((r) => isSameTenant(r.tenantId, orderTenant))
                  : (riders || []).filter((r) => isSameTenant(r.tenantId, orderTenant));

              return (
                <aside className="w-full lg:w-[360px] shrink-0 bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col animate-in slide-in-from-right duration-200">

                  {/* Sidebar Header */}
                  <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assign Rider</p>
                      <h3 className="font-black text-base tracking-tight">Order #{String(oId).replace(/^#/, '')}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSidebarOrder(null)}
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Customer Info */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Customer</p>
                      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-stone-200 flex items-center justify-center text-sm font-black text-stone-600">
                            {(o.customerName || o.customer || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm">{o.customerName || o.customer || 'Customer'}</p>
                            <p className="text-[11px] text-stone-400 font-mono">{o.customerPhone || o.phone || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 pt-1 border-t border-stone-100">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-stone-700 leading-snug">
                              {o.address || o.shippingAddress?.address || 'Address not set'}
                              {(o.city || o.shippingAddress?.city) && <span className="text-stone-400">, {o.city || o.shippingAddress?.city}</span>}
                            </p>
                            {(o.branchName || o.branchHub || o.zone) && (
                              <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Delivery Zone: {o.branchName || o.branchHub || o.zone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Items ({items.length})</p>
                        <div className="bg-stone-50 rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-hidden max-h-36 overflow-y-auto">
                          {items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                              <span className="font-semibold text-stone-800 truncate">
                                <span className="text-amber-700 font-black mr-1">{it.quantity || it.qty || 1}×</span>
                                {it.name || it.productName || 'Item'}
                              </span>
                              <span className="text-stone-400 font-mono shrink-0 ml-2">Rs. {it.price || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                      <span className="text-xs font-bold text-amber-800">Order Total</span>
                      <span className="font-black text-amber-900 font-mono">Rs. {amount.toLocaleString()}</span>
                    </div>

                    {/* Current Rider */}
                    {o.assignedRider && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <span className="text-lg">🛵</span>
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Currently Assigned</p>
                          <p className="font-bold text-emerald-900 text-sm">{o.assignedRider.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Rider Selection */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                        {o.assignedRider ? 'Reassign Rider' : 'Select Rider'}
                        <span className="ml-2 text-emerald-700 normal-case font-bold">{allAvailable.length} available</span>
                      </p>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {allAvailable.length === 0 ? (
                          <p className="text-xs text-stone-400 italic p-3 bg-stone-50 rounded-xl">No riders available right now.</p>
                        ) : (
                          allAvailable.map((r) => {
                            const rStatusLower = String(r.status || '').toLowerCase();
                            const isOffDuty = rStatusLower === 'off-duty' || rStatusLower === 'offline' || rStatusLower === 'inactive' || r.isOnline === false;
                            const isOnDuty = !isOffDuty;
                            const isChosen = sidebarRiderId === r.id;
                            const activeOrders = (allOrdersList || []).filter((ord) => {
                              const s = String(ord.status || '').toLowerCase();
                              if (s === 'delivered' || s === 'completed') return false;
                              const ar = ord.assignedRider;
                              return ar && (ar.id === r.id || ar.name === r.name);
                            }).length;

                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  if (isOffDuty) {
                                    addToast('Rider Off-Duty 🔴', `${r.name} is currently marked as Off-Duty and cannot accept dispatches.`, 'warning');
                                    return;
                                  }
                                  setSidebarRiderId(r.id);
                                }}
                                className={`w-full text-left px-3.5 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isOffDuty
                                    ? 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-85'
                                    : isChosen
                                    ? 'bg-stone-900 border-stone-900 text-white'
                                    : 'bg-white border-stone-200 hover:border-stone-400 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${isChosen ? 'bg-white/20' : isOffDuty ? 'bg-rose-100 text-rose-700' : 'bg-stone-100'}`}>
                                    {isOffDuty ? '🛑' : '🛵'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-bold text-sm truncate ${isChosen ? 'text-white' : 'text-stone-900'}`}>
                                      {r.name}
                                      {isOffDuty && <span className="ml-1.5 text-[10px] text-rose-600 font-extrabold">(Off-Duty)</span>}
                                    </p>
                                    <p className={`text-[10px] truncate ${isChosen ? 'text-stone-300' : 'text-stone-400'}`}>
                                      {r.servedAreaLabel || r.serviceArea || r.zone || r.region || 'General Area'}
                                      {r.isPolygonMatch ? ' 🎯 (Zone Polygon Match)' : r.isDirectAreaMatch ? ' ⭐ (Area Match)' : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`text-[10px] font-black ${isChosen ? 'text-stone-300' : 'text-stone-500'}`}>{activeOrders}/5</p>
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    isChosen
                                      ? 'bg-white/20 text-white'
                                      : isOnDuty
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    {isOnDuty ? 'On-Duty' : 'Off-Duty'}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Footer */}
                  <div className="px-5 py-4 border-t border-stone-100 bg-stone-50 space-y-2">
                    <button
                      type="button"
                      onClick={handleSidebarAssign}
                      disabled={!sidebarRiderId || sidebarAssigning}
                      className="w-full py-3 bg-[#ca8a04] hover:bg-[#b47b04] disabled:opacity-40 text-white rounded-2xl font-black text-sm cursor-pointer transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {sidebarAssigning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Assigning…</span>
                        </>
                      ) : (
                        <>
                          <span>🛵</span>
                          <span>{o.assignedRider ? 'Reassign Rider' : 'Assign Rider to Order'}</span>
                        </>
                      )}
                    </button>
                    {(o.status === 'Out for Delivery' || o.status === 'Arrived at Customer') && (
                      <button
                        type="button"
                        onClick={() => { handleOpenOtpModal(o); setSidebarOrder(null); }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm cursor-pointer transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify OTP — Mark Delivered
                      </button>
                    )}
                  </div>
                </aside>
              );
            })()}

          </div>{/* end main layout */}
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
              <div className="flex items-center gap-2">
                {storeRiders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete every rider from the dashboard and database? You can then register fresh riders and set custom passwords.')) {
                        clearAllRiders();
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Riders</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddRiderModal}
                  className="px-5 py-2.5 bg-[#ca8a04] hover:bg-[#b47b04] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Rider</span>
                </button>
              </div>
            )}
          </div>

          {/* Duty Status Filter Tabs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDutyFilter('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dutyFilter === 'All'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              All Couriers ({storeRiders.length})
            </button>
            <button
              type="button"
              onClick={() => setDutyFilter('On-Duty')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dutyFilter === 'On-Duty'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>On-Duty ({onDutyRidersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setDutyFilter('Off-Duty')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dutyFilter === 'Off-Duty'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Off-Duty ({offDutyRidersCount})</span>
            </button>
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
                      <td colSpan={7} className="text-center py-12 px-6">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                            🛵
                          </div>
                          <h4 className="font-bold text-sm text-stone-900">
                            No Delivery Riders Registered
                          </h4>
                          <p className="text-xs text-stone-500">
                            All default couriers have been cleared. Click <strong>+ Add Rider</strong> to register your couriers with their custom login password.
                          </p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={handleOpenAddRiderModal}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ca8a04] hover:bg-[#b47b04] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register Delivery Rider</span>
                            </button>
                          )}
                        </div>
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
                        const isDelivered = s === 'delivered' || s === 'completed' || o.isDelivered === true || Number(o.fulfillmentStage) >= 7;
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
                      const riderStatusLower = String(rider.status || '').toLowerCase();
                      const isOffDuty = riderStatusLower === 'off-duty' || riderStatusLower === 'offline' || riderStatusLower === 'inactive' || rider.isOnline === false;
                      const isOnDuty = !isOffDuty;

                      return (
                        <tr key={rider.id} className="hover:bg-stone-50/60 transition-colors">
                          {/* NAME */}
                          <td className="py-4 px-6 font-semibold text-stone-900 text-xs">
                            <div className="flex items-center gap-2">
                              <span>{rider.name}</span>
                              {isOffDuty && (
                                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                                  Off-Duty
                                </span>
                              )}
                            </div>
                          </td>

                          {/* USERNAME */}
                          <td className="py-4 px-4 font-mono text-stone-500 text-xs">
                            {rider.username || rider.name.toLowerCase().replace(/\s+/g, '_')}
                          </td>

                          {/* PHONE */}
                          <td className="py-4 px-4 font-mono font-medium text-stone-800 text-xs">
                            {rider.phone || 'Not set'}
                          </td>

                          {/* REGION / SERVED AREA */}
                          <td className="py-4 px-4 text-stone-700 text-xs font-medium">
                            <div className="font-bold text-stone-900 flex items-center gap-1">
                              <span>📍</span>
                              <span>{rider.serviceArea || rider.zone || rider.region || 'All Areas'}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 font-medium">
                              {rider.city || 'Faisalabad'}{rider.address ? ` · ${rider.address}` : ''}
                            </div>
                          </td>

                          {/* ACTIVE ORDERS */}
                          <td className="py-4 px-4 font-mono font-bold text-stone-800 text-xs text-center">
                            {activeCount}/5
                          </td>

                          {/* STATUS */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                isOnDuty
                                  ? 'bg-[#e2ede2] text-[#366838] border border-[#ceead6]'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-[#2e7d32] animate-pulse' : 'bg-rose-500'}`}></span>
                              <span>{isOnDuty ? '🟢 On-Duty' : '🔴 Off-Duty'}</span>
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
                                      city: rider.city || 'Faisalabad',
                                      serviceArea: rider.serviceArea || rider.zone || rider.region || 'Peoples Colony',
                                      address: rider.address || '',
                                      region: rider.serviceArea || rider.region || rider.zone || 'Peoples Colony',
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
                                  className={`px-3 py-1 border rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                                    isOnDuty
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={isOnDuty ? 'Mark rider off-duty' : 'Mark rider on-duty'}
                                >
                                  {isOnDuty ? 'Mark Off-Duty' : 'Mark On-Duty'}
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

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete rider "${rider.name}" from fleet?`)) {
                                      deleteRider(rider.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Delete Rider"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              )}
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
      {/* SUB-VIEW 4: ÁREA DE ENTREGA (CONCENTRIC RINGS & DELIVERY FEE TIERS)   */}
      {/* ===================================================================== */}
      {activeSubTab === 'zone' && (
        <DeliveryZoneView />
      )}

      {/* ===================================================================== */}
      {/* MODAL: CUSTOMER HANDOVER OTP VERIFICATION                             */}
      {/* ===================================================================== */}



      {/* ===================================================================== */}
      {/* MODAL: ADMIN ADD NEW RIDER (STREAMLINED & PROFESSIONAL)              */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* MODAL: ADMIN ADD NEW RIDER (STREAMLINED & PROFESSIONAL)              */}
      {/* ===================================================================== */}
      {isAddRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 text-xs">
            
            {/* Modal Header (Fixed at top) */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-900/15 shrink-0">
                  🛵
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight">Register Delivery Rider</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Add courier to dispatch fleet with area coverage</p>
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
              <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
                
                {/* Row 1: Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Username / Handle <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hamza or ahmad"
                      value={newRiderForm.username}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Phone & Operating City (Locked to Faisalabad FSD) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Phone Number (Mobile) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🇵🇰</span>
                      <input
                        type="tel"
                        required
                        placeholder="0300-1234567"
                        value={newRiderForm.phone}
                        onChange={(e) => setNewRiderForm({ ...newRiderForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 font-mono font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Operating City <span className="text-rose-500">*</span>
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>🏙️</span>
                        <span>Faisalabad</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        FSD Fleet Only
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Assigned Branch Hub & Base Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Assigned Branch & Hub <span className="text-slate-400 font-normal">(Base Station)</span>
                    </label>
                    <select
                      value={isCustomRegion ? 'custom' : (newRiderForm.branchId || newRiderForm.branchName || newRiderForm.region)}
                      onChange={handleBranchSelectChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <optgroup label="Available Faisalabad Store Branches (FSD Only)">
                        {availableBranches.map((b) => {
                          const branchKey = b.id || b._id || b.name;
                          const tName = b.tenantName || (b.tenantId?.includes('alfatah') ? 'Al-Fatah' : b.tenantId?.includes('chasevalue') ? 'Chase Value' : b.tenantId?.includes('chaseup') ? 'Chase Up' : 'Unimaart');
                          return (
                            <option key={branchKey} value={branchKey}>
                              🏪 {tName} — {b.name} (Faisalabad)
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Custom Area">
                        <option value="custom">📍 Custom Hub / Area</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Base Address / Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near D-Ground Market"
                      value={newRiderForm.address}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Region Indicator Banner */}
                {selectedBranchForForm && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: branchSectorForForm.color }} />
                      <span className="font-bold text-slate-700">Delivery Region:</span>
                      <span className="font-black text-slate-900">{branchSectorForForm.shortName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{
                      backgroundColor: `${branchSectorForForm.color}15`,
                      borderColor: `${branchSectorForForm.color}35`,
                      color: branchSectorForForm.color
                    }}>
                      Coverage: {selectedBranchForForm.deliveryRadiusKm || selectedBranchForForm.deliveryRadius || 5} km around store
                    </span>
                  </div>
                )}

                {/* Row 4: Coverage Area / Neighborhood (Constrained around branch's location) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Coverage Area / Neighborhood <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      📍 Under Branch Delivery Region
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peoples Colony, D-Ground"
                    value={newRiderForm.serviceArea}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, serviceArea: e.target.value, region: e.target.value, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {/* Dynamic Quick Select Area Chips around Store Location */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-400">Around Store Location:</span>
                    {branchSectorForForm.neighborhoods.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setNewRiderForm((prev) => ({
                          ...prev,
                          serviceArea: area,
                          region: `${area} (${branchSectorForForm.shortName})`,
                          zone: area
                        }))}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          newRiderForm.serviceArea === area
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        +{area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 5: Rider Password Card */}
                <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rider Login Password <span className="text-rose-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewRiderForm({ ...newRiderForm, password: 'rider' + Math.floor(100 + Math.random() * 900) })}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>🎲 Generate</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showRiderPassword ? 'text' : 'password'}
                      required
                      placeholder="Set rider password (e.g. rider123)"
                      value={newRiderForm.password}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, password: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-xl pl-3 pr-10 py-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRiderPassword(!showRiderPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showRiderPassword ? "Hide password" : "Show password"}
                    >
                      {showRiderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Rider logs in with <strong>{newRiderForm.phone.trim() || 'mobile number'}</strong> & this password.
                    </span>
                    <span className="font-mono text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[10px]">
                      Rider App Access Key
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer (Sticky & Always Visible at Bottom) */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddRiderModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150 text-xs">
            
            {/* Modal Header (Fixed at top) */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg shrink-0">
                  ✏️
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base leading-tight">Edit Courier & Password</h2>
                  <p className="text-[11px] text-emerald-100">Update profile, coverage location & rider credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRider(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditRiderSubmit} className="flex flex-col flex-1 min-h-0">
              
              {/* Scrollable Form Body */}
              <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
                
                {/* Row 1: Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Rider Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Usman Farooq"
                      value={editRiderForm.name}
                      onChange={(e) => setEditRiderForm({ ...editRiderForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Username / Handle <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ahmad"
                      value={editRiderForm.username}
                      onChange={(e) => setEditRiderForm({ ...editRiderForm, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Phone & Operating City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Phone Number (Login ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0300-1234567"
                      value={editRiderForm.phone}
                      onChange={(e) => setEditRiderForm({ ...editRiderForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      Operating City <span className="text-rose-500">*</span>
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>🏙️</span>
                        <span>Faisalabad</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        FSD Fleet Only
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Coverage Area / Neighborhood */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Coverage Area / Neighborhood <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🎯 Auto-Prioritizes Orders Here
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peoples Colony, D-Ground, Madina Town"
                    value={editRiderForm.serviceArea || editRiderForm.region || ''}
                    onChange={(e) => setEditRiderForm({ ...editRiderForm, serviceArea: e.target.value, region: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {/* Quick Select Chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-400">Quick Select:</span>
                    {['Peoples Colony', 'D-Ground', 'Madina Town', 'Susan Road', 'Canal Road', 'Kohinoor', 'Samanabad', 'Clock Tower'].map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setEditRiderForm((prev) => ({
                          ...prev,
                          serviceArea: area,
                          region: area
                        }))}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          (editRiderForm.serviceArea === area || editRiderForm.region === area)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        +{area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Base Address / Landmark */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Base Address / Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near D-Ground Market, Faisalabad"
                    value={editRiderForm.address || ''}
                    onChange={(e) => setEditRiderForm({ ...editRiderForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Row 5: Rider Password Card (Prominent & Easy to Edit) */}
                <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rider Access Password <span className="text-rose-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditRiderForm({ ...editRiderForm, password: 'rider' + Math.floor(100 + Math.random() * 900) })}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>🎲 Generate</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showEditRiderPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={editRiderForm.password}
                      onChange={(e) => setEditRiderForm({ ...editRiderForm, password: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-xl pl-3 pr-10 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
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

                  <div className="flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1">
                    <span>
                      Sign-in via: <strong>{editRiderForm.username.trim() || editRiderForm.phone.trim() || 'username'}</strong> or <strong>{editRiderForm.phone.trim()}</strong>
                    </span>
                    <span className="font-mono text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[10px]">
                      Rider Fleet Key
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer (Sticky & Always Visible at Bottom) */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-900/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Save Changes & Password 🔑
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
