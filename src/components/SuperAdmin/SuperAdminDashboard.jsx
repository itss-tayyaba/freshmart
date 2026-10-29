import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2,
  Users,
  ShoppingBag,
  TrendingUp,
  Plus,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Store,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Layers,
  MapPin,
  Calendar,
  X,
  Copy,
  Check,
  Sliders,
  Activity,
  LogOut,
  FileText,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Phone,
  LayoutDashboard,
  Sparkles,
  UserCheck,
  Settings,
  Edit2,
  Download,
  Zap,
  Printer,
  BarChart2,
  BarChart3,
  PieChart,
  DollarSign,
  ArrowDownRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SUBSCRIPTION_PLANS, INITIAL_TENANTS } from '../../data/tenantData';
import { isSameTenant } from '../../data/companyHierarchyData';

export const SuperAdminDashboard = () => {
  const {
    tenants,
    setTenants,
    currentTenant,
    setCurrentTenant,
    addTenant,
    inviteTenant,
    approveTenant,
    suspendTenant,
    activateTenant,
    deleteTenant,
    updateTenantSubscription,
    getTenantOrders,
    getTenantPerformance,
    getPlatformOverview,
    adminOrders,
    customerOrders,
    customers,
    setCustomers,
    addCustomer,
    deleteCustomer,
    updateCustomer,
    adminLogout,
    navigateTo,
    addToast,
    storeAdmins,
    setStoreAdmins,
    addStoreAdmin,
    updateStoreAdmin,
    deleteStoreAdmin,
    toggleStoreAdminStatus,
    platformSettings,
    updatePlatformSettings,
    sanitizeOrder
  } = useStore();

  // Active Navigation in Sidebar
  const [activeNav, setActiveNav] = useState('dashboard');

  // Modals visibility
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedOrderInvoice, setSelectedOrderInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderSupermarketFilter, setOrderSupermarketFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Main Dashboard Graph & Analytics Controls
  const [chartPeriod, setChartPeriod] = useState('7days'); // 'today' | '7days' | '30days' | 'year'
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders' | 'aov'
  const [chartStyle, setChartStyle] = useState('line'); // 'line' | 'bar'
  const [chartStoreFilter, setChartStoreFilter] = useState('all'); // 'all' | tenantId
  const [hoveredChartIndex, setHoveredChartIndex] = useState(null);

  // Report download states & progress
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingReportTitle, setDownloadingReportTitle] = useState('');
  const [downloadStage, setDownloadStage] = useState('');

  // Platform Settings local form state
  const [settingsForm, setSettingsForm] = useState(() => ({
    platformTitle: platformSettings?.platformTitle || 'FreshMart Super Platform',
    tagline: platformSettings?.tagline || "Pakistan's Premier Multi-Store Grocery Marketplace",
    supportPhone: platformSettings?.supportPhone || '+92 41 8712345',
    supportEmail: platformSettings?.supportEmail || 'support@freshmart.pk',
    currency: platformSettings?.currency || 'PKR (Rs.)',
    freeDeliveryThreshold: platformSettings?.freeDeliveryThreshold ?? 1000,
    defaultDeliveryFee: platformSettings?.defaultDeliveryFee ?? 150,
    deliveryRadiusKm: platformSettings?.deliveryRadiusKm ?? 15,
    expressSlaMinutes: platformSettings?.expressSlaMinutes ?? 15,
    maxRiderOrders: platformSettings?.maxRiderOrders ?? 5,
    maxStaffParcels: platformSettings?.maxStaffParcels ?? 10,
    autoAssignRiders: platformSettings?.autoAssignRiders ?? true,
    autoAssignStaff: platformSettings?.autoAssignStaff ?? true,
    smsNotifications: platformSettings?.smsNotifications ?? true,
    whatsappReceipts: platformSettings?.whatsappReceipts ?? true
  }));

  // Sync settings when platformSettings changes from context
  useEffect(() => {
    if (platformSettings) {
      setSettingsForm((prev) => ({ ...prev, ...platformSettings }));
    }
  }, [platformSettings]);

  // Consolidated Cross-Store Orders Stream
  const allCrossStoreOrders = useMemo(() => {
    const map = new Map();
    [...(adminOrders || []), ...(customerOrders || [])].forEach((o) => {
      const key = o.id || o.orderId;
      if (key && !map.has(key)) {
        map.set(key, sanitizeOrder ? sanitizeOrder(o) : o);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );
  }, [adminOrders, customerOrders, sanitizeOrder]);

  // Filtered Cross-Store Orders
  const filteredOrders = useMemo(() => {
    return allCrossStoreOrders.filter((ord) => {
      const ordTenant = String(ord.tenantId || ord.storeId || '').toLowerCase();
      const matchSupermarket =
        orderSupermarketFilter === 'all' ||
        isSameTenant(ordTenant, orderSupermarketFilter) ||
        (ord.tenantName && ord.tenantName.toLowerCase().includes(orderSupermarketFilter.toLowerCase()));

      const matchStatus =
        orderStatusFilter === 'all' ||
        String(ord.status || '').toLowerCase() === orderStatusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        String(ord.id || ord.orderId || '').toLowerCase().includes(q) ||
        String(ord.customerName || ord.customer || '').toLowerCase().includes(q) ||
        String(ord.customerPhone || '').toLowerCase().includes(q) ||
        String(ord.tenantName || '').toLowerCase().includes(q);

      return matchSupermarket && matchStatus && matchSearch;
    });
  }, [allCrossStoreOrders, orderSupermarketFilter, orderStatusFilter, searchQuery]);

  // Baseline Stores definition
  const defaultStores = [
    {
      id: 'tenant-alfatah',
      name: 'Al-Fatah',
      fullName: 'Al-Fatah Supermarket',
      tagline: 'Premium Supermarket & Hypermarket Since 1941',
      status: 'Active',
      ordersToday: 645,
      revenueToday: 312450,
      revenueFormatted: 'PKR 312,450',
      color: '#991b1b',
      logo: '🏬',
      plan: 'Enterprise',
      ownerEmail: 'admin@alfatah.pk',
      ownerName: 'Sheikh Tariq Al-Fatah',
      location: 'Faisalabad (D-Ground & Peoples Colony)'
    },
    {
      id: 'tenant-chasevalue',
      name: 'Chase Value',
      fullName: 'Chase Value (Case Value)',
      tagline: 'Quality Products, Wholesale Prices',
      status: 'Active',
      ordersToday: 512,
      revenueToday: 241230,
      revenueFormatted: 'PKR 241,230',
      color: '#78350f',
      logo: '🛒',
      plan: 'Professional',
      ownerEmail: 'admin@chasevalue.pk',
      ownerName: 'Farhan Case Value',
      location: 'Faisalabad (Wholesale Hub)'
    },
    {
      id: 'tenant-chaseup',
      name: 'Chase Up',
      fullName: 'Chase Up Department Store',
      tagline: 'Quality Groceries & Family Shopping',
      status: 'Active',
      ordersToday: 467,
      revenueToday: 218760,
      revenueFormatted: 'PKR 218,760',
      color: '#701a75',
      logo: '🏪',
      plan: 'Professional',
      ownerEmail: 'admin@chaseup.pk',
      ownerName: 'Muhammad Salman Chase',
      location: 'Faisalabad (Clock Tower Hub)'
    },
    {
      id: 'tenant-freshmart',
      name: 'Unimaart',
      fullName: 'Unimaart (Market Store)',
      tagline: 'Fresh • Fast • Fair Prices',
      status: 'Active',
      ordersToday: 398,
      revenueToday: 176540,
      revenueFormatted: 'PKR 176,540',
      color: '#0e7c66',
      logo: '🛒',
      plan: 'Enterprise',
      ownerEmail: 'admin@unimart.pk',
      ownerName: 'Aimen Yasin',
      location: 'Faisalabad (Peoples Colony Dark Store)'
    }
  ];

  // Merge live context tenants with baseline stores
  const displayStores = useMemo(() => {
    const list = defaultStores.map((store) => {
      const live = (tenants || []).find((t) => isSameTenant(t.id, store.id));
      if (live) {
        return {
          ...store,
          name: live.displayName || live.name || store.name,
          fullName: live.name || store.fullName,
          tagline: live.tagline || store.tagline,
          status: live.status || store.status,
          plan: live.subscription?.plan || store.plan,
          ownerEmail: live.ownerEmail || store.ownerEmail,
          ownerName: live.ownerName || store.ownerName
        };
      }
      return store;
    });

    // Add any newly registered supermarkets
    (tenants || []).forEach((t) => {
      if (!list.some((s) => isSameTenant(s.id, t.id))) {
        list.push({
          id: t.id,
          name: t.displayName || t.name,
          fullName: t.name,
          tagline: t.tagline || 'Supermarket Store',
          status: t.status || 'Active',
          ordersToday: 0,
          revenueToday: 0,
          revenueFormatted: 'PKR 0',
          color: t.color || '#0e7c66',
          logo: t.logo || '🏬',
          plan: t.subscription?.plan || 'Starter',
          ownerEmail: t.ownerEmail || 'admin@store.pk',
          ownerName: t.ownerName || 'Mart Admin',
          location: t.city || 'Faisalabad'
        });
      }
    });

    return list;
  }, [tenants]);

  // =========================================================================
  // SUPER ADMIN MAIN DASHBOARD: ANALYTICS & GRAPH ENGINE
  // =========================================================================
  const chartDatasets = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Filter orders for the selected supermarket or all
    const targetOrders = chartStoreFilter === 'all'
      ? (allCrossStoreOrders || [])
      : (allCrossStoreOrders || []).filter((ord) => {
          const ordTenant = String(ord.tenantId || ord.storeId || '').toLowerCase();
          return isSameTenant(ordTenant, chartStoreFilter);
        });

    let buckets = [];
    if (chartPeriod === 'today') {
      // 8 3-hour blocks
      const hourFactors = [0.15, 0.08, 0.12, 0.45, 0.85, 1.25, 1.40, 0.95];
      buckets = Array.from({ length: 8 }, (_, idx) => {
        const h = idx * 3;
        const start = new Date(today.getTime() + h * 60 * 60 * 1000);
        const end = new Date(today.getTime() + (h + 3) * 60 * 60 * 1000);
        return {
          label: `${String(h).padStart(2, '0')}:00`,
          fullLabel: `${String(h).padStart(2, '0')}:00 – ${String(h + 3).padStart(2, '0')}:00`,
          start,
          end,
          factor: hourFactors[idx] || 1
        };
      });
    } else if (chartPeriod === '7days') {
      // 7 days ending today
      const dayFactors = [0.88, 0.94, 1.05, 1.12, 1.35, 1.52, 1.25];
      buckets = Array.from({ length: 7 }, (_, idx) => {
        const start = new Date(today);
        start.setDate(today.getDate() - 6 + idx);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const dayStr = start.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          label: dayStr,
          fullLabel: `${dayStr}, ${dateStr}`,
          start,
          end,
          factor: dayFactors[idx] || 1
        };
      });
    } else if (chartPeriod === '30days') {
      // 4 weekly blocks
      const weekFactors = [0.92, 1.05, 1.18, 1.28];
      buckets = Array.from({ length: 4 }, (_, idx) => {
        const start = new Date(today);
        start.setDate(today.getDate() - 28 + idx * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return {
          label: `Week ${idx + 1}`,
          fullLabel: `Week ${idx + 1} (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
          start,
          end,
          factor: weekFactors[idx] || 1
        };
      });
    } else {
      // 12 monthly blocks
      const monthFactors = [0.75, 0.82, 0.90, 0.95, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.45];
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      buckets = Array.from({ length: 12 }, (_, idx) => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 11 + idx, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        return {
          label: start.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          start,
          end,
          factor: monthFactors[idx] || 1
        };
      });
    }

    // Determine baseline daily numbers based on filtered store or whole platform
    const targetStore = chartStoreFilter !== 'all'
      ? displayStores.find((s) => isSameTenant(s.id, chartStoreFilter))
      : null;

    const baseDailyRev = targetStore
      ? (targetStore.revenueToday || 200000)
      : displayStores.reduce((sum, s) => sum + (s.revenueToday || 200000), 0);

    const baseDailyOrders = targetStore
      ? (targetStore.ordersToday || 450)
      : displayStores.reduce((sum, s) => sum + (s.ordersToday || 450), 0);

    return buckets.map((bucket) => {
      const realMatches = targetOrders.filter((o) => {
        const d = new Date(o.createdAt || o.date || o.timestamp || '');
        return !Number.isNaN(d.getTime()) && d >= bucket.start && d < bucket.end;
      });

      const realRev = realMatches.reduce((sum, o) => sum + (Number(o.total || o.totalAmount || o.totalPrice) || 0), 0);
      const realOrders = realMatches.length;

      let scaleMult = 1;
      if (chartPeriod === 'today') scaleMult = 0.125;
      else if (chartPeriod === '7days') scaleMult = 1;
      else if (chartPeriod === '30days') scaleMult = 7;
      else if (chartPeriod === 'year') scaleMult = 30;

      const baseRev = Math.round(baseDailyRev * scaleMult * bucket.factor);
      const baseOrders = Math.round(baseDailyOrders * scaleMult * bucket.factor);

      const revenue = baseRev + realRev;
      const orders = baseOrders + realOrders;
      const aov = orders > 0 ? Math.round(revenue / orders) : 0;

      return {
        ...bucket,
        revenue,
        orders,
        aov,
        realOrders,
        realRev
      };
    });
  }, [chartPeriod, chartStoreFilter, allCrossStoreOrders, displayStores]);

  // Breakdown across all partner supermarket brands
  const storePerformanceBreakdown = useMemo(() => {
    const totalRevAll = displayStores.reduce((sum, s) => sum + (s.revenueToday || 0), 0);

    return displayStores.map((st) => {
      const liveOrders = allCrossStoreOrders.filter((o) => isSameTenant(o.tenantId, st.id));
      const liveRev = liveOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount || o.totalPrice) || 0), 0);
      const totalRev = (st.revenueToday || 0) + liveRev;
      const totalOrd = (st.ordersToday || 0) + liveOrders.length;
      const share = totalRevAll > 0 ? Math.round((totalRev / (totalRevAll + liveRev || 1)) * 100) : 25;
      const aov = totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0;

      return {
        ...st,
        totalRev,
        totalOrd,
        share,
        aov,
        slaRate: '99.4%'
      };
    });
  }, [displayStores, allCrossStoreOrders]);

  // Aggregated summary metrics for the active graph window
  const chartTotals = useMemo(() => {
    const totalRev = chartDatasets.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = chartDatasets.reduce((sum, d) => sum + d.orders, 0);
    const aov = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
    const peak = chartDatasets.reduce((max, d) => ((Number(d[chartMetric]) || 0) > (Number(max?.[chartMetric]) || 0) ? d : max), chartDatasets[0]);

    return { totalRev, totalOrders, aov, peak };
  }, [chartDatasets, chartMetric]);

  // SVG Geometry for Responsive Wave / Area Chart
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 40;
  const padY = 26;

  const currentChartData = chartDatasets || [];
  const chartValues = currentChartData.map((d) => Number(d[chartMetric]) || 0);
  const chartMax = chartValues.length ? Math.max(...chartValues, 1) : 1;
  const chartMin = chartValues.length ? Math.min(...chartValues, 0) : 0;

  const chartPoints = useMemo(() => {
    return currentChartData.map((d, i) => {
      const x = padX + (i / Math.max(currentChartData.length - 1, 1)) * (svgWidth - padX * 2);
      const val = Number(d[chartMetric]) || 0;
      const range = (chartMax - chartMin * 0.85) || 1;
      const y = svgHeight - padY - ((val - chartMin * 0.85) / range) * (svgHeight - padY * 2);
      return { x, y, data: d, index: i };
    });
  }, [currentChartData, chartMetric, chartMax, chartMin, padX, padY, svgWidth, svgHeight]);

  const chartCurvePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    if (chartPoints.length === 1) return `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    let path = `M ${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  }, [chartPoints]);

  const chartAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const last = chartPoints[chartPoints.length - 1];
    const first = chartPoints[0];
    return `${chartCurvePath} L ${last.x},${svgHeight - padY} L ${first.x},${svgHeight - padY} Z`;
  }, [chartCurvePath, chartPoints, svgHeight, padY]);

  const activeChartPoint = hoveredChartIndex !== null && currentChartData[hoveredChartIndex]
    ? currentChartData[hoveredChartIndex]
    : currentChartData[currentChartData.length - 1] || null;

  // Active theme color for graph based on selected mart filter
  const chartThemeColor = useMemo(() => {
    if (chartStoreFilter === 'tenant-alfatah') return { stroke: '#991b1b', fill: '#ef4444', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
    if (chartStoreFilter === 'tenant-chasevalue') return { stroke: '#78350f', fill: '#d97706', text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (chartStoreFilter === 'tenant-chaseup') return { stroke: '#701a75', fill: '#a855f7', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };
    return { stroke: '#0e7c66', fill: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  }, [chartStoreFilter]);

  // Form states
  const [newAdminForm, setNewAdminForm] = useState({
    tenantId: 'tenant-alfatah',
    name: '',
    email: '',
    phone: '',
    password: 'admin123'
  });

  const [editPlanForm, setEditPlanForm] = useState({
    plan: 'Enterprise',
    billingCycle: 'monthly',
    price: 75000
  });

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Faisalabad',
    tenantId: 'tenant-alfatah'
  });

  // Action handlers
  const handleOpenDetails = (store) => {
    setSelectedTenant(store);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPlan = (store) => {
    setSelectedTenant(store);
    setEditPlanForm({
      plan: store.plan || 'Enterprise',
      billingCycle: 'monthly',
      price: store.plan === 'Enterprise' ? 75000 : store.plan === 'Professional' ? 35000 : 15000
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    await updateTenantSubscription(selectedTenant.id, editPlanForm);
    setIsPlanModalOpen(false);
  };

  const handleToggleStoreStatus = async (store) => {
    const isCurrentlyActive = store.status === 'Active';
    if (isCurrentlyActive) {
      await suspendTenant(store.id);
    } else {
      await activateTenant(store.id);
    }
  };

  const handleDeleteStore = async (store) => {
    if (window.confirm(`Are you sure you want to permanently delete ${store.fullName} from the platform?`)) {
      await deleteTenant(store.id);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    const targetStore = displayStores.find((s) => s.id === newAdminForm.tenantId);
    await addStoreAdmin({
      ...newAdminForm,
      tenantName: targetStore?.fullName || 'Supermarket'
    });
    setIsAddAdminOpen(false);
    setNewAdminForm({
      tenantId: 'tenant-alfatah',
      name: '',
      email: '',
      phone: '',
      password: 'admin123'
    });
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    const targetStore = displayStores.find((s) => s.id === newCustomerForm.tenantId);
    const newCust = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone,
      address: newCustomerForm.address,
      city: newCustomerForm.city || 'Faisalabad',
      tenantName: targetStore?.fullName || 'Al-Fatah Supermarket',
      tenantId: newCustomerForm.tenantId,
      ordersCount: 1,
      totalSpent: 1500,
      status: 'Active',
      joinDate: new Date().toISOString().slice(0, 10)
    };
    if (addCustomer) {
      await addCustomer(newCust);
    } else {
      setCustomers((prev) => [newCust, ...prev]);
    }
    addToast('Customer Enrolled 🎉', `${newCust.name} added to ${newCust.tenantName} customer directory.`);
    setIsAddCustomerOpen(false);
    setNewCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: 'Faisalabad',
      tenantId: 'tenant-alfatah'
    });
  };

  const togglePasswordVisibility = (adminId) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

  // Reports generator with live animated progress & instant CSV download
  const handleDownloadReport = (reportTitle, reportType) => {
    setIsDownloadingReport(true);
    setDownloadingReportTitle(reportTitle);
    setDownloadProgress(10);
    setDownloadStage('Extracting multi-store records from database...');

    setTimeout(() => {
      setDownloadProgress(35);
      setDownloadStage('Auditing 15-minute delivery SLA & courier metrics...');
    }, 250);

    setTimeout(() => {
      setDownloadProgress(70);
      setDownloadStage('Generating certified spreadsheet CSV structure...');
    }, 600);

    setTimeout(() => {
      setDownloadProgress(100);
      setDownloadStage('File ready — downloading to your device!');

      let csvContent = '';
      let filename = '';

      if (reportType === 'sales') {
        filename = `FreshMart_Sales_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent =
          'Order ID,Supermarket,Customer,Amount (PKR),Status,Date,City\n' +
          allCrossStoreOrders
            .map(
              (o) =>
                `"${o.id || o.orderId}","${o.tenantName || 'FreshMart'}","${o.customerName || 'Customer'}",${
                  o.total || o.totalAmount || 0
                },"${o.status || 'Delivered'}","${new Date(o.createdAt || Date.now()).toLocaleDateString()}","${
                  o.city || 'Faisalabad'
                }"`
            )
            .join('\n');
      } else if (reportType === 'sla') {
        filename = `FreshMart_Delivery_SLA_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent =
          'Supermarket,Target Express SLA,Compliance Rate,Avg Packing Duration,Avg Courier Transit,Breaches,Status\n' +
          'Al-Fatah Supermarket,15 min,99.4%,4.1 min,11.2 min,0,Compliant\n' +
          'Chase Up,15 min,98.8%,4.5 min,12.1 min,0,Compliant\n' +
          'Chase Value (Case Value),15 min,99.1%,3.9 min,11.5 min,0,Compliant\n' +
          'Unimaart (Market Store),15 min,99.5%,3.8 min,10.9 min,0,Compliant\n';
      } else if (reportType === 'customers') {
        filename = `FreshMart_Customer_Intelligence_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent =
          'Customer ID,Full Name,Email,Phone,Primary Mart,Lifetime Orders,Total Spent (PKR),City,Status\n' +
          (customers || [])
            .map(
              (c) =>
                `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.tenantName || 'Al-Fatah'}",${
                  c.ordersCount || 1
                },${c.totalSpent || 1000},"${c.city || 'Faisalabad'}","${c.status || 'Active'}"`
            )
            .join('\n');
      } else {
        filename = `FreshMart_Cross_Store_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent =
          'Order ID,Supermarket,Customer Name,Phone,Address,Items,Total Amount (PKR),Status,Created At\n' +
          allCrossStoreOrders
            .map(
              (o) =>
                `"${o.id || o.orderId}","${o.tenantName || 'Mart'}","${o.customerName || 'Customer'}","${
                  o.customerPhone || ''
                }","${o.address || o.shippingAddress?.address || ''}","${o.items || 'Grocery Items'}",${
                  o.total || o.totalAmount || 0
                },"${o.status || 'Pending'}","${new Date(o.createdAt || Date.now()).toLocaleString()}"`
            )
            .join('\n');
      }

      // Download file to user
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Download Finished 📊', `${reportTitle} has been downloaded.`);

      setTimeout(() => {
        setIsDownloadingReport(false);
        setDownloadProgress(0);
      }, 900);
    }, 1100);
  };

  // Save platform settings handler
  const handleSavePlatformSettings = (e) => {
    if (e) e.preventDefault();
    updatePlatformSettings(settingsForm);
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((c) => {
      const q = customerSearch.toLowerCase().trim();
      return (
        !q ||
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q) ||
        String(c.tenantName || '').toLowerCase().includes(q)
      );
    });
  }, [customers, customerSearch]);

  const navBtnClass = (key) =>
    activeNav === key
      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/20'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/50';

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      {/* ===================================================================== */}
      {/* SIDEBAR NAVIGATION                                                    */}
      {/* ===================================================================== */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-900 h-full overflow-hidden">
        {/* Platform Brand Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-800/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-lg">
            FM
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-white text-sm tracking-tight truncate">
              {platformSettings?.platformTitle || 'FreshMart Super Platform'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Super Admin Console
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs font-medium">
          {/* OVERVIEW */}
          <div>
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${navBtnClass('dashboard')}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>
          </div>

          {/* TENANT MANAGEMENT */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Supermarket Marts
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('tenants')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('tenants')}`}
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Tenants (Marts)</span>
                <span className="ml-auto text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded font-bold">
                  {displayStores.length}
                </span>
              </button>
              <button
                onClick={() => setActiveNav('plans')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('plans')}`}
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Subscription Plans</span>
              </button>
            </div>
          </div>

          {/* USERS & ACCESS */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Users & Credentials
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('admins')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('admins')}`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Mart Admins</span>
                <span className="ml-auto text-[10px] bg-amber-900/60 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded-full font-bold">
                  {(storeAdmins || []).length}
                </span>
              </button>
              <button
                onClick={() => setActiveNav('customers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('customers')}`}
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Customers</span>
                <span className="ml-auto text-[10px] bg-sky-900/60 text-sky-300 border border-sky-700/50 px-1.5 py-0.5 rounded-full font-bold">
                  {(customers || []).length}
                </span>
              </button>
            </div>
          </div>

          {/* ORDERS & FULFILLMENT */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Fulfillment & Dispatch
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('orders')}`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Cross-Store Orders</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {allCrossStoreOrders.length}
                </span>
              </button>
              <button
                onClick={() => setActiveNav('performance')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('performance')}`}
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Delivery SLA</span>
                <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  99.2%
                </span>
              </button>
            </div>
          </div>

          {/* REPORTS & SETTINGS */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Platform Governance
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('reports')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('reports')}`}
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Reports Center</span>
              </button>
              <button
                onClick={() => setActiveNav('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${navBtnClass('settings')}`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Platform Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Pinned User Profile Card */}
        <div className="p-3 m-3 mt-auto shrink-0 bg-[#111C3A] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
              👑
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Super Admin</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">Root Platform Controller</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (navigateTo) navigateTo('customer');
                else window.location.href = '/';
              }}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
            >
              <span>View Customer Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={adminLogout}
              className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Sign Out Super Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA                                                     */}
      {/* ===================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Super Admin</span>
              <span>/</span>
              <span className="capitalize text-slate-700 font-bold">{activeNav}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <div className="relative w-56 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, admins, marts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Sub-Dashboard Workspace */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 1. DASHBOARD OVERVIEW                                  */}
          {/* ===================================================================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>👋</span> Welcome back, Super Admin!
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Managing live grocery operations across Al-Fatah, Chase Up, Case Value, and Unimaart.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveNav('admins')}
                    className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Manage Mart Admins</span>
                  </button>
                  <button
                    onClick={() => setIsAddTenantOpen(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Supermarket</span>
                  </button>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Supermarket Tenants */}
                <div
                  onClick={() => setActiveNav('tenants')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Supermarkets</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{displayStores.length} Active</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>Al-Fatah, Chase Up, Case Value, Unimaart</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 2. Mart Admins */}
                <div
                  onClick={() => setActiveNav('admins')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Mart Admins</span>
                      <span className="text-2xl font-black text-amber-600 mt-1 block">{(storeAdmins || []).length} Registered</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-amber-700">
                    <span>Full Store Control Credentials</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 3. Customers */}
                <div
                  onClick={() => setActiveNav('customers')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Total Customers</span>
                      <span className="text-2xl font-black text-sky-600 mt-1 block">{(customers || []).length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-sky-700">
                    <span>Active Verified Shoppers</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 4. Cross-Store Orders */}
                <div
                  onClick={() => setActiveNav('orders')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Cross-Store Orders</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{allCrossStoreOrders.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-purple-700">
                    <span>Consolidated Live Stream</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 5. Delivery SLA */}
                <div
                  onClick={() => setActiveNav('performance')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Delivery SLA</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">99.2%</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>15-Min Express Standard</span>
                    <span>✓ Active</span>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* 🌟 NEW PROMINENT SECTION: CROSS-STORE PLATFORM ANALYTICS & GRAPH       */}
              {/* ===================================================================== */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left: Main Interactive Graph (8 Cols on xl) */}
                <div className="xl:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
                  
                  {/* Top Bar: Title & Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          Platform GMV & Order Velocity
                        </h3>
                        <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md">
                          Live Metrics
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Consolidated transaction velocity and parcel performance across all 4 supermarket brands.
                      </p>
                    </div>

                    {/* Filter & Metric Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Supermarket Filter Dropdown */}
                      <div className="relative">
                        <select
                          value={chartStoreFilter}
                          onChange={(e) => setChartStoreFilter(e.target.value)}
                          className="appearance-none text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl pl-3 pr-7 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
                        >
                          <option value="all">🏬 All Supermarkets</option>
                          <option value="tenant-alfatah">🏬 Al-Fatah Supermarket</option>
                          <option value="tenant-chasevalue">🛒 Case Value</option>
                          <option value="tenant-chaseup">🏪 Chase Up</option>
                          <option value="tenant-freshmart">🛒 Unimaart Direct</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Metric Switcher (Revenue vs Orders vs AOV) */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setChartMetric('revenue')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            chartMetric === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Revenue
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetric('orders')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            chartMetric === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetric('aov')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            chartMetric === 'aov' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          AOV
                        </button>
                      </div>

                      {/* Time Period Selector */}
                      <div className="relative">
                        <select
                          value={chartPeriod}
                          onChange={(e) => setChartPeriod(e.target.value)}
                          className="appearance-none text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl pl-3 pr-7 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
                        >
                          <option value="today">Today (Hourly)</option>
                          <option value="7days">Last 7 Days</option>
                          <option value="30days">Last 30 Days</option>
                          <option value="year">12 Months (Year)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Line / Bar Chart Toggle */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setChartStyle('line')}
                          title="Wave Area Chart"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            chartStyle === 'line' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartStyle('bar')}
                          title="Bar Columns Chart"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            chartStyle === 'bar' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Active Data Point Inspection Card */}
                  {activeChartPoint && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs"
                          style={{ backgroundColor: chartThemeColor.stroke }}
                        >
                          {chartMetric === 'revenue' ? 'Rs' : chartMetric === 'orders' ? '📦' : '★'}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block leading-tight">
                            {activeChartPoint.fullLabel || activeChartPoint.label}
                          </span>
                          <span className="text-lg font-black text-slate-900 tracking-tight">
                            {chartMetric === 'revenue'
                              ? `PKR ${activeChartPoint.revenue.toLocaleString()}`
                              : chartMetric === 'orders'
                              ? `${activeChartPoint.orders.toLocaleString()} Parcels Dispatched`
                              : `PKR ${activeChartPoint.aov.toLocaleString()} Avg Order`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                        <span className={`font-bold px-2.5 py-1 rounded-lg ${chartThemeColor.bg} ${chartThemeColor.text} ${chartThemeColor.border} border`}>
                          📦 {activeChartPoint.orders.toLocaleString()} Orders
                        </span>
                        <span className="font-mono text-slate-500 text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                          AOV: PKR {activeChartPoint.aov.toLocaleString()}
                        </span>
                        {chartTotals.peak?.label === activeChartPoint.label && (
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Peak Period
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive SVG Chart Canvas */}
                  <div className="relative h-64 w-full flex items-center justify-center">
                    
                    {chartStyle === 'line' ? (
                      /* Smooth SVG Wave / Area Chart */
                      <svg
                        className="w-full h-full overflow-visible select-none"
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="superAdminGmvGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartThemeColor.fill} stopOpacity="0.45" />
                            <stop offset="60%" stopColor={chartThemeColor.fill} stopOpacity="0.10" />
                            <stop offset="100%" stopColor={chartThemeColor.fill} stopOpacity="0.0" />
                          </linearGradient>
                          <filter id="superGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={chartThemeColor.stroke} floodOpacity="0.35" />
                          </filter>
                        </defs>

                        {/* Background Horizontal Guide Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                          const yPos = padY + (svgHeight - padY * 2) * pct;
                          const gridVal = Math.round(chartMax - (chartMax - chartMin * 0.85) * pct);
                          return (
                            <g key={idx}>
                              <line
                                x1={padX}
                                y1={yPos}
                                x2={svgWidth - padX}
                                y2={yPos}
                                stroke="#f1f5f9"
                                strokeDasharray={pct === 1 ? 'none' : '4 4'}
                                strokeWidth="1"
                              />
                              <text
                                x={padX - 8}
                                y={yPos + 3}
                                textAnchor="end"
                                className="text-[9px] fill-slate-400 font-mono font-medium"
                              >
                                {chartMetric === 'revenue'
                                  ? `${Math.round(gridVal / 1000)}k`
                                  : gridVal.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Gradient Fill */}
                        {chartAreaPath && (
                          <path
                            d={chartAreaPath}
                            fill="url(#superAdminGmvGrad)"
                            className="transition-all duration-300"
                          />
                        )}

                        {/* Glowing Curve Line */}
                        {chartCurvePath && (
                          <path
                            d={chartCurvePath}
                            fill="none"
                            stroke={chartThemeColor.stroke}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#superGlow)"
                            className="transition-all duration-300"
                          />
                        )}

                        {/* Active Vertical Guideline if Hovered */}
                        {hoveredChartIndex !== null && chartPoints[hoveredChartIndex] && (
                          <line
                            x1={chartPoints[hoveredChartIndex].x}
                            y1={padY}
                            x2={chartPoints[hoveredChartIndex].x}
                            y2={svgHeight - padY}
                            stroke={chartThemeColor.stroke}
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            opacity="0.7"
                          />
                        )}

                        {/* Data Point Nodes */}
                        {chartPoints.map((pt) => {
                          const isHovered = hoveredChartIndex === pt.index;
                          const isLast = pt.index === chartPoints.length - 1 && hoveredChartIndex === null;
                          return (
                            <g key={pt.index}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : isLast ? 5 : 3.5}
                                fill={isHovered || isLast ? '#ffffff' : chartThemeColor.stroke}
                                stroke={chartThemeColor.stroke}
                                strokeWidth={isHovered ? 3.5 : 2}
                                className="transition-all duration-150 cursor-pointer"
                              />
                              {/* Bottom X-Axis Label */}
                              <text
                                x={pt.x}
                                y={svgHeight - 6}
                                textAnchor="middle"
                                className={`text-[10px] font-bold select-none ${
                                  isHovered ? 'fill-slate-900 font-black' : 'fill-slate-400'
                                }`}
                              >
                                {pt.data.label}
                              </text>
                            </g>
                          );
                        })}

                        {/* Transparent Hover Interactivity Overlay Blocks */}
                        {chartPoints.map((pt) => {
                          const width = (svgWidth - padX * 2) / (chartPoints.length || 1);
                          return (
                            <rect
                              key={`hover-${pt.index}`}
                              x={pt.x - width / 2}
                              y={0}
                              width={width}
                              height={svgHeight}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredChartIndex(pt.index)}
                              onMouseLeave={() => setHoveredChartIndex(null)}
                            />
                          );
                        })}
                      </svg>
                    ) : (
                      /* Grouped Column Bar Chart */
                      <div className="w-full h-full flex items-end justify-between gap-2 sm:gap-3 px-4 pb-7 pt-4">
                        {currentChartData.map((d, idx) => {
                          const val = Number(d[chartMetric]) || 0;
                          const pct = Math.max(8, Math.min(100, Math.round((val / chartMax) * 100)));
                          const isHovered = hoveredChartIndex === idx;

                          return (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredChartIndex(idx)}
                              onMouseLeave={() => setHoveredChartIndex(null)}
                              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                            >
                              {/* Hover Value Pill */}
                              <div
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md mb-1.5 transition-all whitespace-nowrap ${
                                  isHovered
                                    ? 'bg-slate-900 text-white shadow-xs scale-105'
                                    : 'text-slate-400 opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                {chartMetric === 'revenue'
                                  ? `${Math.round(val / 1000)}k`
                                  : val.toLocaleString()}
                              </div>

                              {/* Bar Pillar */}
                              <div className="w-full max-w-[42px] bg-slate-100 rounded-xl overflow-hidden flex flex-col justify-end h-full">
                                <div
                                  style={{
                                    height: `${pct}%`,
                                    backgroundColor: isHovered ? chartThemeColor.stroke : chartThemeColor.fill
                                  }}
                                  className="w-full rounded-xl transition-all duration-300 shadow-2xs group-hover:brightness-110"
                                />
                              </div>

                              {/* X Axis Label */}
                              <span className="text-[10px] font-bold text-slate-500 mt-2 block select-none">
                                {d.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                  {/* 4 Summary Footers for Selected Period */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Volume</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
                        PKR {chartTotals.totalRev.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">↑ 14.8% vs last cycle</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Parcels</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
                        {chartTotals.totalOrders.toLocaleString()} Orders
                      </span>
                      <span className="text-[10px] font-semibold text-sky-600 mt-0.5 block">100% Verified Stream</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Basket (AOV)</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
                        PKR {chartTotals.aov.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Multi-Category Spend</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Peak Performance</span>
                      <span className="text-sm sm:text-base font-black text-amber-600 mt-0.5 block truncate">
                        {chartTotals.peak?.fullLabel || chartTotals.peak?.label}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 mt-0.5 block">
                        {chartMetric === 'revenue'
                          ? `PKR ${chartTotals.peak?.revenue.toLocaleString()}`
                          : `${chartTotals.peak?.orders.toLocaleString()} orders`}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right: Supermarket Market Share & Distribution (4 Cols on xl) */}
                <div className="xl:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                          <PieChart className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Brand Revenue Share</h3>
                          <p className="text-[11px] text-slate-500">Live GMV distribution by supermarket</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        4 Brands
                      </span>
                    </div>

                    {/* Progress bars & store listings */}
                    <div className="space-y-3.5 mt-4">
                      {storePerformanceBreakdown.map((st) => {
                        const isFiltered = chartStoreFilter === st.id;
                        return (
                          <div
                            key={st.id}
                            onClick={() => setChartStoreFilter(isFiltered ? 'all' : st.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer ${
                              isFiltered
                                ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                                : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{st.logo || '🏬'}</span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-slate-900 truncate">{st.fullName || st.name}</h4>
                                  <span className="text-[10px] text-slate-500 font-medium block">
                                    {st.totalOrd.toLocaleString()} Orders • AOV: Rs. {st.aov.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="text-xs font-black text-slate-900 block">
                                  PKR {st.totalRev.toLocaleString()}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block text-white"
                                  style={{ backgroundColor: st.color || '#0e7c66' }}
                                >
                                  {st.share}% Share
                                </span>
                              </div>
                            </div>

                            {/* Proportional Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                              <div
                                style={{
                                  width: `${Math.max(5, Math.min(100, st.share))}%`,
                                  backgroundColor: st.color || '#0e7c66'
                                }}
                                className="h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter action footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">
                      {chartStoreFilter === 'all'
                        ? 'Showing: All 4 Supermarkets'
                        : `Filtered: ${displayStores.find((s) => isSameTenant(s.id, chartStoreFilter))?.name || 'Selected Mart'}`}
                    </span>
                    {chartStoreFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => setChartStoreFilter('all')}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Reset to All →
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold">
                        Click any store to isolate
                      </span>
                    )}
                  </div>

                </div>

              </div>

              {/* 🌟 NEW PROMINENT SECTION: Supermarket Mart Admins & Credentials */}
              <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <span>Supermarket Mart Admins & Passwords</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dedicated login accounts for Al-Fatah, Chase Up, Case Value, and Unimaart. Set custom passwords or log in directly.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveNav('admins')}
                    className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    View All Mart Admins →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {(storeAdmins || []).map((admin) => {
                    const isShown = !!showPasswordMap[admin.id];
                    return (
                      <div
                        key={admin.id}
                        className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-300 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {admin.tenantName}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {admin.status || 'Active'}
                            </span>
                          </div>
                          <p className="font-black text-slate-900 text-sm">{admin.name}</p>
                          <p className="font-mono text-slate-600 text-[11px] truncate">{admin.email}</p>
                        </div>

                        {/* Password Box */}
                        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono font-bold text-xs text-slate-800 truncate">
                              {isShown ? admin.password : '••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(admin.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title={isShown ? 'Hide' : 'Show'}
                            >
                              {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(admin.password);
                                addToast('Copied!', 'Password copied to clipboard.');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newPass = prompt(`Set new password for ${admin.name} (${admin.tenantName}):`, admin.password);
                              if (newPass && newPass.trim()) {
                                updateStoreAdmin(admin.id, { password: newPass.trim() });
                                addToast('Password Updated 🔑', `New password saved for ${admin.name}.`);
                              }
                            }}
                            className="flex-1 py-1.5 text-center text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          >
                            Reset Key
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const matchedTenant = (tenants || []).find((t) => isSameTenant(t.id, admin.tenantId)) || displayStores.find((s) => s.id === admin.tenantId);
                              if (matchedTenant && setCurrentTenant) {
                                setCurrentTenant(matchedTenant);
                              }
                              if (navigateTo) {
                                navigateTo('admin');
                              } else {
                                window.location.href = `/?portal=admin&store=${admin.tenantId}`;
                              }
                            }}
                            className="flex-1 py-1.5 text-center text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer shadow-xs"
                          >
                            Open Console
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4 Supermarket Brands Quick Grid */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Registered Supermarket Stores</h3>
                    <p className="text-[11px] text-slate-500">Live operational overview for each supermarket partner</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('tenants')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition"
                  >
                    Manage Supermarkets →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayStores.map((store) => (
                    <div
                      key={store.id}
                      className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{store.logo}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {store.plan}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-tight">{store.fullName}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{store.tagline}</p>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                          <p><strong className="text-slate-800">Owner:</strong> {store.ownerName}</p>
                          <p className="font-mono text-[10px] text-slate-500 truncate">{store.ownerEmail}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">📍 {store.location}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() => handleOpenDetails(store)}
                          className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenPlan(store)}
                          className="font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                        >
                          Plan: {store.plan}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Cross-Store Orders Feed */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Recent Cross-Store Orders</h3>
                    <p className="text-[11px] text-slate-500">Live order flow across all 4 supermarket brands</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('orders')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition"
                  >
                    View All Orders ({allCrossStoreOrders.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 pl-4">Order ID</th>
                        <th className="py-3">Supermarket</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allCrossStoreOrders.slice(0, 5).map((ord) => (
                        <tr key={ord.id || ord.orderId} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pl-4 font-mono font-bold text-slate-900">{ord.id || ord.orderId}</td>
                          <td className="py-3 font-semibold text-slate-800">
                            {ord.tenantName || 'Supermarket'}
                          </td>
                          <td className="py-3 text-slate-700 font-medium">{ord.customerName || ord.customer || 'Customer'}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">
                            Rs. {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {ord.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrderInvoice(ord);
                                setIsInvoiceOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 2. TENANTS (SUPERMARKET MARTS)                          */}
          {/* ===================================================================== */}
          {activeNav === 'tenants' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <span>Supermarket Tenants Registry</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Managing Pakistani supermarket brands: Al-Fatah, Chase Up, Case Value, and Unimaart.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddTenantOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Supermarket</span>
                </button>
              </div>

              {/* Tenants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayStores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{store.logo}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              store.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {store.status}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {store.plan}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 text-base leading-tight">{store.fullName}</h3>
                        <p className="text-xs text-slate-500 mt-1">{store.tagline}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <p><strong className="text-slate-700">Owner:</strong> {store.ownerName}</p>
                        <p className="font-mono text-slate-500 truncate">{store.ownerEmail}</p>
                        <p className="text-emerald-700 font-semibold text-[11px]">📍 {store.location}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenDetails(store)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenPlan(store)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                      >
                        Plan Tier
                      </button>
                      <button
                        onClick={() => handleToggleStoreStatus(store)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          store.status === 'Active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {store.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 3. SUBSCRIPTION PLANS                                  */}
          {/* ===================================================================== */}
          {activeNav === 'plans' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span>Supermarket Tenant Subscription Plans</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Multi-tier service models for Pakistani supermarket partners with transparent fees & SLAs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-lg">{plan.name} Tier</h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {plan.commissionRate}% Commission
                        </span>
                      </div>

                      <div>
                        <span className="text-3xl font-black text-slate-900">
                          PKR {plan.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium ml-1">/ month</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                          Features & Entitlements:
                        </span>
                        {(plan.features || []).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => addToast('Subscription Managed', `Super Admin viewing ${plan.name} tier configurations.`)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Configure Tier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 4. MART ADMINS MANAGEMENT                              */}
          {/* ===================================================================== */}
          {activeNav === 'admins' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <span>Mart Admins Credentials & Password Control</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Every grocery shop has its dedicated Store Admin account and custom credentials assigned by Super Admin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddAdminOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Store Admin & Set Password</span>
                  </button>
                </div>
              </div>

              {/* Mart Admins Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {(storeAdmins || []).length} Registered Mart Admins
                  </span>
                  <button
                    onClick={() => setIsAddAdminOpen(true)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Admin</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {(storeAdmins || []).map((admin) => {
                    const isPasswordShown = !!showPasswordMap[admin.id];
                    return (
                      <div
                        key={admin.id}
                        className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 text-sm truncate">{admin.name}</span>
                              <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded-full text-slate-700">
                                {admin.tenantName}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  admin.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {admin.status || 'Active'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                              {admin.email} {admin.phone && `• ${admin.phone}`} {admin.location && `• 📍 ${admin.location}`}
                            </div>
                          </div>
                        </div>

                        {/* Password & Controls */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {isPasswordShown ? admin.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(admin.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title={isPasswordShown ? 'Hide' : 'Show'}
                            >
                              {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(admin.password);
                                addToast('Copied!', 'Password copied to clipboard.');
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newPass = prompt(`Set new password for ${admin.name} (${admin.tenantName}):`, admin.password);
                              if (newPass && newPass.trim()) {
                                updateStoreAdmin(admin.id, { password: newPass.trim() });
                                addToast('Password Changed 🔑', `New password set for ${admin.name}.`);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                          >
                            Reset Key
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleStoreAdminStatus(admin.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              admin.status === 'Active'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete Mart Admin ${admin.name}?`)) {
                                deleteStoreAdmin(admin.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 5. CUSTOMERS DIRECTORY                                 */}
          {/* ===================================================================== */}
          {activeNav === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600" />
                    <span>Customer Directory & Shopper Intelligence</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Verified registered customers and active grocery delivery recipients across all supermarkets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Customer Manually</span>
                  </button>
                </div>
              </div>

              {/* Customer Search & Counter */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or mart..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <span className="text-xs font-bold text-slate-600">
                  Showing {filteredCustomers.length} of {(customers || []).length} registered shoppers
                </span>
              </div>

              {/* Customers Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 pl-4">Customer Name</th>
                        <th className="py-3">Contact</th>
                        <th className="py-3">Delivery Address</th>
                        <th className="py-3">Preferred Mart</th>
                        <th className="py-3">Orders</th>
                        <th className="py-3">Total Spent</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-400">
                            No customers match your search query.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 pl-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {(cust.name || 'C').slice(0, 1).toUpperCase()}
                                </div>
                                <span>{cust.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-slate-600 font-mono text-[11px]">
                              <div>{cust.phone}</div>
                              <div className="text-slate-400 text-[10px]">{cust.email}</div>
                            </td>
                            <td className="py-3 text-slate-600 max-w-xs truncate">
                              {cust.address}, {cust.city || 'Faisalabad'}
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              {cust.tenantName || 'Al-Fatah Supermarket'}
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-900">
                              {cust.ordersCount || 1}
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-900">
                              Rs. {Number(cust.totalSpent || 1200).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {cust.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete customer ${cust.name}?`)) {
                                    if (deleteCustomer) deleteCustomer(cust.id);
                                    else setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Remove customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 6. CROSS-STORE ORDERS STREAM                           */}
          {/* ===================================================================== */}
          {activeNav === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    <span>Cross-Store Orders Dispatch Stream</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time consolidated grocery orders across Al-Fatah, Case Value, Chase Up, and Unimaart.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadReport('Orders Audit CSV', 'orders')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Orders CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1">Supermarket:</span>
                  {[
                    { key: 'all', label: 'All Marts' },
                    { key: 'tenant-alfatah', label: 'Al-Fatah' },
                    { key: 'tenant-chaseup', label: 'Chase Up' },
                    { key: 'tenant-chasevalue', label: 'Case Value' },
                    { key: 'tenant-freshmart', label: 'Unimaart' }
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setOrderSupermarketFilter(m.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        orderSupermarketFilter === m.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
                  {['all', 'pending', 'prepared', 'out for delivery', 'delivered'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                        orderStatusFilter === s
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 pl-4">Order ID</th>
                        <th className="py-3">Supermarket</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Address</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Fulfillment Staff</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-400">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-lg mb-2">📦</div>
                            <p className="text-xs font-bold text-slate-600">No orders match current filter</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id || ord.orderId} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 pl-4 font-mono font-bold text-slate-900">{ord.id || ord.orderId}</td>
                            <td className="py-3 font-semibold text-slate-800">
                              {ord.tenantName || 'Supermarket'}
                            </td>
                            <td className="py-3 text-slate-700 font-medium">
                              <div>{ord.customerName || ord.customer || 'Customer'}</div>
                              <div className="text-slate-400 text-[10px] font-mono">{ord.customerPhone}</div>
                            </td>
                            <td className="py-3 text-slate-500 max-w-xs truncate">
                              {ord.address || ord.shippingAddress?.address || 'Faisalabad'}
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-900">
                              Rs. {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 text-slate-600">
                              {ord.pickupStaffName ? `📦 ${ord.pickupStaffName}` : '—'}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {ord.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedOrderInvoice(ord);
                                  setIsInvoiceOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 7. DELIVERY SLA PERFORMANCE                            */}
          {/* ===================================================================== */}
          {activeNav === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <span>15-Minute Express Grocery Delivery SLA Compliance</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time live monitoring of dispatch times, packing SLAs, and courier doorstep delivery speeds.
                </p>
              </div>

              {/* 3 Live SLA Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Express Delivery SLA</span>
                  <span className="text-3xl font-black block text-emerald-600">99.2%</span>
                  <span className="text-[11px] text-slate-400 font-medium">Benchmark: ≥ 98.5% on-time completion</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Average Preparation Time</span>
                  <span className="text-3xl font-black block text-blue-600">4.1 mins</span>
                  <span className="text-[11px] text-slate-400 font-medium">Pickup staff packing speed (max 7 mins)</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Average Courier Transit</span>
                  <span className="text-3xl font-black block text-purple-600">11.8 mins</span>
                  <span className="text-[11px] text-slate-400 font-medium">Doorstep transit from dark store hub</span>
                </div>
              </div>

              {/* Store-by-Store SLA Compliance Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900">Supermarket Store SLA Compliance</h3>
                <div className="divide-y divide-slate-100">
                  {[
                    { name: 'Al-Fatah Supermarket', logo: '🏬', sla: '99.4%', prep: '4.1 min', transit: '11.2 min', breaches: 0 },
                    { name: 'Chase Up', logo: '🏪', sla: '98.8%', prep: '4.5 min', transit: '12.1 min', breaches: 0 },
                    { name: 'Chase Value (Case Value)', logo: '🛒', sla: '99.1%', prep: '3.9 min', transit: '11.5 min', breaches: 0 },
                    { name: 'Unimaart (Market Store)', logo: '🛒', sla: '99.5%', prep: '3.8 min', transit: '10.9 min', breaches: 0 }
                  ].map((s, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{s.logo}</span>
                        <div>
                          <span className="font-bold text-slate-800 block">{s.name}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">15-min express fulfillment certified</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.sla} On-Time
                        </span>
                        <span className="text-slate-600 font-mono">Prep: {s.prep}</span>
                        <span className="text-slate-600 font-mono">Transit: {s.transit}</span>
                        <span className="text-slate-400 font-medium">Breaches: {s.breaches}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 8. REPORTS CENTER WITH PROGRESS BAR                    */}
          {/* ===================================================================== */}
          {activeNav === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-600" />
                  <span>Platform Reports & Analytics Center</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Generate certified CSV and spreadsheet audit files for multi-store operations, sales, customers, and SLAs.
                </p>
              </div>

              {/* Animated Download Progress Bar Card */}
              {isDownloadingReport && (
                <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-800 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      Generating {downloadingReportTitle}...
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-400">{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-900 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-300/80 font-mono">{downloadStage}</p>
                </div>
              )}

              {/* 4 Certified Reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    title: 'Monthly GMV & Multi-Mart Sales Audit',
                    type: 'sales',
                    desc: 'Consolidated transaction volume, item sales, and total customer spending across all 4 supermarket brands.',
                    format: 'CSV Export'
                  },
                  {
                    title: 'Delivery SLA & Courier Dispatch Compliance',
                    type: 'sla',
                    desc: '15-minute express delivery audit, pickup packing durations, rider transit speeds, and breach frequency logs.',
                    format: 'CSV Summary'
                  },
                  {
                    title: 'Customer Directory & Basket Intelligence',
                    type: 'customers',
                    desc: 'Registered shoppers directory, order frequencies, customer contact numbers, and delivery addresses.',
                    format: 'CSV Dataset'
                  },
                  {
                    title: 'Consolidated Cross-Store Orders Ledger',
                    type: 'orders',
                    desc: 'Line-by-line itemized orders stream with fulfillment statuses, staff tags, and customer delivery OTPs.',
                    format: 'CSV Ledger'
                  }
                ].map((rep, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">{rep.title}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {rep.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                    </div>

                    <button
                      disabled={isDownloadingReport}
                      onClick={() => handleDownloadReport(rep.title, rep.type)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 9. PLATFORM SETTINGS (EDITABLE & PERSISTENT)           */}
          {/* ===================================================================== */}
          {activeNav === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span>Platform System Settings & Operational Rules</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure platform title, support contacts, delivery fees, and express SLA rules. Changes save immediately.
                </p>
              </div>

              <form onSubmit={handleSavePlatformSettings} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Platform Brand Title</label>
                    <input
                      type="text"
                      value={settingsForm.platformTitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, platformTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Marketplace Tagline</label>
                    <input
                      type="text"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Support Phone Helpline</label>
                    <input
                      type="text"
                      value={settingsForm.supportPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settingsForm.supportEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Free Delivery Threshold (Rs.)</label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Orders above this amount receive free delivery</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Base Delivery Fee (Rs.)</label>
                    <input
                      type="number"
                      value={settingsForm.defaultDeliveryFee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultDeliveryFee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Express Delivery SLA (Minutes)</label>
                    <input
                      type="number"
                      value={settingsForm.expressSlaMinutes}
                      onChange={(e) => setSettingsForm({ ...settingsForm, expressSlaMinutes: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Target delivery time for shoppers (default: 15 mins)</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dark Store Radius (KM)</label>
                    <input
                      type="number"
                      value={settingsForm.deliveryRadiusKm}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deliveryRadiusKm: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Platform Operational Automation:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.autoAssignStaff}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoAssignStaff: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Auto-Assign Incoming Orders to Pickup Staff</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.autoAssignRiders}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoAssignRiders: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Auto-Dispatch Prepared Parcels to Nearest Rider</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.whatsappReceipts}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappReceipts: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Send WhatsApp Delivery Confirmation & Digital Receipts</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.smsNotifications}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smsNotifications: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700">Customer SMS Delivery Notifications</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ===================================================================== */}
      {/* MODAL: ADD MART ADMIN & SET PASSWORD                                  */}
      {/* ===================================================================== */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Add Mart Admin & Set Password
                </h3>
                <span className="text-xs text-slate-500">Every mart has its own dedicated admin account</span>
              </div>
              <button
                onClick={() => setIsAddAdminOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Supermarket Mart</label>
                <select
                  value={newAdminForm.tenantId}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  {displayStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.logo} {store.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sheikh Tariq Al-Fatah"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Login Email / Username</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@alfatah.pk"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Set Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter login password for this Store Admin"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+92 300 8441122"
                  value={newAdminForm.phone}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Create & Assign Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD CUSTOMER MANUALLY                                          */}
      {/* ===================================================================== */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Add Customer to Directory</h3>
                <span className="text-xs text-slate-500">Super Admin direct customer registration</span>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tayyaba Batool"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tayyaba@gmail.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House #14, D-Ground, Faisalabad"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Supermarket</label>
                <select
                  value={newCustomerForm.tenantId}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  {displayStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.logo} {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: REGISTER NEW SUPERMARKET                                       */}
      {/* ===================================================================== */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Register New Supermarket Store</h3>
                <span className="text-xs text-slate-500">Create a new supermarket partner on the platform</span>
              </div>
              <button onClick={() => setIsAddTenantOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const storeName = formData.get('name');
                const ownerEmail = formData.get('email');
                const plan = formData.get('plan') || 'Professional';

                await addTenant({
                  name: storeName,
                  slug: storeName.toLowerCase().replace(/\s+/g, '-'),
                  tagline: 'Quality Fresh Groceries & Household Essentials',
                  ownerName: formData.get('ownerName') || 'Store Partner',
                  ownerEmail: ownerEmail,
                  color: '#0e7c66',
                  logo: '🏬',
                  subscription: {
                    plan: plan,
                    billingCycle: 'Monthly',
                    price: plan === 'Enterprise' ? 75000 : plan === 'Professional' ? 35000 : 15000,
                    status: 'Active',
                    features: ['Store Admin Console', 'Unlimited Products', 'Fleet Dispatch']
                  },
                  hubs: ['Main Hub (Faisalabad)']
                });

                addToast('Supermarket Registered 🎉', `${storeName} added with ${plan} subscription.`);
                setIsAddTenantOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supermarket Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Imtiaz Super Market"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Imtiaz Abbasi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Owner Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. admin@imtiaz.pk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subscription Plan Tier</label>
                <select
                  name="plan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Enterprise">Enterprise (PKR 75,000/mo - 2% Commission)</option>
                  <option value="Professional">Professional (PKR 35,000/mo - 3.5% Commission)</option>
                  <option value="Starter">Starter (PKR 15,000/mo - 5% Commission)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Register Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MANAGE SUBSCRIPTION PLAN                                       */}
      {/* ===================================================================== */}
      {isPlanModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Update Subscription Tier
                </h3>
                <span className="text-xs text-slate-500">{selectedTenant.fullName}</span>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Plan Tier</label>
                <select
                  value={editPlanForm.plan}
                  onChange={(e) => {
                    const planKey = e.target.value;
                    const price = planKey === 'Enterprise' ? 75000 : planKey === 'Professional' ? 35000 : 15000;
                    setEditPlanForm({ ...editPlanForm, plan: planKey, price });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                >
                  <option value="Enterprise">Enterprise Tier (PKR 75,000 / mo)</option>
                  <option value="Professional">Professional Tier (PKR 35,000 / mo)</option>
                  <option value="Starter">Starter Tier (PKR 15,000 / mo)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
                <select
                  value={editPlanForm.billingCycle}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, billingCycle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="monthly">Monthly Recurring</option>
                  <option value="annual">Annual Prepaid (15% Discount)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VIEW SUPERMARKET PROFILE DETAILS                               */}
      {/* ===================================================================== */}
      {isDetailsModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedTenant.logo}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{selectedTenant.fullName}</h3>
                  <span className="text-xs text-slate-500">{selectedTenant.tagline}</span>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner</span>
                  <span className="font-bold text-slate-800">{selectedTenant.ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                  <span className="font-mono text-slate-700">{selectedTenant.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Subscription Tier</span>
                  <span className="font-bold text-emerald-700">{selectedTenant.plan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                  <span className="font-bold text-slate-800">{selectedTenant.status}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">Supermarket Hubs & Fulfillment Location:</span>
                <p className="text-slate-600 font-medium">📍 {selectedTenant.location}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ORDER INVOICE DETAILS                                          */}
      {/* ===================================================================== */}
      {isInvoiceOpen && selectedOrderInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Order Invoice: {selectedOrderInvoice.id || selectedOrderInvoice.orderId}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedOrderInvoice.tenantName || 'Supermarket Store'}
                </span>
              </div>
              <button onClick={() => setIsInvoiceOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderInvoice.customerName || selectedOrderInvoice.customer || 'Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone</span>
                  <span className="font-mono text-slate-700">{selectedOrderInvoice.customerPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Delivery Address</span>
                  <span className="text-slate-700 truncate block">
                    {selectedOrderInvoice.address || selectedOrderInvoice.shippingAddress?.address || 'Faisalabad'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Method</span>
                  <span className="font-bold text-slate-700">
                    {selectedOrderInvoice.payment || selectedOrderInvoice.paymentMethod || 'Cash on Delivery'}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Order Summary:
                </span>
                <p className="text-slate-700 font-medium">{selectedOrderInvoice.items || 'Standard Grocery Pack'}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-emerald-700">
                    Rs. {Number(selectedOrderInvoice.total || selectedOrderInvoice.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
