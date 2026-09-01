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
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const WalletRewardsView = () => {
  const { currency, addToast, applyCouponCode, customerUser } = useStore();
  const [walletBalance, setWalletBalance] = useState(customerUser?.walletBalance || 320);
  const [loyaltyPoints, setLoyaltyPoints] = useState(150);
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

  const vouchers = [
    {
      code: 'WELCOME20',
      title: 'Flat 20% Off Your Order',
      desc: 'Valid on all fresh fruits, dairy, and grocery items',
      expiry: 'Expires in 02 hrs 45 mins',
      discount: '20% OFF',
      color: 'from-rose-500 to-amber-500'
    },
    {
      code: 'VEG10',
      title: '10% Extra Off on Organic Vegetables',
      desc: 'Farm fresh picked vegetables direct to doorstep',
      expiry: 'Ends Tonight at 11:59 PM',
      discount: '10% OFF',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      code: 'FREESHIP',
      title: 'Unlimited Free 10-Minute Express Deliveries',
      desc: 'Zero delivery fee on all orders above PKR 1,500',
      expiry: 'Valid for next 4 hours',
      discount: 'FREE SHIP',
      color: 'from-green-600 to-emerald-700'
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
              FreshMart Instant Wallet
            </span>
            <span className="text-2xl">👛</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-200">Available Cash Balance</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              PKR {walletBalance}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              + Top Up Balance
            </button>
            <span className="text-[11px] text-emerald-200/90 font-medium">1-Click instant checkout</span>
          </div>
        </div>

        {/* Loyalty Reward Points Card */}
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-200 tracking-wider">
              FreshMart Reward Points
            </span>
            <span className="text-2xl">⭐</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-amber-100">Loyalty Cashback Points</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {loyaltyPoints} <span className="text-sm font-bold text-amber-200">Points</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <span className="text-[11px] text-amber-100 font-medium">Earn 5 points on every PKR 100 spent</span>
          </div>
        </div>

      </div>

      {/* 2. Complete Pakistani Payment Options Suite */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-sm text-slate-900">Supported Payment Methods</h3>
            <p className="text-xs text-slate-400">Cash on delivery, mobile wallets, online banking, and cards</p>
          </div>
          <button
            onClick={() => setIsAddPaymentOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {paymentAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{acc.icon}</span>
                  {acc.isDefault && (
                    <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900">{acc.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {acc.number || acc.handle || acc.iban || acc.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold">Verified ✓</span>
                <span className="text-slate-400">Instant</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Available Vouchers & Promo Discounts */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-sm text-slate-900">Your Exclusive Vouchers</h3>
            <p className="text-xs text-slate-400">1-Click apply promotional discount codes</p>
          </div>
          <span className="text-xs font-bold text-emerald-700">{vouchers.length} Active Vouchers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {vouchers.map((v, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 transition-all space-y-2 flex flex-col justify-between shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    {v.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{v.discount}</span>
                </div>
                <h4 className="font-black text-slate-900 leading-snug">{v.title}</h4>
                <p className="text-[11px] text-slate-500">{v.desc}</p>
                <span className="text-[10px] text-rose-500 font-bold block">{v.expiry}</span>
              </div>

              <button
                onClick={() => handleCopyCode(v.code)}
                className="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedCode === v.code ? 'Applied ✓' : 'Apply Coupon'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Top Up FreshMart Wallet</h3>
              <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Amount (PKR)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['200', '500', '1000'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 rounded-xl font-black transition-all ${
                        topUpAmount === amt
                          ? 'bg-emerald-600 text-white shadow-2xs'
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
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Connect Payment Account</h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={newPaymentType}
                  onChange={(e) => setNewPaymentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 cursor-pointer"
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
