import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Landmark,
  Coins,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSameTenant } from '../../data/companyHierarchyData';

export const PaymentMethodCard = ({ selectedPayment, setSelectedPayment }) => {
  const { addToast, customerUser, currentTenant } = useStore();

  const isCaseValue = isSameTenant(currentTenant?.id, 'tenant-chasevalue');
  const isAlFatah = isSameTenant(currentTenant?.id, 'tenant-alfatah');
  const isChaseUp = isSameTenant(currentTenant?.id, 'tenant-chaseup');
  const isUnimaart = !isCaseValue && !isAlFatah && !isChaseUp;

  const theme = {
    primaryBg: isUnimaart
      ? 'bg-[#0284c7]'
      : isCaseValue
      ? 'bg-[#5c3417]'
      : isAlFatah
      ? 'bg-[#991b1b]'
      : isChaseUp
      ? 'bg-[#6b21a8]'
      : 'bg-[#0284c7]',
    primaryText: isUnimaart
      ? 'text-[#0284c7]'
      : isCaseValue
      ? 'text-[#5c3417]'
      : isAlFatah
      ? 'text-[#991b1b]'
      : isChaseUp
      ? 'text-[#6b21a8]'
      : 'text-[#0284c7]',
    softBg: isUnimaart
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417] border-[#ebdcc7]'
      : isAlFatah
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : isChaseUp
      ? 'bg-purple-50 text-purple-800 border-purple-200'
      : 'bg-sky-50 text-sky-800 border-sky-200',
    selectedCard: isUnimaart
      ? 'border-[#0284c7] bg-sky-50/70 shadow-md ring-1 ring-[#0284c7]'
      : isCaseValue
      ? 'border-[#5c3417] bg-[#fdfaf4] shadow-md ring-1 ring-[#5c3417]'
      : isAlFatah
      ? 'border-[#991b1b] bg-rose-50/70 shadow-md ring-1 ring-[#991b1b]'
      : isChaseUp
      ? 'border-[#6b21a8] bg-purple-50/70 shadow-md ring-1 ring-[#6b21a8]'
      : 'border-[#0284c7] bg-sky-50/70 shadow-md ring-1 ring-[#0284c7]',
    badge: isUnimaart
      ? 'bg-sky-100 text-sky-800'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417]'
      : isAlFatah
      ? 'bg-rose-100 text-rose-800'
      : isChaseUp
      ? 'bg-purple-100 text-purple-800'
      : 'bg-sky-100 text-sky-800',
    focusRing: isUnimaart
      ? 'focus:ring-[#0284c7] focus:border-[#0284c7]'
      : isCaseValue
      ? 'focus:ring-[#5c3417] focus:border-[#5c3417]'
      : isAlFatah
      ? 'focus:ring-[#991b1b] focus:border-[#991b1b]'
      : isChaseUp
      ? 'focus:ring-[#6b21a8] focus:border-[#6b21a8]'
      : 'focus:ring-[#0284c7] focus:border-[#0284c7]',
    cardGradient: isUnimaart
      ? 'from-[#033659] via-[#0284c7] to-[#012540] border-sky-400/40 text-sky-300'
      : isCaseValue
      ? 'from-[#3d2314] via-[#5c3417] to-[#25150b] border-amber-500/40 text-amber-200'
      : isAlFatah
      ? 'from-[#450a0a] via-[#7f1d1d] to-[#200404] border-rose-500/40 text-rose-200'
      : isChaseUp
      ? 'from-[#3b0764] via-[#6b21a8] to-[#1e0333] border-purple-500/40 text-purple-200'
      : 'from-[#033659] via-[#0284c7] to-[#012540] border-sky-400/40 text-sky-300'
  };

  const [activeSubWallet, setActiveSubWallet] = useState('jazzcash'); // 'jazzcash' | 'easypaisa' | 'sadapay' | 'nayapay' | 'raast'
  const [copiedField, setCopiedField] = useState(null);

  // Card form state
  const [cardForm, setCardForm] = useState({
    number: '',
    name: customerUser?.name || '',
    expires: '',
    cvv: ''
  });

  // Wallet form state
  const [walletForm, setWalletForm] = useState({
    senderPhone: customerUser?.phone || '',
    transactionId: ''
  });

  // Bank transfer form state
  const [bankForm, setBankForm] = useState({
    senderBankName: '',
    transactionRef: ''
  });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast('Copied to Clipboard! 📋', `${fieldName} copied.`);
    setTimeout(() => setCopiedField(null), 3000);
  };

  const merchantWallets = {
    jazzcash: {
      name: 'JazzCash',
      title: 'FreshMart Retail Pvt Ltd',
      number: '0320-6551696',
      color: '#e11d48',
      desc: 'Send total amount to the merchant number above and enter your Transaction ID (TID) below.'
    },
    easypaisa: {
      name: 'EasyPaisa',
      title: 'FreshMart Retail Pvt Ltd',
      number: '0312-9876543',
      color: '#10b981',
      desc: 'Transfer via EasyPaisa to the merchant account and submit your TID confirmation.'
    },
    sadapay: {
      name: 'SadaPay',
      title: 'FreshMart Retail Pvt Ltd',
      number: '0300-6551696',
      handle: '@freshmart_pay',
      color: '#06b6d4',
      desc: 'Send via SadaPay number or username @freshmart_pay and enter your transaction ref.'
    },
    nayapay: {
      name: 'NayaPay',
      title: 'FreshMart Retail Pvt Ltd',
      number: '0300-6551696',
      handle: '@nayapay_fresh',
      color: '#8b5cf6',
      desc: 'Transfer via NayaPay ID @nayapay_fresh and provide your sender account below.'
    },
    raast: {
      name: 'Raast Instant Pay',
      title: 'FreshMart Retail (Pvt) Ltd',
      number: '0320-6551696',
      badge: '0% Govt Fee',
      color: '#eab308',
      desc: 'Instant zero-fee transfer via State Bank Raast ID / Mobile number. Enter your Raast Ref ID.'
    }
  };

  const activeWalletData = merchantWallets[activeSubWallet] || merchantWallets.jazzcash;

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6`}>
      
      {/* 1. Header with Golden Shield & 256-bit Secure Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${theme.badge} flex items-center justify-center font-black text-xs shadow-xs`}>
            2
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Select Payment Gateway</h3>
            <p className="text-[11px] text-slate-400">All transactions are encrypted with 256-bit banking security</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.softBg} px-3 py-1 rounded-full border`}>
          <Lock className={`w-3.5 h-3.5 ${theme.primaryText}`} />
          <span>256-Bit SSL Secure</span>
        </div>
      </div>

      {/* 2. 4 Top Payment Method Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'card', label: 'Debit / Credit Card', sub: 'Visa / MasterCard / UnionPay', icon: CreditCard, badge: 'Instant' },
          { id: 'wallet_raast', label: 'Mobile Wallets & Raast', sub: 'JazzCash / EasyPaisa / SadaPay', icon: Smartphone, badge: 'Popular 🔥' },
          { id: 'bank', label: 'Direct Bank Transfer', sub: 'Meezan / HBL / Alfalah IBAN', icon: Landmark, badge: 'IBAN' },
          { id: 'cod', label: 'Cash on Delivery (COD)', sub: 'Pay with cash at doorstep', icon: Coins, badge: 'Easy' }
        ].map((m) => {
          const Icon = m.icon;
          const isSelected = selectedPayment === m.id;

          return (
            <div
              key={m.id}
              onClick={() => setSelectedPayment(m.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                isSelected
                  ? theme.selectedCard
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected ? `${theme.primaryBg} text-white shadow-2xs` : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  isSelected ? `${theme.primaryBg} text-white` : 'bg-slate-200 text-slate-600'
                }`}>
                  {m.badge}
                </span>
              </div>

              <div>
                <span className={`text-xs font-black block ${isSelected ? theme.primaryText : 'text-slate-800'}`}>
                  {m.label}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{m.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Dynamic Sub-View Renderers */}

      {/* ========================================================================= */}
      {/* A. CARD PAYMENT VIEW                                                      */}
      {/* ========================================================================= */}
      {selectedPayment === 'card' && (
        <div className="space-y-6 pt-2 animate-in fade-in duration-200">
          
          {/* Virtual Luxury Credit Card Container */}
          <div className={`max-w-md mx-auto bg-gradient-to-br ${theme.cardGradient} rounded-3xl p-6 text-white shadow-2xl space-y-6 relative overflow-hidden border`}>
            <div className="absolute -right-16 -top-16 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand & Visa Logo */}
            <div className="flex items-center justify-between relative z-10">
              <span className="font-black text-xs tracking-widest uppercase flex items-center gap-1.5 opacity-90">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentTenant?.displayName || currentTenant?.name || 'SUPER GROCERY'} PLATINUM</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs font-mono bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                  VISA / MASTER
                </span>
              </div>
            </div>

            {/* Gold Chip & Masked Digits */}
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 shadow-md border border-yellow-200/40 flex items-center justify-center">
                <div className="w-6 h-5 border border-amber-900/30 rounded-sm" />
              </div>
              
              <div className="text-xl font-mono tracking-widest text-white font-black drop-shadow-sm">
                {cardForm.number || '•••• •••• •••• ••••'}
              </div>
            </div>

            {/* Bottom Card Details */}
            <div className="flex items-center justify-between text-xs pt-1 relative z-10">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-300/80 block font-bold">CARDHOLDER</span>
                <span className="font-bold text-white tracking-wider uppercase font-mono">
                  {cardForm.name || 'YOUR NAME'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-emerald-300/80 block font-bold">EXPIRES</span>
                <span className="font-bold text-white font-mono">
                  {cardForm.expires || 'MM/YY'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4 text-xs max-w-xl mx-auto">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                CARD NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="4000 1234 5678 9010"
                />
                <CreditCard className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  CARDHOLDER NAME
                </label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Cardholder Name"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  EXPIRES
                </label>
                <input
                  type="text"
                  value={cardForm.expires}
                  onChange={(e) => setCardForm({ ...cardForm, expires: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="MM/YY"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="•••"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-3 rounded-2xl font-medium border border-emerald-100">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sandbox UI Simulation Mode. Raw card PAN/CVV are never sent, logged, or stored.</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                PCI-DSS Compliant (Use Hosted Fields for Live Gateways)
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* B. WALLET & RAAST INSTANT PAY VIEW                                       */}
      {/* ========================================================================= */}
      {selectedPayment === 'wallet_raast' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub-Wallet Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {Object.keys(merchantWallets).map((k) => {
              const w = merchantWallets[k];
              const isActive = activeSubWallet === k;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveSubWallet(k)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? `${theme.primaryBg} text-white shadow-sm`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{w.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {w.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Merchant Payment Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Official Merchant Account
                </span>
                <h4 className="text-sm font-black text-slate-900">{activeWalletData.title}</h4>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className={`font-mono font-black ${theme.primaryText} text-sm`}>{activeWalletData.number}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeWalletData.number, `${activeWalletData.name} Number`)}
                  className={`p-1 text-slate-400 hover:${theme.primaryText} cursor-pointer`}
                  title="Copy Number"
                >
                  {copiedField === `${activeWalletData.name} Number` ? (
                    <Check className={`w-4 h-4 ${theme.primaryText}`} />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeWalletData.desc}
            </p>

            {/* TID Input form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Sender Account Phone</label>
                <input
                  type="text"
                  value={walletForm.senderPhone}
                  onChange={(e) => setWalletForm({ ...walletForm, senderPhone: e.target.value })}
                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 ${theme.focusRing} focus:outline-none`}
                  placeholder="03001234567"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transaction ID (TID / Ref)</label>
                <input
                  type="text"
                  value={walletForm.transactionId}
                  onChange={(e) => setWalletForm({ ...walletForm, transactionId: e.target.value })}
                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold ${theme.primaryText} focus:ring-2 ${theme.focusRing} focus:outline-none`}
                  placeholder="e.g. 984210482910"
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* C. DIRECT BANK TRANSFER VIEW                                             */}
      {/* ========================================================================= */}
      {selectedPayment === 'bank' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bank Name</span>
                <span className="font-bold text-slate-900 block text-xs">Meezan Bank Limited</span>
                <span className="text-[11px] text-slate-500">Gulberg Main Branch, Lahore</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Account Title</span>
                <span className="font-bold text-slate-900 block text-xs">{currentTenant?.name || 'FreshMart'} Direct Retail</span>
                <span className="text-[11px] text-slate-500">Corporate Current Account</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">IBAN (International Account Number)</span>
                <span className="font-mono font-black text-xs sm:text-sm text-slate-900 block">PK52MEZN0001920384729102</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('PK52MEZN0001920384729102', 'IBAN')}
                className={`px-3 py-1.5 bg-slate-100 hover:${theme.softBg} text-slate-700 hover:${theme.primaryText} rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1`}
              >
                {copiedField === 'IBAN' ? <Check className={`w-3.5 h-3.5 ${theme.primaryText}`} /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Sending Bank</label>
                <input
                  type="text"
                  value={bankForm.senderBankName}
                  onChange={(e) => setBankForm({ ...bankForm, senderBankName: e.target.value })}
                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 ${theme.focusRing} focus:outline-none`}
                  placeholder="e.g. HBL / Alfalah"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bank Reference No. / Transaction Ref</label>
                <input
                  type="text"
                  value={bankForm.transactionRef}
                  onChange={(e) => setBankForm({ ...bankForm, transactionRef: e.target.value })}
                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold ${theme.primaryText} focus:ring-2 ${theme.focusRing} focus:outline-none`}
                  placeholder="e.g. REF-88912"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* D. CASH ON DELIVERY VIEW                                                 */}
      {/* ========================================================================= */}
      {selectedPayment === 'cod' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className={`${theme.softBg} rounded-2xl p-5 border space-y-3`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-bold shadow-xs`}>
                💵
              </div>
              <div>
                <h4 className={`font-black text-sm ${theme.primaryText}`}>Cash on Delivery (Doorstep Payment)</h4>
                <p className="text-xs opacity-90">Pay in cash or swipe card with our delivery rider upon grocery arrival.</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className={`flex items-center gap-1.5 font-bold ${theme.primaryText}`}>
                <CheckCircle2 className={`w-4 h-4 ${theme.primaryText}`} />
                <span>Exact cash or digital QR payment accepted at your doorstep.</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-5">
                Our rider will carry an automated digital POS terminal & receipt printer for your convenience.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
