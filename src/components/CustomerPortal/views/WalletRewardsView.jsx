import React, { useState } from 'react';
import {
  Wallet,
  Gift,
  ArrowUpRight,
  Copy,
  Check,
  Sparkles,
  CreditCard,
  Plus,
  X,
  Smartphone,
  Landmark,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const WalletRewardsView = () => {
  const { currency, addToast, applyCouponCode, customerUser, promotions } = useStore();
  const [walletBalance, setWalletBalance] = useState(customerUser?.walletBalance || 0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(customerUser?.loyaltyPoints || 0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');

  // Active saved payment methods state
  const [paymentAccounts, setPaymentAccounts] = useState([
    { id: 'pm-1', name: 'Cash on Delivery', type: 'cod', icon: '💵', desc: 'Pay with cash / QR at doorstep', isDefault: true },
    { id: 'pm-2', name: 'JazzCash Mobile Account', type: 'jazzcash', icon: '📱', number: '0300-1234567', isDefault: false },
    { id: 'pm-3', name: 'EasyPaisa Wallet', type: 'easypaisa', icon: '📱', number: '0312-9876543', isDefault: false },
    { id: 'pm-4', name: 'SadaPay Account', type: 'sadapay', icon: '💳', handle: '@aimen_fresh', isDefault: false },
    { id: 'pm-5', name: 'NayaPay Wallet', type: 'nayapay', icon: '💳', handle: '@nayapay_aimen', isDefault: false },
    { id: 'pm-6', name: 'Meezan Bank Ltd (Direct Transfer)', type: 'bank', icon: '🏦', iban: 'PK36MEZN0001234567890123', isDefault: false }
  ]);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState('jazzcash');
  const [newPaymentDetail, setNewPaymentDetail] = useState('');

  const vouchers = (promotions || [])
    .filter((p) => p.status === 'Active')
    .map((p) => ({
      code: p.code,
      title: p.title || `${p.discountAmount || p.discountPercent || 0}% OFF Order`,
      desc: p.minOrder > 0 ? `Minimum order value: Rs. ${p.minOrder}` : 'Valid on fresh store items',
      expiry: p.endDate ? `Valid until ${p.endDate}` : 'Active promotion',
      discount: p.discountType === 'percentage'
        ? `${p.discountAmount || p.discountPercent || 0}% OFF`
        : p.discountType === 'fixed'
        ? `Rs. ${p.discountAmount || p.flatAmount || 0} OFF`
        : 'FREE SHIP'
    }));

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCouponCode(code);
    addToast('Coupon Applied! 🎉', `Code ${code} activated on your cart.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    const amt = Number(topUpAmount);
    setWalletBalance((prev) => prev + amt);
    setIsTopUpOpen(false);
    addToast('Wallet Loaded! 💳', `Added PKR ${amt} to your FreshMart Wallet.`);
  };

  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    if (!newPaymentDetail.trim()) return;

    const newAcc = {
      id: `pm-${Date.now()}`,
      name: newPaymentType.toUpperCase(),
      type: newPaymentType,
      icon: newPaymentType === 'bank' ? '🏦' : newPaymentType === 'sadapay' || newPaymentType === 'nayapay' ? '💳' : '📱',
      desc: newPaymentDetail,
      isDefault: false
    };

    setPaymentAccounts([...paymentAccounts, newAcc]);
    setIsAddPaymentOpen(false);
    setNewPaymentDetail('');
    addToast('Payment Method Added! ✨', `${newPaymentType.toUpperCase()} connected successfully.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Wallet Card & Loyalty Points Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-[#063327] via-[#094c39] to-[#0f6b52] rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/25 border border-emerald-500/30 space-y-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>FreshMart Instant Wallet</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-200 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs text-emerald-200/90 font-medium">Available Cash Balance</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
              <span>PKR {walletBalance}</span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">Active</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md hover:scale-105"
            >
              + Top Up Balance
            </button>
            <span className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" />
              <span>1-Click instant grocery checkout</span>
            </span>
          </div>
        </div>

        {/* Loyalty Reward Points Card */}
        <div className="bg-gradient-to-br from-slate-900 via-[#182333] to-[#1e2f47] rounded-3xl p-6 text-white shadow-xl shadow-slate-950/25 border border-slate-700/60 space-y-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Cashback & Reward Credits</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-300 shadow-inner">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-300 font-medium">Accumulated Cashback Points</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
              <span>{loyaltyPoints}</span>
              <span className="text-sm font-bold text-amber-300">Points</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between relative z-10">
            <span className="text-[11px] text-slate-300 font-medium">Earn 5 pts per PKR 100 spent</span>
            <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-3 py-1 rounded-full font-mono">
              = PKR {Math.round(loyaltyPoints * 0.5)} Cash Discount
            </span>
          </div>
        </div>

      </div>

      {/* 2. Pakistani Payment Options Suite */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
              💳
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Supported Payment Accounts</h3>
              <p className="text-xs text-slate-400">Cash on delivery, mobile wallets, online banking, and cards</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddPaymentOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {paymentAccounts.map((acc) => {
            const isJazz = acc.type === 'jazzcash';
            const isEasy = acc.type === 'easypaisa';
            const isSada = acc.type === 'sadapay';
            const isNaya = acc.type === 'nayapay';

            return (
              <div
                key={acc.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  acc.isDefault
                    ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border-emerald-400 ring-2 ring-emerald-400/20'
                    : 'bg-white border-emerald-100/80 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{acc.icon}</span>
                      <h4 className="font-black text-slate-900 text-xs">{acc.name}</h4>
                    </div>
                    {acc.isDefault && (
                      <span className="text-[9px] font-black uppercase text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono pl-1">
                    {acc.number || acc.handle || acc.iban || acc.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                  <span className="text-slate-400 font-semibold">Instant Dispatch</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Available Vouchers & Promo Discounts */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
              🏷️
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Your Exclusive Vouchers</h3>
              <p className="text-xs text-slate-400">1-Click apply promotional discount codes to your cart</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">{vouchers.length} Active Promos</span>
        </div>

        {vouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {vouchers.map((v, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 hover:border-emerald-400 transition-all space-y-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-mono text-xs">
                      {v.code}
                    </span>
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{v.discount}</span>
                  </div>
                  <h4 className="font-black text-slate-900 leading-snug">{v.title}</h4>
                  <p className="text-[11px] text-slate-500">{v.desc}</p>
                  <span className="text-[10px] text-rose-600 font-bold block">{v.expiry}</span>
                </div>

                <button
                  onClick={() => handleCopyCode(v.code)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                >
                  {copiedCode === v.code ? 'Applied ✓' : 'Apply Promo Code'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-center">
            <p className="text-xs text-slate-700 font-semibold">No store vouchers active at the moment.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Promotional discount coupons and vouchers will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs border border-emerald-100">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h3 className="font-black text-base text-slate-900">Top Up FreshMart Wallet</h3>
              <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Top Up Amount (PKR)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['200', '500', '1000'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2.5 rounded-xl font-black transition-all cursor-pointer ${
                        topUpAmount === amt
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      PKR {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  Load PKR {topUpAmount} Instantly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs border border-emerald-100">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h3 className="font-black text-base text-slate-900">Connect Payment Account</h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={newPaymentType}
                  onChange={(e) => setNewPaymentType(e.target.value)}
                  className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="jazzcash">JazzCash Mobile Account</option>
                  <option value="easypaisa">EasyPaisa Mobile Account</option>
                  <option value="sadapay">SadaPay Account (@username)</option>
                  <option value="nayapay">NayaPay Wallet (@nayapay_id)</option>
                  <option value="bank">Bank Account / IBAN</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Number / Handle / IBAN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-1234567 or @username"
                  value={newPaymentDetail}
                  onChange={(e) => setNewPaymentDetail(e.target.value)}
                  className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  Connect Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
