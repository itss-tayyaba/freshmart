import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  DollarSign,
  Tag,
  Star,
  BarChart3,
  CreditCard,
  FileText,
  Users,
  Store,
  Award,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Download,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  LogOut,
  Edit,
  Trash2,
  ChevronRight,
  RefreshCw,
  Send,
  Printer,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const VendorPortal = () => {
  const { navigateTo, user, adminLogout, addToast } = useStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddDiscountOpen, setIsAddDiscountOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: 'Coca-Cola Beverages',
    category: 'beverages',
    categoryLabel: 'Beverages & Cold Drinks',
    price: '',
    wholesalePrice: '',
    stock: 50,
    unit: 'Crate (12 Pcs)',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh direct wholesale beverage stock.'
  });

  const [restockAmount, setRestockAmount] = useState(50);

  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discountPercent: 15,
    minSpend: 1000,
    validUntil: '2026-12-31'
  });

  const [payoutAmount, setPayoutAmount] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Order Packer' });

  // Load Vendor Profile & Data
  const loadVendorProfile = async () => {
    setLoading(true);
    try {
      const res = await apiService.getVendorProfile('VND-101');
      if (res && res.success && res.vendor) {
        setVendorData(res.vendor);
      }
    } catch (e) {
      console.warn('Vendor fetch fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorProfile();
  }, []);

  // Vendor Defaults Fallback
  const currentVendor = vendorData || {
    vendorId: 'VND-101',
    name: 'Tayyab (Coca-Cola Beverages)',
    ownerName: 'Tayyab',
    email: 'tayyab.cocacola@freshmart.pk',
    phone: '0300-8765432',
    category: 'Beverages, Juices & Soft Drinks',
    status: 'Approved',
    commissionRate: 10,
    balance: 54000,
    pendingBalance: 14200,
    totalEarnings: 312000,
    performanceScore: {
      fulfillmentRate: 98.6,
      onTimeDispatch: 97.5,
      rating: 4.9,
      reviewCount: 94,
      tier: 'Platinum Seller'
    },
    storeProfile: {
      logo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=200&q=80',
      banner: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1200&q=80',
      bio: 'Official authorized beverage distribution partner supplying Coca-Cola, Sprite, Fanta, Dasani and juices.',
      address: 'Plot 44, Industrial Estate, Kot Lakhpat, Lahore',
      city: 'Lahore, Pakistan',
      operatingHours: 'Mon - Sat: 8:00 AM - 9:00 PM',
      licenseNumber: 'PK-BEV-99021',
      deliveryRadius: 'All Lahore Hubs',
      bankDetails: {
        bankName: 'Habib Bank Limited (HBL)',
        accountTitle: 'Coca-Cola Beverages Vendor Hub',
        accountNumber: '123400987654321',
        iban: 'PK44HABB0012340098765432'
      }
    },
    staff: [
      { id: 'STF-1', name: 'Zeeshan Ali', email: 'zeeshan@vendor.coke.pk', role: 'Store Manager', status: 'Active' },
      { id: 'STF-2', name: 'Farhan Tariq', email: 'farhan@vendor.coke.pk', role: 'Order Packer', status: 'Active' }
    ],
    discounts: [
      { id: 'DSC-1', code: 'COKE20', discountPercent: 20, minSpend: 1000, validUntil: '2026-12-31', status: 'Active', usageCount: 48 },
      { id: 'DSC-2', code: 'SUMMERDRINKS', discountPercent: 15, minSpend: 800, validUntil: '2026-10-31', status: 'Active', usageCount: 22 }
    ],
    payouts: [
      { id: 'POUT-901', amount: 25000, bankDetails: { bankName: 'HBL', accountTitle: 'Coca-Cola Hub' }, status: 'Processed', requestedAt: '2026-08-28', processedAt: '2026-08-29' },
      { id: 'POUT-902', amount: 15000, bankDetails: { bankName: 'HBL', accountTitle: 'Coca-Cola Hub' }, status: 'Pending', requestedAt: '2026-09-04' }
    ],
    reviews: [
      { id: 'REV-1', customerName: 'Aimen Khan', rating: 5, comment: 'Always fresh and super fast dispatch. Cans were well-packed!', date: '2026-09-02', reply: 'Thank you for your valuable feedback!' },
      { id: 'REV-2', customerName: 'Bilal Ahmed', rating: 5, comment: 'Chilled delivery and perfect order fulfillment.', date: '2026-08-28', reply: 'Glad you loved our prompt service.' }
    ]
  };

  // Vendor Catalog Sample
  const [vendorProducts, setVendorProducts] = useState([
    { id: 'VPROD-1', name: 'Coca-Cola 500ml (Crate of 12)', price: 1200, wholesalePrice: 1050, stock: 45, unit: 'Crate', category: 'beverages', status: 'Active' },
    { id: 'VPROD-2', name: 'Sprite 1.5L (Crate of 6)', price: 1020, wholesalePrice: 890, stock: 8, unit: 'Crate', category: 'beverages', status: 'Low Stock' },
    { id: 'VPROD-3', name: 'Fanta Orange 1.5L (Crate of 6)', price: 1020, wholesalePrice: 890, stock: 30, unit: 'Crate', category: 'beverages', status: 'Active' },
    { id: 'VPROD-4', name: 'Dasani Bottled Water 1.5L (Crate of 6)', price: 540, wholesalePrice: 460, stock: 90, unit: 'Crate', category: 'beverages', status: 'Active' }
  ]);

  // Vendor Orders
  const [vendorOrders, setVendorOrders] = useState([
    { id: '#FM9021', customerName: 'Hafsa Tariq', items: 'Coca-Cola 500ml x 2 Crates', total: 2400, commission: 240, net: 2160, status: 'Preparing', date: 'Today, 2:15 PM' },
    { id: '#FM9020', customerName: 'Aimen Khan', items: 'Sprite 1.5L x 3 Crates', total: 3060, commission: 306, net: 2754, status: 'Ready for Dispatch', date: 'Today, 11:30 AM' },
    { id: '#FM9019', customerName: 'Zainab Ali', items: 'Dasani Water x 4 Crates', total: 2160, commission: 216, net: 1944, status: 'Shipped', date: 'Yesterday' }
  ]);

  // Handle Add Product
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    const newP = {
      ...newProduct,
      id: `VPROD-${Date.now()}`,
      price: Number(newProduct.price),
      wholesalePrice: Number(newProduct.wholesalePrice || Math.round(newProduct.price * 0.85)),
      stock: Number(newProduct.stock),
      status: 'Active'
    };
    setVendorProducts([newP, ...vendorProducts]);
    try {
      await apiService.addVendorProduct(newP);
    } catch (err) {}
    addToast('Product Added! 📦', `${newP.name} is now listed in your vendor storefront.`);
    setIsAddProductOpen(false);
  };

  // Handle Restock
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setVendorProducts(
      vendorProducts.map((p) =>
        p.id === selectedProduct.id ? { ...p, stock: p.stock + Number(restockAmount), status: 'Active' } : p
      )
    );
    try {
      await apiService.restockVendorInventory(selectedProduct.id, restockAmount);
    } catch (err) {}
    addToast('Stock Updated! ⚡', `Restocked +${restockAmount} units for ${selectedProduct.name}`);
    setIsRestockOpen(false);
  };

  // Handle Add Discount
  const handleAddDiscountSubmit = async (e) => {
    e.preventDefault();
    const newD = {
      id: `DSC-${Date.now()}`,
      code: newDiscount.code.toUpperCase().trim(),
      discountPercent: Number(newDiscount.discountPercent),
      minSpend: Number(newDiscount.minSpend),
      validUntil: newDiscount.validUntil,
      status: 'Active',
      usageCount: 0
    };
    if (vendorData) {
      setVendorData({
        ...vendorData,
        discounts: [newD, ...(vendorData.discounts || [])]
      });
    }
    try {
      await apiService.addVendorDiscount(newD);
    } catch (err) {}
    addToast('Discount Code Live! 🏷️', `Coupon ${newD.code} (${newD.discountPercent}% OFF) created.`);
    setIsAddDiscountOpen(false);
  };

  // Handle Payout Request
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0 || amt > currentVendor.balance) {
      addToast('Invalid Amount ⚠️', 'Requested amount exceeds available balance.', 'error');
      return;
    }
    const newPout = {
      id: `POUT-${Date.now()}`,
      amount: amt,
      status: 'Pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };
    if (vendorData) {
      setVendorData({
        ...vendorData,
        balance: vendorData.balance - amt,
        pendingBalance: vendorData.pendingBalance + amt,
        payouts: [newPout, ...(vendorData.payouts || [])]
      });
    }
    try {
      await apiService.requestVendorPayout({ amount: amt });
    } catch (err) {}
    addToast('Payout Requested! 💰', `Rs. ${amt.toLocaleString()} withdrawal request submitted.`);
    setIsPayoutOpen(false);
    setPayoutAmount('');
  };

  // Handle Add Staff
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    const staffObj = {
      id: `STF-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: 'Active'
    };
    if (vendorData) {
      setVendorData({
        ...vendorData,
        staff: [...(vendorData.staff || []), staffObj]
      });
    }
    try {
      await apiService.addVendorStaff(staffObj);
    } catch (err) {}
    addToast('Staff Member Added 👤', `${staffObj.name} added as ${staffObj.role}`);
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', email: '', role: 'Order Packer' });
  };

  // Handle Review Reply
  const handleSendReply = async (reviewId) => {
    const text = replyTextMap[reviewId];
    if (!text) return;
    if (vendorData) {
      setVendorData({
        ...vendorData,
        reviews: vendorData.reviews.map((r) => (r.id === reviewId ? { ...r, reply: text } : r))
      });
    }
    try {
      await apiService.replyToVendorReview(reviewId, text);
    } catch (err) {}
    addToast('Reply Sent! 💬', 'Customer feedback response recorded.');
    setReplyTextMap({ ...replyTextMap, [reviewId]: '' });
  };

  // Download PDF Invoice Generator
  const generatePDFInvoice = (order) => {
    const doc = new jsPDF();

    // Brand Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FreshMart Multi-Vendor Marketplace', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Official Vendor Tax Invoice | Order ${order.id}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);

    // Vendor Info & Customer Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor Information:', 14, 50);
    doc.text('Billed To Customer:', 110, 50);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Store: ${currentVendor.name}`, 14, 58);
    doc.text(`Category: ${currentVendor.category}`, 14, 64);
    doc.text(`Phone: ${currentVendor.phone}`, 14, 70);
    doc.text(`NTN/License: ${currentVendor.storeProfile.licenseNumber}`, 14, 76);

    doc.text(`Customer: ${order.customerName}`, 110, 58);
    doc.text(`Payment: Cash on Delivery / Verified`, 110, 64);
    doc.text(`Fulfillment: Express Cold Fleet`, 110, 70);
    doc.text(`Status: ${order.status}`, 110, 76);

    // Order Table
    doc.autoTable({
      startY: 85,
      head: [['Item Description', 'Quantity', 'Unit Rate', 'Commission (10%)', 'Total Amount']],
      body: [
        [order.items, '1 Batch', `Rs. ${order.total}`, `Rs. ${order.commission}`, `Rs. ${order.total}`]
      ],
      headStyles: { fillColor: [16, 185, 129] }, // emerald-600
      theme: 'grid'
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`Gross Order Value: Rs. ${order.total.toLocaleString()}`, 130, finalY);
    doc.text(`Marketplace Fee (10%): Rs. ${order.commission.toLocaleString()}`, 130, finalY + 7);
    doc.setTextColor(16, 185, 129);
    doc.text(`Net Vendor Payout: Rs. ${order.net.toLocaleString()}`, 130, finalY + 14);

    doc.save(`FreshMart_Vendor_Invoice_${order.id.replace('#', '')}.pdf`);
    addToast('Invoice Downloaded! 📄', `PDF invoice saved for ${order.id}`);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'pricing', label: 'Wholesale Pricing', icon: DollarSign },
    { id: 'discounts', label: 'Discounts & Promos', icon: Tag },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings & Balance', icon: CreditCard },
    { id: 'payouts', label: 'Bank Payouts', icon: ArrowUpRight },
    { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
    { id: 'staff', label: 'Store Staff', icon: Users },
    { id: 'profile', label: 'Store Profile', icon: Store },
    { id: 'scorecard', label: 'Performance Score', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0f172a] text-slate-300 p-5 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Vendor Brand Header */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 pb-5 border-b border-slate-800 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              🏪
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">FreshMart</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
                Vendor Hub
              </span>
            </div>
          </div>

          {/* Store Quick Badge */}
          <div className="mt-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white truncate max-w-[130px]">{currentVendor.name}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black rounded-full">
                {currentVendor.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>⭐ {currentVendor.performanceScore?.rating || 4.9}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{currentVendor.performanceScore?.tier || 'Platinum'}</span>
            </div>
          </div>

          {/* Navigation Items (14 Categories) */}
          <nav className="mt-4 space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sign Out */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigateTo('home')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <span>← Storefront</span>
          </button>
          <button
            onClick={adminLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Vendor Content Area */}
      <main className="flex-1 p-5 lg:p-8 overflow-y-auto max-h-screen space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{currentVendor.name}</h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold rounded-full">
                Vendor ID: {currentVendor.vendorId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-Vendor Marketplace Console • Category: <strong className="text-slate-700">{currentVendor.category}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
            <button
              onClick={() => setIsPayoutOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
                <p className="text-2xl font-black text-slate-900">Rs. {currentVendor.totalEarnings.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% this month</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
                <p className="text-2xl font-black text-emerald-600">Rs. {currentVendor.balance.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400 block">Pending Escrow: Rs. {currentVendor.pendingBalance.toLocaleString()}</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Products</span>
                <p className="text-2xl font-black text-slate-900">{vendorProducts.length} Listed</p>
                <span className="text-[10px] text-amber-600 font-bold block">1 low stock item</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Seller Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-indigo-600">{currentVendor.performanceScore.rating}</span>
                  <span className="text-amber-500 text-lg">★★★★★</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg inline-block">
                  {currentVendor.performanceScore.tier}
                </span>
              </div>
            </div>

            {/* Live Orders & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Recent Customer Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer">
                    View All Orders →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 pb-2">
                        <th className="pb-2 font-semibold">Order</th>
                        <th className="pb-2 font-semibold">Customer</th>
                        <th className="pb-2 font-semibold">Items</th>
                        <th className="pb-2 font-semibold">Net Payout</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {vendorOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-slate-800">{ord.id}</td>
                          <td className="py-3 font-medium text-slate-700">{ord.customerName}</td>
                          <td className="py-3 text-slate-500">{ord.items}</td>
                          <td className="py-3 font-black text-emerald-600">Rs. {ord.net}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions & Store Info */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900">Store Quick Hub</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Store Hours</span>
                    <p className="font-semibold text-slate-700">{currentVendor.storeProfile.operatingHours}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Fulfillment Rate</span>
                    <p className="font-semibold text-emerald-600">{currentVendor.performanceScore.fulfillmentRate}% on-time dispatch</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Platform Fee</span>
                    <p className="font-semibold text-slate-700">{currentVendor.commissionRate}% Marketplace Commission</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. VENDOR PRODUCTS */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Vendor Store Catalog</h2>
                <p className="text-xs text-slate-500">Manage, price, and publish your direct grocery products.</p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-3">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Retail Price</th>
                    <th className="pb-3 font-semibold">Wholesale Rate</th>
                    <th className="pb-3 font-semibold">Stock</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vendorProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3.5 font-bold text-slate-900">Rs. {p.price}</td>
                      <td className="py-3.5 text-emerald-700 font-bold">Rs. {p.wholesalePrice}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock < 10 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsRestockOpen(true);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. VENDOR INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Inventory & Warehouse Stock</h2>
              <p className="text-xs text-slate-500">Live inventory monitoring and automated replenishment triggers.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vendorProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.stock < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock < 10 ? '⚠️ Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Current Quantity: <strong className="text-slate-800">{p.stock} units</strong></p>
                    <p>Unit Wholesale: <strong className="text-emerald-700">Rs. {p.wholesalePrice}</strong></p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setIsRestockOpen(true);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Replenish Stock (+50)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ORDERS & FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Vendor Orders & Dispatch</h2>
              <p className="text-xs text-slate-500">Manage incoming multi-vendor parcel items and print invoices.</p>
            </div>
            <div className="space-y-3">
              {vendorOrders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{ord.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-slate-700">{ord.customerName}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{ord.status}</span>
                    </div>
                    <p className="text-slate-500">{ord.items}</p>
                    <p className="text-[11px] text-slate-400">Order Placed: {ord.date}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[10px]">Net Vendor Earnings</span>
                      <span className="font-black text-emerald-600 text-sm">Rs. {ord.net}</span>
                    </div>
                    <button
                      onClick={() => generatePDFInvoice(ord)}
                      className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Invoice PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PRICING & TIERED BULK RATES */}
        {activeTab === 'pricing' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Tiered Wholesale Rates & Profit Margins</h2>
              <p className="text-xs text-slate-500">Configure bulk order incentives and view profit margins.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <span className="font-black text-slate-800 block">Tier 1: Standard Retail (1 - 9 Units)</span>
                <p className="text-slate-500">100% standard retail pricing with 10% platform commission deduction.</p>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                  Effective Vendor Margin: 90%
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <span className="font-black text-slate-800 block">Tier 2: Bulk Wholesale (10+ Units)</span>
                <p className="text-slate-500">15% discount for bulk crates. Encourages high-volume B2B orders.</p>
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl font-bold">
                  Effective Volume Bonus: +25% higher monthly sales
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. DISCOUNTS & PROMOTIONAL CAMPAIGNS */}
        {activeTab === 'discounts' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">Vendor Store Discounts</h2>
                <p className="text-xs text-slate-500">Create exclusive voucher codes and flash promos for your products.</p>
              </div>
              <button
                onClick={() => setIsAddDiscountOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Coupon</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(currentVendor.discounts || []).map((dsc) => (
                <div key={dsc.id} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-emerald-800 text-sm tracking-wider">{dsc.code}</span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-full">{dsc.discountPercent}% OFF</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Min Spend: Rs. {dsc.minSpend} • Valid until {dsc.validUntil}</p>
                  <span className="text-[10px] text-slate-400 block">Redeemed {dsc.usageCount || 0} times by shoppers</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Store Ratings & Customer Reviews</h2>
              <p className="text-xs text-slate-500">Customer feedback and instant vendor response system.</p>
            </div>
            <div className="space-y-4">
              {(currentVendor.reviews || []).map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{rev.customerName}</span>
                    <span className="text-amber-500 font-bold">{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p className="text-slate-600 italic">"{rev.comment}"</p>
                  {rev.reply ? (
                    <div className="p-3 bg-white border border-emerald-100 rounded-xl text-[11px] text-slate-700">
                      <strong className="text-emerald-700 block mb-0.5">Your Response:</strong>
                      <span>{rev.reply}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a response to this review..."
                        value={replyTextMap[rev.id] || ''}
                        onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. SALES ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Store Sales & Traffic Analytics</h2>
              <p className="text-xs text-slate-500">Monthly conversion rate and sales performance overview.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Fulfillment Velocity</span>
                <p className="text-xl font-black text-slate-900">4.2 Hours</p>
                <span className="text-emerald-600 text-[10px] font-bold">From order to dispatch</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Repeat Customer Rate</span>
                <p className="text-xl font-black text-indigo-600">68.5%</p>
                <span className="text-slate-500 text-[10px]">High brand loyalty</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Top Bestseller</span>
                <p className="text-xl font-black text-slate-900">Coke 500ml</p>
                <span className="text-slate-500 text-[10px]">142 crates sold this month</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. EARNINGS & BALANCE */}
        {activeTab === 'earnings' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Vendor Earnings Breakdown</h2>
              <p className="text-xs text-slate-500">Net revenue statements and marketplace commission deductions.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available for Payout</span>
                <span className="px-3 py-1 bg-emerald-500 text-slate-900 font-black text-xs rounded-full">Active</span>
              </div>
              <p className="text-3xl font-black text-emerald-400">Rs. {currentVendor.balance.toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pending Escrow</span>
                  <span className="font-bold text-slate-200">Rs. {currentVendor.pendingBalance.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Lifetime Gross Revenue</span>
                  <span className="font-bold text-slate-200">Rs. {currentVendor.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. PAYOUTS & BANK TRANSFERS */}
        {activeTab === 'payouts' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">Disbursement & Payout History</h2>
                <p className="text-xs text-slate-500">Bank withdrawals and electronic transfer disbursements.</p>
              </div>
              <button
                onClick={() => setIsPayoutOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Payout</span>
              </button>
            </div>
            <div className="space-y-3">
              {(currentVendor.payouts || []).map((pout) => (
                <div key={pout.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800 block">{pout.id}</span>
                    <span className="text-slate-400 text-[11px]">Bank: {pout.bankDetails?.bankName || 'HBL'} • Requested: {pout.requestedAt ? String(pout.requestedAt).split('T')[0] : 'Recent'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm block">Rs. {pout.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pout.status === 'Processed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {pout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. INVOICES */}
        {activeTab === 'invoices' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Invoices & Billing Receipts</h2>
              <p className="text-xs text-slate-500">Official tax invoices for customer orders with 1-click PDF download.</p>
            </div>
            <div className="space-y-3">
              {vendorOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Invoice for {ord.id}</span>
                    <span className="text-slate-500 text-[11px]">Billed to: {ord.customerName} • Rs. {ord.total}</span>
                  </div>
                  <button
                    onClick={() => generatePDFInvoice(ord)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Invoice</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. STAFF DELEGATION */}
        {activeTab === 'staff' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900">Store Staff Sub-Accounts</h2>
                <p className="text-xs text-slate-500">Assign permissions to packers, managers, and inventory clerks.</p>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Staff</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(currentVendor.staff || []).map((stf) => (
                <div key={stf.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{stf.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px]">{stf.role}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-mono">{stf.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13. STORE PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in text-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">Vendor Storefront Branding & Details</h2>
              <p className="text-slate-500">Configure your storefront bio, address, and bank withdrawal account.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Store Bio</span>
                <p className="font-medium text-slate-700">{currentVendor.storeProfile.bio}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Address</span>
                <p className="font-medium text-slate-700">{currentVendor.storeProfile.address}, {currentVendor.storeProfile.city}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Withdrawal Account</span>
                <p className="font-mono font-bold text-slate-800">{currentVendor.storeProfile.bankDetails.bankName}</p>
                <p className="font-mono text-slate-500 text-[11px]">{currentVendor.storeProfile.bankDetails.iban}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Hours</span>
                <p className="font-medium text-slate-700">{currentVendor.storeProfile.operatingHours}</p>
              </div>
            </div>
          </div>
        )}

        {/* 14. PERFORMANCE SCORECARD */}
        {activeTab === 'scorecard' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">Vendor Performance & Seller Badges</h2>
              <p className="text-xs text-slate-500">Live fulfillment metrics determining marketplace ranking and platinum badge.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl space-y-1">
                <span className="text-emerald-700 font-bold text-[10px] uppercase">Fulfillment Accuracy</span>
                <p className="text-2xl font-black text-emerald-900">{currentVendor.performanceScore.fulfillmentRate}%</p>
                <span className="text-emerald-700 text-[10px] font-bold">Top 2% among all vendors</span>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-200/60 rounded-2xl space-y-1">
                <span className="text-indigo-700 font-bold text-[10px] uppercase">On-Time Dispatch Rate</span>
                <p className="text-2xl font-black text-indigo-900">{currentVendor.performanceScore.onTimeDispatch}%</p>
                <span className="text-indigo-700 text-[10px] font-bold">Average dispatch: 45 mins</span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl space-y-1">
                <span className="text-amber-700 font-bold text-[10px] uppercase">Badge Status</span>
                <p className="text-2xl font-black text-amber-900">🏆 Platinum</p>
                <span className="text-amber-800 text-[10px] font-bold">Featured in top recommendations</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Add Product to Storefront</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprite 1.5L Crate"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retail Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wholesale (Rs.)</label>
                  <input
                    type="number"
                    placeholder="1050"
                    value={newProduct.wholesalePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Stock Count</label>
                <input
                  type="number"
                  required
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                Publish Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Restock Product</h3>
              <button onClick={() => setIsRestockOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">Replenishing stock for: <strong className="text-slate-900">{selectedProduct.name}</strong></p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Add Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Request Bank Withdrawal</h3>
              <button onClick={() => setIsPayoutOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handlePayoutSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 font-bold text-[11px]">
                Available: Rs. {currentVendor.balance.toLocaleString()}
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Withdrawal Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  max={currentVendor.balance}
                  placeholder="e.g. 20000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                Submit Payout Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Discount Modal */}
      {isAddDiscountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Create Store Coupon</h3>
              <button onClick={() => setIsAddDiscountOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddDiscountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEGA20"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount (%)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="90"
                  value={newDiscount.discountPercent}
                  onChange={(e) => setNewDiscount({ ...newDiscount, discountPercent: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                Launch Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Add Staff Member</h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Khan"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="asad@vendor.coke.pk"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Permission</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Store Manager">Store Manager</option>
                  <option value="Order Packer">Order Packer</option>
                  <option value="Inventory Clerk">Inventory Clerk</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer mt-2"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
