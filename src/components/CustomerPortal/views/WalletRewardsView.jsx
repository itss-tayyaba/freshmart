import React, { useState } from 'react';
import { Wallet, Gift, ArrowUpRight, Copy, Check, Sparkles, CreditCard, Plus, X } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const WalletRewardsView = () => {
  const { currency, addToast, applyCouponCode } = useStore();
  const [walletBalance, setWalletBalance] = useState(2500);
  const [loyaltyPoints, setLoyaltyPoints] = useState(1240);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');

  const vouchers = [
    {
      code: 'FRESH50',
      title: 'Flat 50% Off First 3 Express Orders',
      desc: 'Valid on all grocery items above Rs. 500',
      expiry: 'Expires in 3 days',
      discount: '50% OFF',
      color: 'from-amber-500 to-orange-500'
    },
    {
      code: 'FREESHIP',
      title: 'Unlimited Free 10-Minute Deliveries',
      desc: 'Zero delivery fee with no minimum order value',
      expiry: 'VIP Member Benefit',
      discount: 'FREE SHIP',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      code: 'VEGGIE20',
      title: '20% Extra Off on Organic Vegetables',
      desc: 'Farm fresh picked vegetables direct to doorstep',
      expiry: 'Valid this weekend',
      discount: '20% OFF',
      color: 'from-green-600 to-emerald-700'
    }
  ];

  const transactions = [
    { id: 'TX-901', type: 'Order Payment', amount: -1280, date: 'Today, 10:24 AM', status: 'Completed', method: 'FreshMart Wallet' },
    { id: 'TX-844', type: 'Wallet Top-Up', amount: +2000, date: '28 Aug 2026', status: 'Completed', method: 'Visa Card •••• 4242' },
    { id: 'TX-712', type: 'Loyalty Points Cashback', amount: +150, date: '21 Aug 2026', status: 'Completed', method: 'Points Converted' },
    { id: 'TX-650', type: 'Order Payment', amount: -850, date: '18 Aug 2026', status: 'Completed', method: 'FreshMart Wallet' }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCouponCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleRedeemPoints = () => {
    if (loyaltyPoints < 500) {
      addToast('Minimum Points Required', 'You need at least 500 points to convert to wallet cash.', 'info');
      return;
    }
    const cashValue = Math.floor(loyaltyPoints / 10);
    setWalletBalance((prev) => prev + cashValue);
    setLoyaltyPoints(0);
    addToast('Points Redeemed! 🎉', `Converted ${loyaltyPoints} points into ${currency.symbol}${cashValue} wallet cash.`);
  };

  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    const amt = Number(topUpAmount);
    setWalletBalance((prev) => prev + amt);
    setIsTopUpOpen(false);
    addToast('Wallet Loaded! 💳', `Added ${currency.symbol}${amt} to your FreshMart Wallet.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. FreshMart Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">FreshMart Wallet</span>
                <span className="text-[11px] text-emerald-400 font-semibold">Instant 1-Tap Checkout</span>
              </div>
            </div>
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Money</span>
            </button>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs text-slate-400">Available Wallet Balance</span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-1">
              <span>{currency.symbol}</span>
              <span>{walletBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60 relative z-10">
            <span>Linked Account: <strong>Alex Morgan</strong></span>
            <span className="text-emerald-400 font-bold">Auto-Refund Protected 🛡️</span>
          </div>
        </div>

        {/* 2. Loyalty Rewards Points Card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-amber-100 font-bold block uppercase tracking-wider">Fresh Loyalty Points</span>
                <span className="text-[11px] text-white font-semibold">VIP Tier 2x Multiplier</span>
              </div>
            </div>
            <button
              onClick={handleRedeemPoints}
              className="px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Gift className="w-3.5 h-3.5 text-amber-700" />
              <span>Redeem for Cash</span>
            </button>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs text-amber-100">Reward Balance</span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {loyaltyPoints.toLocaleString()} <span className="text-lg font-bold text-amber-200">pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-amber-100 pt-2 border-t border-white/20 relative z-10">
            <span>Worth <strong>{currency.symbol}{Math.floor(loyaltyPoints / 10)}</strong> in cash discount</span>
            <span className="font-bold text-white">Earn +50 pts per Rs. 500</span>
          </div>
        </div>

      </div>

      {/* Available Coupon Vouchers */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">Your Active Discount Vouchers</h3>
          <p className="text-xs text-slate-500">Apply vouchers to save extra on your next 10-minute grocery order.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div
              key={v.code}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${v.color}`} />

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl font-mono tracking-wider">
                  {v.code}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {v.discount}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{v.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">{v.expiry}</span>
                <button
                  onClick={() => handleCopyCode(v.code)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === v.code ? 'Applied' : 'Apply'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Transaction Ledger */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900">Recent Wallet Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-2.5">
                <th className="pb-2.5 font-semibold">Transaction ID</th>
                <th className="pb-2.5 font-semibold">Description</th>
                <th className="pb-2.5 font-semibold">Date & Time</th>
                <th className="pb-2.5 font-semibold">Method</th>
                <th className="pb-2.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-800">{tx.id}</td>
                  <td className="py-3 font-semibold text-slate-800">{tx.type}</td>
                  <td className="py-3 text-slate-500">{tx.date}</td>
                  <td className="py-3 text-slate-600">{tx.method}</td>
                  <td className={`py-3 text-right font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.amount > 0 ? `+${currency.symbol}${tx.amount}` : `-${currency.symbol}${Math.abs(tx.amount)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Funds Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Top Up FreshMart Wallet</h3>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Amount (Rs.)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['500', '1000', '2500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 rounded-xl font-bold border transition-colors ${
                        topUpAmount === amt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rs. {amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min="100"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Source</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">Visa Debit •••• 4242</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Add Rs. {topUpAmount}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
