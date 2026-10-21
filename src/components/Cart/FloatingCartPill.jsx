import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const FloatingCartPill = () => {
  const {
    cart = [],
    cartTotal = 0,
    currency = { symbol: 'Rs.' },
    isCartOpen,
    setIsCartOpen,
    currentPage,
    currentTenant
  } = useStore();

  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';
  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';

  const tenantThemeColor = currentTenant?.color || (
    isAlFatah ? '#991b1b' :
    isChaseUp ? '#6b21a8' :
    isCaseValue ? '#78350f' :
    '#0284c7'
  );

  const hiddenPages = [
    'checkout',
    'admin',
    'vendor',
    'vendor-portal',
    'delivery-portal',
    'rider-portal',
    'pickup-staff',
    'staff-portal'
  ];

  if (!Array.isArray(cart) || cart.length === 0 || isCartOpen || hiddenPages.includes(currentPage)) {
    return null;
  }

  const totalItemsCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <aside
      aria-label="Floating Basket Shortcut"
      className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <button
        onClick={() => setIsCartOpen(true)}
        style={{ backgroundColor: tenantThemeColor }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 group"
        aria-label="Open Basket Drawer"
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-200" />
          <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs">
            {totalItemsCount}
          </span>
        </div>

        <div className="text-left leading-tight pr-1">
          <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
            {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} Selected
          </div>
          <div className="text-sm font-black font-mono">
            {currency.symbol}{Number(cartTotal || 0).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-white/20 text-xs font-bold">
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </aside>
  );
};
