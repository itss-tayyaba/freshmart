import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Bell,
  User,
  LogOut,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Download,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Check,
  Tag
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// Category catalogs mapped by supplier specialty
const SUPPLIER_SPECIALTIES = {
  'Fresh Milk & Pure Dairy': {
    id: 'dairy',
    label: '🥛 ABC Dairy & Milk Supply',
    category: 'Fresh Milk & Pure Dairy',
    companyName: 'ABC Dairy Farms',
    tagline: 'Pure Cow & Buffalo Milk Supply Partner',
    products: [
      { id: 'MLK-01', name: 'Fresh Whole Cow Milk (Pasteurized)', unitPrice: 230, unit: 'Liter', minOrder: 100, leadTime: '3 Hours', status: 'Active Supply' },
      { id: 'MLK-02', name: 'Pure Farm Buffalo Milk (High Fat 6%)', unitPrice: 260, unit: 'Liter', minOrder: 80, leadTime: '4 Hours', status: 'Active Supply' },
      { id: 'MLK-03', name: 'Morning Fresh Raw Milk 50L Canister', unitPrice: 220, unit: 'Liter', minOrder: 50, leadTime: '2 Hours', status: 'Active Supply' },
      { id: 'MLK-04', name: 'Pasteurized Low-Fat Milk 1L Pack', unitPrice: 235, unit: 'Liter', minOrder: 120, leadTime: '5 Hours', status: 'Active Supply' },
      { id: 'MLK-05', name: 'Organic Full Cream Dairy Milk Batch', unitPrice: 250, unit: 'Liter', minOrder: 60, leadTime: '4 Hours', status: 'Active Supply' }
    ],
    purchaseOrders: [
      { id: 'PO-1024', item: 'Fresh Whole Cow Milk (100 Liters)', qty: '100 Liters', amount: 23000, status: 'Pending Orders', branch: 'Faisalabad Branch Hub', dueDate: 'Today, 4:00 PM', poDate: '03 Sept 2026', vehicle: 'Refrigerated Tanker LEK-8841' },
      { id: 'PO-1023', item: 'Pure Farm Buffalo Milk (120 Liters)', qty: '120 Liters', amount: 31200, status: 'To Ship', branch: 'Lahore Central Hub', dueDate: 'Tomorrow, 10:00 AM', poDate: '02 Sept 2026', vehicle: 'Chilled Milk Van LEA-9011' },
      { id: 'PO-1022', item: 'Morning Fresh Raw Milk (80 Liters)', qty: '80 Liters', amount: 17600, status: 'Deliver Today', branch: 'Gulberg Warehouse Hub', dueDate: 'Today, 6:00 PM', poDate: '02 Sept 2026', vehicle: 'Refrigerated Van LEK-8841' },
      { id: 'PO-1021', item: 'Pasteurized Low-Fat Milk (150 Liters)', qty: '150 Liters', amount: 35250, status: 'Complete Orders', branch: 'DHA Phase 5 Hub', dueDate: '01 Sept 2026', poDate: '01 Sept 2026', vehicle: 'Milk Van LER-4421' },
      { id: 'PO-1020', item: 'Organic Full Cream Milk (100 Liters)', qty: '100 Liters', amount: 25000, status: 'Complete Orders', branch: 'Lahore Central Hub', dueDate: '29 Aug 2026', poDate: '28 Aug 2026', vehicle: 'Tanker LEK-3310' }
    ],
    deliveries: [
      { id: 'DISP-801', poId: 'PO-1022', destination: 'Gulberg Warehouse Hub', driver: 'Kashif Mehmood', phone: '0321-9988771', vehicle: 'Refrigerated Van (LEK-8841)', status: 'Out for Delivery', eta: 'Today, 5:30 PM', challanNo: 'CH-9921', item: '80L Raw Buffalo Milk' },
      { id: 'DISP-800', poId: 'PO-1021', destination: 'DHA Phase 5 Hub', driver: 'Nadeem Akhtar', phone: '0300-4455667', vehicle: 'Chilled Van (LEA-9011)', status: 'Delivered & Inspected', eta: '01 Sept, 2:00 PM', challanNo: 'CH-9920', item: '150L Low-Fat Milk' }
    ]
  },
  'Fresh Fruits & Farm Vegetables': {
    id: 'produce',
    label: '🥦 Green Valley Farm Produce',
    category: 'Fresh Fruits & Farm Vegetables',
    companyName: 'Green Valley Farms',
    tagline: 'Organic Farm Fresh Produce Partner',
    products: [
      { id: 'VEG-01', name: 'Farm Fresh Red Tomatoes (Crate)', unitPrice: 120, unit: 'Kg', minOrder: 200, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'VEG-02', name: 'Organic Red Potatoes (Sack 50kg)', unitPrice: 75, unit: 'Kg', minOrder: 500, leadTime: '12 Hours', status: 'Active Supply' },
      { id: 'VEG-03', name: 'Fresh Farm Onions (Sack 50kg)', unitPrice: 110, unit: 'Kg', minOrder: 300, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'VEG-04', name: 'Crisp Green Spinach (Crate 20kg)', unitPrice: 60, unit: 'Kg', minOrder: 100, leadTime: '4 Hours', status: 'Active Supply' }
    ],
    purchaseOrders: [
      { id: 'PO-2011', item: 'Farm Fresh Tomatoes (300 Kg)', qty: '300 Kg', amount: 36000, status: 'Pending Orders', branch: 'Faisalabad Branch Hub', dueDate: 'Today, 5:00 PM', poDate: '03 Sept 2026', vehicle: 'Produce Truck LES-4411' },
      { id: 'PO-2010', item: 'Organic Red Potatoes (500 Kg)', qty: '500 Kg', amount: 37500, status: 'To Ship', branch: 'Lahore Central Hub', dueDate: 'Tomorrow, 9:00 AM', poDate: '02 Sept 2026', vehicle: 'Farm Truck LEB-7721' },
      { id: 'PO-2009', item: 'Crisp Green Spinach (150 Kg)', qty: '150 Kg', amount: 9000, status: 'Deliver Today', branch: 'Gulberg Warehouse Hub', dueDate: 'Today, 6:00 PM', poDate: '02 Sept 2026', vehicle: 'Van LEK-9912' }
    ],
    deliveries: [
      { id: 'DISP-702', poId: 'PO-2009', destination: 'Gulberg Warehouse Hub', driver: 'Tariq Javed', phone: '0322-8877112', vehicle: 'Produce Van (LEK-9912)', status: 'Out for Delivery', eta: 'Today, 5:45 PM', challanNo: 'CH-8831', item: '150 Kg Spinach' }
    ]
  },
  'Poultry & Farm Fresh Eggs': {
    id: 'poultry',
    label: '🥚 Punjab Poultry & Farm Eggs',
    category: 'Poultry & Farm Fresh Eggs',
    companyName: 'Punjab Poultry Farms',
    tagline: 'Fresh Grade-A Table Eggs & Broiler Supply',
    products: [
      { id: 'EGG-01', name: 'Farm Fresh White Table Eggs (Tray of 30)', unitPrice: 340, unit: 'Tray', minOrder: 50, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'EGG-02', name: 'Organic Desi Brown Eggs (Tray of 30)', unitPrice: 480, unit: 'Tray', minOrder: 30, leadTime: '12 Hours', status: 'Active Supply' },
      { id: 'EGG-03', name: 'Free-Range Golden Yolk Eggs (Pack of 12)', unitPrice: 220, unit: 'Pack', minOrder: 60, leadTime: '8 Hours', status: 'Active Supply' }
    ],
    purchaseOrders: [
      { id: 'PO-3015', item: 'White Table Eggs (100 Trays)', qty: '100 Trays', amount: 34000, status: 'Pending Orders', branch: 'Lahore Central Hub', dueDate: 'Today, 3:30 PM', poDate: '03 Sept 2026', vehicle: 'Poultry Van LEH-1192' },
      { id: 'PO-3014', item: 'Organic Desi Brown Eggs (50 Trays)', qty: '50 Trays', amount: 24000, status: 'Deliver Today', branch: 'Gulberg Warehouse Hub', dueDate: 'Today, 6:00 PM', poDate: '02 Sept 2026', vehicle: 'Poultry Van LEH-1192' }
    ],
    deliveries: [
      { id: 'DISP-601', poId: 'PO-3014', destination: 'Gulberg Warehouse Hub', driver: 'Shahbaz Ali', phone: '0313-7766554', vehicle: 'Insulated Van (LEH-1192)', status: 'Out for Delivery', eta: 'Today, 5:15 PM', challanNo: 'CH-7740', item: '50 Trays Desi Eggs' }
    ]
  },
  'Beverages, Juices & Soft Drinks': {
    id: 'beverages',
    label: '🥤 Coca-Cola Beverages Pakistan',
    category: 'Beverages, Juices & Soft Drinks',
    companyName: 'Coca-Cola Beverages Pakistan Ltd.',
    tagline: 'Official Bottler of Coca-Cola, Sprite, Fanta, Fuze Tea, Powerade & Dasani',
    products: [
      { id: 'COKE-01', name: 'Coca-Cola Original (250ml Can - Crate of 24)', unitPrice: 2160, unit: 'Crate', minOrder: 20, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'COKE-02', name: 'Coca-Cola Original (500ml Bottle - Crate of 12)', unitPrice: 1200, unit: 'Crate', minOrder: 25, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'COKE-03', name: 'Coca-Cola Original (1.5L Bottle - Crate of 6)', unitPrice: 1020, unit: 'Crate', minOrder: 30, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-04', name: 'Coca-Cola Original (2.25L Bottle - Crate of 6)', unitPrice: 1440, unit: 'Crate', minOrder: 20, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-05', name: 'Coca-Cola Zero Sugar (500ml Bottle - Crate of 12)', unitPrice: 1320, unit: 'Crate', minOrder: 15, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-06', name: 'Coca-Cola Zero Sugar (1.5L Bottle - Crate of 6)', unitPrice: 1140, unit: 'Crate', minOrder: 20, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-07', name: 'Sprite (500ml Bottle - Crate of 12)', unitPrice: 1200, unit: 'Crate', minOrder: 25, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'COKE-08', name: 'Sprite (1.5L Bottle - Crate of 6)', unitPrice: 1020, unit: 'Crate', minOrder: 30, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-09', name: 'Fanta Orange (500ml Bottle - Crate of 12)', unitPrice: 1200, unit: 'Crate', minOrder: 20, leadTime: '6 Hours', status: 'Active Supply' },
      { id: 'COKE-10', name: 'Fanta Orange (1.5L Bottle - Crate of 6)', unitPrice: 1020, unit: 'Crate', minOrder: 25, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-11', name: 'Fanta (2.25L Bottle - Crate of 6)', unitPrice: 1440, unit: 'Crate', minOrder: 15, leadTime: '8 Hours', status: 'Active Supply' },
      { id: 'COKE-12', name: 'Fuze Tea Iced Tea (500ml Bottle - Crate of 12)', unitPrice: 1800, unit: 'Crate', minOrder: 10, leadTime: '12 Hours', status: 'Active Supply' },
      { id: 'COKE-13', name: 'Powerade Sports Drink (500ml Bottle - Crate of 12)', unitPrice: 2400, unit: 'Crate', minOrder: 10, leadTime: '12 Hours', status: 'Active Supply' },
      { id: 'COKE-14', name: 'Dasani Bottled Water (500ml Bottle - Crate of 12)', unitPrice: 480, unit: 'Crate', minOrder: 40, leadTime: '4 Hours', status: 'Active Supply' },
      { id: 'COKE-15', name: 'Dasani Bottled Water (1.5L Bottle - Crate of 6)', unitPrice: 540, unit: 'Crate', minOrder: 50, leadTime: '4 Hours', status: 'Active Supply' }
    ],
    purchaseOrders: [
      { id: 'PO-4018', item: 'Coca-Cola 1.5L (60 Crates) & 250ml Cans (30 Crates)', qty: '90 Crates', amount: 126000, status: 'Pending Orders', branch: 'Lahore Central Main Hub', dueDate: 'Today, 2:00 PM', poDate: '03 Sept 2026', vehicle: 'Beverage Truck LEC-5542' },
      { id: 'PO-4017', item: 'Sprite 1.5L (40 Crates) & Fanta 1.5L (30 Crates)', qty: '70 Crates', amount: 71400, status: 'To Ship', branch: 'Faisalabad Branch Hub', dueDate: 'Tomorrow, 11:00 AM', poDate: '02 Sept 2026', vehicle: 'Bottler Truck LEA-8821' },
      { id: 'PO-4016', item: 'Dasani Bottled Water 1.5L (100 Crates) & 500ml (50 Crates)', qty: '150 Crates', amount: 78000, status: 'Deliver Today', branch: 'Gulberg Warehouse Hub', dueDate: 'Today, 5:30 PM', poDate: '02 Sept 2026', vehicle: 'Delivery Van LEK-2219' },
      { id: 'PO-4015', item: 'Fuze Tea & Powerade Sports (30 Crates)', qty: '30 Crates', amount: 63000, status: 'Complete Orders', branch: 'DHA Phase 5 Hub', dueDate: '01 Sept 2026', poDate: '01 Sept 2026', vehicle: 'Beverage Van LEK-1120' }
    ],
    deliveries: [
      { id: 'DISP-501', poId: 'PO-4016', destination: 'Gulberg Warehouse Hub', driver: 'Waqas Munir', phone: '0333-5566778', vehicle: 'Beverage Truck (LEK-2219)', status: 'Out for Delivery', eta: 'Today, 5:00 PM', challanNo: 'CH-6612', item: '150 Crates Dasani Water' }
    ]
  },
  'Bakery, Flour & Yeast': {
    id: 'bakery',
    label: '🍞 Dawn Bakery & Bread Supplies',
    category: 'Bakery, Flour & Yeast',
    companyName: 'Dawn Bread & Bakery Supplies',
    tagline: 'Fresh Sliced Breads, Buns & Rusks Wholesale Partner',
    products: [
      { id: 'BAK-01', name: 'Dawn Plain Large Bread 800g (Crate of 20)', unitPrice: 3200, unit: 'Crate', minOrder: 15, leadTime: '2 Hours', status: 'Active Supply' },
      { id: 'BAK-02', name: 'Dawn Milky Sweet Bread 400g (Crate of 25)', unitPrice: 2750, unit: 'Crate', minOrder: 10, leadTime: '2 Hours', status: 'Active Supply' },
      { id: 'BAK-03', name: 'Dawn Burger Buns 4-Pack (Box of 30)', unitPrice: 2400, unit: 'Box', minOrder: 20, leadTime: '3 Hours', status: 'Active Supply' }
    ],
    purchaseOrders: [
      { id: 'PO-5012', item: 'Plain Large Bread 800g (40 Crates)', qty: '40 Crates', amount: 128000, status: 'Pending Orders', branch: 'Lahore Central Main Hub', dueDate: 'Tomorrow, 5:00 AM', poDate: '03 Sept 2026', vehicle: 'Bakery Van LEK-1120' }
    ],
    deliveries: [
      { id: 'DISP-401', poId: 'PO-5012', destination: 'Lahore Central Hub', driver: 'Rashid Mahmood', phone: '0301-2233445', vehicle: 'Bakery Van (LEK-1120)', status: 'Scheduled', eta: 'Tomorrow, 5:00 AM', challanNo: 'CH-5510', item: '40 Crates Dawn Bread' }
    ]
  }
};

export const SupplierPortal = () => {
  const {
    user,
    adminLogout,
    navigateTo,
    currency,
    addToast,
    suppliers
  } = useStore();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'orders' | 'deliveries' | 'payments' | 'invoices' | 'performance' | 'settings'
  const [orderFilter, setOrderFilter] = useState('All');
  const [selectedPO, setSelectedPO] = useState(null);

  // Determine current supplier specialty category
  const [selectedSpecialtyKey, setSelectedSpecialtyKey] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_active_supplier_specialty');
      if (saved && SUPPLIER_SPECIALTIES[saved]) return saved;
    } catch (e) {}

    // If logged-in user matches a registered supplier's category
    if (user?.category && SUPPLIER_SPECIALTIES[user.category]) {
      return user.category;
    }
    const found = (suppliers || []).find((s) => s.email === user?.email || s.name === user?.name || s.username === user?.name);
    if (found && found.category && SUPPLIER_SPECIALTIES[found.category]) {
      return found.category;
    }
    if (user?.name?.toLowerCase().includes('coca') || user?.name?.toLowerCase().includes('coke') || user?.name?.toLowerCase().includes('beverage')) {
      return 'Beverages, Juices & Soft Drinks';
    }
    return 'Beverages, Juices & Soft Drinks';
  });

  const handleSpecialtyChange = (newKey) => {
    setSelectedSpecialtyKey(newKey);
    try {
      localStorage.setItem('freshmart_active_supplier_specialty', newKey);
    } catch (e) {}
  };

  const activeSpecialty = SUPPLIER_SPECIALTIES[selectedSpecialtyKey] || SUPPLIER_SPECIALTIES['Beverages, Juices & Soft Drinks'];
  const supplierName = user?.name && user.name !== 'Store Admin' ? user.name : activeSpecialty.companyName;

  // Local state initialized with category-specific dataset
  const [purchaseOrders, setPurchaseOrders] = useState(activeSpecialty.purchaseOrders);
  const [suppliedProducts, setSuppliedProducts] = useState(activeSpecialty.products);
  const [deliveries, setDeliveries] = useState(activeSpecialty.deliveries);

  // Sync state when specialty is switched
  useEffect(() => {
    const spec = SUPPLIER_SPECIALTIES[selectedSpecialtyKey] || SUPPLIER_SPECIALTIES['Beverages, Juices & Soft Drinks'];
    setPurchaseOrders(spec.purchaseOrders);
    setSuppliedProducts(spec.products);
    setDeliveries(spec.deliveries);
  }, [selectedSpecialtyKey]);

  // Financial summary
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2026-904',
      poRef: 'PO-1021',
      date: '01 Sept 2026',
      dueDate: '15 Sept 2026',
      subtotal: 35250,
      tax: 0,
      total: 35250,
      status: 'Paid',
      paymentMethod: 'Meezan Direct Transfer'
    },
    {
      id: 'INV-2026-903',
      poRef: 'PO-1020',
      date: '28 Aug 2026',
      dueDate: '10 Sept 2026',
      subtotal: 25000,
      tax: 0,
      total: 25000,
      status: 'Paid',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'INV-2026-905',
      poRef: 'PO-1022',
      date: '02 Sept 2026',
      dueDate: '16 Sept 2026',
      subtotal: 17600,
      tax: 0,
      total: 17600,
      status: 'Pending Settlement',
      paymentMethod: 'Net 15 Days'
    }
  ]);

  const handleUpdatePOStatus = (poId, newStatus) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          return {
            ...po,
            status: newStatus
          };
        }
        return po;
      })
    );
    addToast('PO Status Updated 🧾', `Purchase order ${poId} updated to "${newStatus}".`);
    setSelectedPO(null);
  };

  // Nav Items matching user's exact ASCII diagram
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, count: suppliedProducts.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: purchaseOrders.filter((p) => p.status === 'Pending Orders').length },
    { id: 'deliveries', label: 'Deliveries', icon: Truck, count: deliveries.length },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Counts for top cards
  const pendingCount = purchaseOrders.filter((p) => p.status === 'Pending Orders').length;
  const toShipCount = purchaseOrders.filter((p) => p.status === 'To Ship').length;
  const deliverTodayCount = purchaseOrders.filter((p) => p.status === 'Deliver Today').length;
  const completeCount = purchaseOrders.filter((p) => p.status === 'Complete Orders').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 1. Left Dark Emerald Sidebar (Strict FreshMart Theme) */}
      <aside className="w-full lg:w-64 bg-[#07241d] text-slate-300 p-5 flex flex-col justify-between shrink-0 border-r border-[#0d3b30]">
        <div>
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 pb-5 border-b border-[#0d3b30]">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-900/40">
              🛒
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-none">FreshMart</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                Supplier Portal
              </span>
            </div>
          </div>

          {/* Supplier Specialty Badge in Sidebar */}
          <div className="mt-4 p-2.5 bg-[#0b3329] border border-[#13493b] rounded-2xl">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Vendor Specialty</span>
            <span className="text-xs font-bold text-white block truncate">{activeSpecialty.category}</span>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/50'
                      : 'text-slate-300 hover:bg-[#0b3329] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-emerald-950' : 'bg-[#0b3329] text-emerald-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Storefront Link & Sign Out */}
        <div className="pt-6 border-t border-[#0d3b30] space-y-2 mt-6">
          <button
            onClick={() => navigateTo('home')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Back to Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={adminLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">FreshMart Supplier</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-emerald-700 capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            
            {/* Vendor Domain Selector (Allows testing & viewing category-specific logic) */}
            <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                value={selectedSpecialtyKey}
                onChange={(e) => handleSpecialtyChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
                title="Switch supplier domain to view category-specific supply items"
              >
                {Object.keys(SUPPLIER_SPECIALTIES).map((k) => (
                  <option key={k} value={k}>
                    {SUPPLIER_SPECIALTIES[k].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
            </button>

            {/* Vendor Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {supplierName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{supplierName}</span>
                <span className="text-[10px] text-emerald-600 block font-bold">{activeSpecialty.category}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ================================================================= */}
          {/* 1. DASHBOARD VIEW (ACCORDING TO USER'S EXACT ASCII & EMERALD THEME) */}
          {/* ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Emerald Greeting Header */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#07241d] text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <span>Good Morning, {supplierName}</span>
                    <span>👋</span>
                  </h1>
                  <p className="text-xs text-emerald-100 mt-1">
                    Specialized Vendor Portal: Managing <strong className="text-white underline">{activeSpecialty.category}</strong> replenishment for FreshMart.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-bold self-start sm:self-auto">
                  <Building className="w-4 h-4 text-emerald-300" />
                  <span>{activeSpecialty.tagline}</span>
                </div>
              </div>

              {/* 4 Key Status Cards Matching ASCII: [ Pending ] [ To Ship ] [ Deliver Today ] [ Complete ] */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Pending Orders */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                      🟡
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      New Demand
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">{pendingCount}</div>
                  <div className="text-xs font-bold text-slate-700">Pending Orders</div>
                  <p className="text-[10px] text-slate-400">Awaiting vendor confirmation</p>
                </div>

                {/* 2. To Ship */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                      📦
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Packing
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">{toShipCount}</div>
                  <div className="text-xs font-bold text-slate-700">To Ship</div>
                  <p className="text-[10px] text-slate-400">Ready for dispatch loading</p>
                </div>

                {/* 3. Deliver Today */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                      🚚
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      En Route
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">{deliverTodayCount}</div>
                  <div className="text-xs font-bold text-slate-700">Deliver Today</div>
                  <p className="text-[10px] text-slate-400">Trucks arriving at hub</p>
                </div>

                {/* 4. Complete Orders */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm">
                      🟢
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      Fulfilled
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">{completeCount}</div>
                  <div className="text-xs font-bold text-slate-700">Complete Orders</div>
                  <p className="text-[10px] text-slate-400">Received & Inspected</p>
                </div>

              </div>

              {/* 2-Column Grid: Recent Purchase Orders + Upcoming Deliveries */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Purchase Orders (Filtered strictly to this supplier's category) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Recent Purchase Orders</h2>
                      <p className="text-xs text-slate-400">
                        Orders for <span className="font-bold text-emerald-700">{activeSpecialty.category}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All POs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-2">
                          <th className="pb-3 font-semibold">PO Number</th>
                          <th className="pb-3 font-semibold">Supplied Item</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {purchaseOrders.slice(0, 4).map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 font-bold font-mono text-emerald-700">{po.id}</td>
                            <td className="py-3.5 text-slate-800">
                              <span className="font-bold block text-slate-900">{po.item}</span>
                              <span className="text-[10px] text-slate-400">{po.branch}</span>
                            </td>
                            <td className="py-3.5 font-mono font-bold text-slate-900">
                              {currency.symbol}{po.amount.toLocaleString()}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                  po.status === 'Pending Orders'
                                    ? 'bg-amber-100 text-amber-800'
                                    : po.status === 'To Ship'
                                    ? 'bg-blue-100 text-blue-800'
                                    : po.status === 'Deliver Today'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setSelectedPO(po)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming Deliveries */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-black text-slate-900">Upcoming Deliveries</h2>
                        <p className="text-xs text-slate-400">Scheduled hub arrivals</p>
                      </div>
                      <span className="text-xl">📅</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {deliveries.map((del) => (
                        <div key={del.id} className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-emerald-900">{del.destination}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                              {del.eta}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 font-medium">{del.item} • {del.vehicle}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Dispatch Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* 2. SUPPLIED PRODUCTS VIEW (CATEGORY-SPECIFIC CATALOG)              */}
          {/* ================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Supplied Products Catalog</h2>
                  <p className="text-xs text-slate-400">
                    Category: <strong className="text-emerald-700">{activeSpecialty.category}</strong> supplied by {supplierName}
                  </p>
                </div>
                <button
                  onClick={() => addToast('Product Quotation Submitted 📋', `New ${activeSpecialty.category} item quotation sent to FreshMart Procurement.`)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Submit New Supply Quotation</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">Item SKU</th>
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">Category Domain</th>
                      <th className="pb-3 font-semibold">Supply Unit Price</th>
                      <th className="pb-3 font-semibold">Min Batch Supply</th>
                      <th className="pb-3 font-semibold">Dispatch Lead Time</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {suppliedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-mono text-slate-400 font-bold">{p.id}</td>
                        <td className="py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3.5 text-emerald-700 font-semibold">{activeSpecialty.category}</td>
                        <td className="py-3.5 font-mono font-bold text-emerald-700">
                          {currency.symbol}{p.unitPrice} / {p.unit}
                        </td>
                        <td className="py-3.5 text-slate-600">{p.minOrder} {p.unit}s</td>
                        <td className="py-3.5 text-slate-600">{p.leadTime}</td>
                        <td className="py-3.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. PURCHASE ORDERS VIEW                                           */}
          {/* ================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Purchase Orders (POs)</h2>
                  <p className="text-xs text-slate-400">
                    Incoming replenishment orders for <strong className="text-emerald-700">{activeSpecialty.category}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['All', 'Pending Orders', 'To Ship', 'Deliver Today', 'Complete Orders'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        orderFilter === filter
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">PO #</th>
                      <th className="pb-3 font-semibold">Item & Batch Quantity</th>
                      <th className="pb-3 font-semibold">Destination Hub</th>
                      <th className="pb-3 font-semibold">Due Schedule</th>
                      <th className="pb-3 font-semibold">Order Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {purchaseOrders
                      .filter((po) => orderFilter === 'All' || po.status === orderFilter)
                      .map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 font-bold font-mono text-emerald-700">{po.id}</td>
                          <td className="py-4">
                            <span className="font-bold text-slate-900 block">{po.item}</span>
                            <span className="text-[11px] text-slate-400">Qty: {po.qty}</span>
                          </td>
                          <td className="py-4 text-slate-700">{po.branch}</td>
                          <td className="py-4 text-slate-600 font-mono text-[11px]">{po.dueDate}</td>
                          <td className="py-4 font-mono font-bold text-slate-900">
                            {currency.symbol}{po.amount.toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                po.status === 'Pending Orders'
                                  ? 'bg-amber-100 text-amber-800'
                                  : po.status === 'To Ship'
                                  ? 'bg-blue-100 text-blue-800'
                                  : po.status === 'Deliver Today'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setSelectedPO(po)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. DELIVERIES VIEW                                                */}
          {/* ================================================================= */}
          {activeTab === 'deliveries' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Warehouse Deliveries & Challans</h2>
                  <p className="text-xs text-slate-400">Track transport vehicles, drivers, and delivery delivery challans</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveries.map((del) => (
                  <div key={del.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                          🚚
                        </span>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">{del.id}</h3>
                          <span className="text-[11px] text-emerald-700 font-mono font-bold">Challan: {del.challanNo}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {del.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Supplied Item:</span>
                        <span className="font-bold text-emerald-800">{del.item}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Destination:</span>
                        <span className="font-bold text-slate-800">{del.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vehicle:</span>
                        <span className="font-mono text-slate-800">{del.vehicle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Driver & Phone:</span>
                        <span className="font-bold text-slate-800">{del.driver} ({del.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected Arrival:</span>
                        <span className="font-bold text-emerald-700">{del.eta}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToast('Challan Downloaded 📄', `Delivery challan for ${del.id} generated.`)}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Delivery Challan PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. PAYMENTS VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Total Gross Settlements</span>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {currency.symbol}385,000
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block">100% Cleared to Bank</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Pending Clearance</span>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {currency.symbol}43,500
                  </div>
                  <span className="text-[10px] text-slate-400 block">Due next cycle (15 Sept 2026)</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Primary Linked Bank</span>
                  <div className="text-sm font-black text-slate-900">Meezan Bank Ltd.</div>
                  <div className="text-[11px] font-mono text-slate-500">PK88MEZN000192837482910</div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. INVOICES VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Vendor Invoices & Tax Bills</h2>
                  <p className="text-xs text-slate-400">Generated tax invoices for completed supply purchase orders</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">Invoice #</th>
                      <th className="pb-3 font-semibold">PO Reference</th>
                      <th className="pb-3 font-semibold">Invoice Date</th>
                      <th className="pb-3 font-semibold">Payment Terms</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-3.5 font-mono text-emerald-700 font-bold">{inv.poRef}</td>
                        <td className="py-3.5 text-slate-500">{inv.date}</td>
                        <td className="py-3.5 text-slate-600">{inv.paymentMethod}</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          {currency.symbol}{inv.total.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => addToast('Invoice Downloaded 📄', `Tax invoice ${inv.id} saved.`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. PERFORMANCE VIEW                                               */}
          {/* ================================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <h2 className="text-xl font-black text-slate-900">Vendor Quality & SLA Scorecard</h2>
                <p className="text-xs text-slate-400">Quarterly fulfillment score rated by FreshMart Quality Control</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-emerald-600 font-mono">98.4%</span>
                  <div className="text-xs font-bold text-slate-900">Order Fulfillment Rate</div>
                  <p className="text-[10px] text-slate-400">Top Tier Supplier rating</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-emerald-700 font-mono">97.8%</span>
                  <div className="text-xs font-bold text-slate-900">On-Time Arrival</div>
                  <p className="text-[10px] text-slate-400">Delivered within scheduled slot</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-amber-500 font-mono">4.9 ⭐</span>
                  <div className="text-xs font-bold text-slate-900">Freshness & Quality Score</div>
                  <p className="text-[10px] text-slate-400">0.2% return / rejection rate</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. SETTINGS VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5 animate-in fade-in duration-200 max-w-2xl">
              <h2 className="text-xl font-black text-slate-900">Vendor Profile & Business Details</h2>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Farm Name</label>
                  <input
                    type="text"
                    defaultValue={supplierName}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category Specialty</label>
                  <input
                    type="text"
                    readOnly
                    value={activeSpecialty.category}
                    className="w-full bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 font-bold text-emerald-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business Contact Phone</label>
                    <input
                      type="text"
                      defaultValue="0321-5551234"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">NTN / Tax Registration Number</label>
                    <input
                      type="text"
                      defaultValue="7829104-2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Warehouse Dispatch Address</label>
                  <input
                    type="text"
                    defaultValue="Plot 44, Industrial Estate, Multan Road, Lahore"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addToast('Settings Saved 💾', 'Supplier profile updated successfully.')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Business Details
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* PO Status Update Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Manage PO: {selectedPO.id}</h3>
                <p className="text-xs text-slate-400">{selectedPO.item}</p>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-bold text-slate-800">{selectedPO.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Value:</span>
                <span className="font-mono font-bold text-emerald-700">{currency.symbol}{selectedPO.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-slate-800">{selectedPO.status}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">Change PO Status:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Pending Orders')}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs border border-amber-200 cursor-pointer"
                >
                  🟡 Pending
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'To Ship')}
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl font-bold text-xs border border-blue-200 cursor-pointer"
                >
                  📦 To Ship
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Deliver Today')}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs border border-emerald-200 cursor-pointer"
                >
                  🚚 Deliver Today
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Complete Orders')}
                  className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl font-bold text-xs border border-teal-200 cursor-pointer"
                >
                  🟢 Completed
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
