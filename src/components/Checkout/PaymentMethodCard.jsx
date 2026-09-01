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

export const PaymentMethodCard = ({ selectedPayment, setSelectedPayment }) => {
  const { addToast, customerUser } = useStore();

  const [activeSubWallet, setActiveSubWallet] = useState('jazzcash'); // 'jazzcash' | 'easypaisa' | 'sadapay' | 'nayapay' | 'raast'
  const [copiedField, setCopiedField] = useState(null);

  // Card form state
  const [cardForm, setCardForm] = useState({
    number: '4000 1234 5678 9010',
    name: customerUser?.name || 'Tayyaba Batool',
    expires: '08/28',
    cvv: '842'
  });

  // Wallet form state
  const [walletForm, setWalletForm] = useState({
    senderPhone: customerUser?.phone || '03001234567',
    transactionId: '984210482'
  });

  // Bank transfer form state
  const [bankForm, setBankForm] = useState({
    senderBankName: 'HBL – Tayyaba',
    transactionRef: 'REF-482910'
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
      title: 'FreshMart Retail Pvt Ltd',
      number: '0320-6551696',
      color: '#eab308',
      desc: 'Instant zero-fee transfer via Raast ID / Mobile number. Enter your Raast Ref ID.'
    }
  };

  const activeWalletData = merchantWallets[activeSubWallet] || merchantWallets.jazzcash;

  return (
    <div className="bg-[#121212] text-slate-100 rounded-3xl p-5 sm:p-7 border border-[#262626] shadow-2xl space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header with Golden Shield & 256-bit Secure Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
            🛡️
          </div>
          <span className="text-xs font-black tracking-widest text-[#e6e6e6] uppercase">
            PAYMENT METHOD
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit Secure</span>
        </div>
      </div>

      {/* 2. 4 Top Payment Method Selection Cards matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Method 1: Card */}
        <div
          onClick={() => setSelectedPayment('card')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
            selectedPayment === 'card'
              ? 'border-amber-400/80 bg-[#1c1a14] shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-amber-400/50'
              : 'border-[#262626] bg-[#171717] hover:bg-[#1f1f1f] text-slate-400'
          }`}
        >
          <CreditCard className={`w-5 h-5 ${selectedPayment === 'card' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-xs font-black block ${selectedPayment === 'card' ? 'text-white' : 'text-slate-200'}`}>
            Card
          </span>
          <span className="text-[10px] text-slate-500">Visa / Master</span>
        </div>

        {/* Method 2: Wallet / Raast */}
        <div
          onClick={() => setSelectedPayment('wallet_raast')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
            selectedPayment === 'wallet_raast'
              ? 'border-amber-400/80 bg-[#1c1a14] shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-amber-400/50'
              : 'border-[#262626] bg-[#171717] hover:bg-[#1f1f1f] text-slate-400'
          }`}
        >
          <Smartphone className={`w-5 h-5 ${selectedPayment === 'wallet_raast' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-xs font-black block ${selectedPayment === 'wallet_raast' ? 'text-white' : 'text-slate-200'}`}>
            Wallet / Raast
          </span>
          <span className="text-[10px] text-slate-500">JazzCash / EasyPaisa</span>
        </div>

        {/* Method 3: Bank Transfer */}
        <div
          onClick={() => setSelectedPayment('bank')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
            selectedPayment === 'bank'
              ? 'border-amber-400/80 bg-[#1c1a14] shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-amber-400/50'
              : 'border-[#262626] bg-[#171717] hover:bg-[#1f1f1f] text-slate-400'
          }`}
        >
          <Landmark className={`w-5 h-5 ${selectedPayment === 'bank' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-xs font-black block ${selectedPayment === 'bank' ? 'text-white' : 'text-slate-200'}`}>
            Bank Transfer
          </span>
          <span className="text-[10px] text-slate-500">Instant IBAN</span>
        </div>

        {/* Method 4: Cash on Delivery */}
        <div
          onClick={() => setSelectedPayment('cod')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
            selectedPayment === 'cod'
              ? 'border-amber-400/80 bg-[#1c1a14] shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-amber-400/50'
              : 'border-[#262626] bg-[#171717] hover:bg-[#1f1f1f] text-slate-400'
          }`}
        >
          <Coins className={`w-5 h-5 ${selectedPayment === 'cod' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-xs font-black block ${selectedPayment === 'cod' ? 'text-white' : 'text-slate-200'}`}>
            Cash on Delivery
          </span>
          <span className="text-[10px] text-slate-500">Pay at Arrival</span>
        </div>

      </div>

      {/* 3. Dynamic Sub-View Renderers matching exact uploaded screenshots */}

      {/* ========================================================================= */}
      {/* A. CARD PAYMENT VIEW (Exact Match to Screenshot 1)                       */}
      {/* ========================================================================= */}
      {selectedPayment === 'card' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Virtual Gold-Trim Credit Card Container matching screenshot */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-[#1c1913] via-[#141310] to-[#0a0a09] rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-5 relative overflow-hidden">
            
            {/* Top Brand & Visa Logo */}
            <div className="flex items-center justify-between">
              <span className="font-black text-xs tracking-wider text-amber-400 uppercase">
                FRESHMART PAY
              </span>
              <span className="font-black text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                VISA
              </span>
            </div>

            {/* Gold Chip & Masked Digits */}
            <div className="space-y-4">
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 shadow-inner" />
              
              <div className="text-lg sm:text-xl font-mono tracking-widest text-slate-100 font-black">
                {cardForm.number || '•••• •••• •••• ••••'}
              </div>
            </div>

            {/* Bottom Card Details */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">CARDHOLDER</span>
                <span className="font-bold text-slate-100 tracking-wider uppercase font-mono">
                  {cardForm.name || 'YOUR NAME'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">EXPIRES</span>
                <span className="font-bold text-slate-100 font-mono">
                  {cardForm.expires || 'MM/YY'}
                </span>
              </div>
            </div>

          </div>

          {/* Form Inputs matching screenshot */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                CARD NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                  placeholder="4000 1234 5678 9010"
                />
                <CreditCard className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  CARDHOLDER NAME
                </label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-xs focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Tayyaba Batool"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  EXPIRES
                </label>
                <input
                  type="text"
                  value={cardForm.expires}
                  onChange={(e) => setCardForm({ ...cardForm, expires: e.target.value })}
                  className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                  placeholder="MM/YY"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  CVV
                </label>
                <input
                  type="password"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                  className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                  placeholder="•••"
                />
              </div>
            </div>

            {/* Instant clearance footer */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-300/80 pt-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant 256-bit bank clearance. No external API key required.</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* B. WALLET / RAAST VIEW (Exact Match to Screenshot 2)                     */}
      {/* ========================================================================= */}
      {selectedPayment === 'wallet_raast' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Sub-Wallet Pills matching screenshot */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'jazzcash', name: 'JazzCash', dot: 'bg-rose-500' },
              { id: 'easypaisa', name: 'EasyPaisa', dot: 'bg-emerald-500' },
              { id: 'sadapay', name: 'SadaPay', dot: 'bg-cyan-500' },
              { id: 'nayapay', name: 'NayaPay', dot: 'bg-purple-500' },
              { id: 'raast', name: 'Raast', dot: 'bg-amber-400' }
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveSubWallet(w.id)}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubWallet === w.id
                    ? 'border border-amber-400 bg-[#1c1a14] text-white shadow-xs'
                    : 'border border-[#2a2a2a] bg-[#171717] hover:bg-[#202020] text-slate-400'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${w.dot}`} />
                <span>{w.name}</span>
              </button>
            ))}
          </div>

          {/* Merchant Info Card matching screenshot */}
          <div className="bg-[#171717] rounded-2xl p-4 sm:p-5 border border-[#2a2a2a] space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Account Title:</span>
              <span className="font-bold text-slate-100">{activeWalletData.title}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">{activeWalletData.name} Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-400 font-mono text-sm">
                  {activeWalletData.number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeWalletData.number, `${activeWalletData.name} Number`)}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#303030] text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#333]"
                >
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>{copiedField === `${activeWalletData.name} Number` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-[#262626]">
              {activeWalletData.desc}
            </p>
          </div>

          {/* Inputs: Sender Mobile + Transaction ID matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                YOUR SENDER MOBILE / ACCOUNT
              </label>
              <input
                type="text"
                value={walletForm.senderPhone}
                onChange={(e) => setWalletForm({ ...walletForm, senderPhone: e.target.value })}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="03001234567"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                TRANSACTION ID (TID)
              </label>
              <input
                type="text"
                value={walletForm.transactionId}
                onChange={(e) => setWalletForm({ ...walletForm, transactionId: e.target.value })}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="e.g. 984210482"
              />
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* C. BANK TRANSFER VIEW (Exact Match to Screenshot 3)                      */}
      {/* ========================================================================= */}
      {selectedPayment === 'bank' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Merchant Bank Info Card matching screenshot */}
          <div className="bg-[#171717] rounded-2xl p-4 sm:p-5 border border-[#2a2a2a] space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Bank Name:</span>
              <span className="font-bold text-slate-100">Meezan Bank Ltd.</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Account Title:</span>
              <span className="font-bold text-slate-100">FreshMart Retail Pvt Ltd</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">IBAN / Account:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-400 font-mono text-xs sm:text-sm">
                  PK36MEZN0001234567890123
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('PK36MEZN0001234567890123', 'IBAN')}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#303030] text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#333]"
                >
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>{copiedField === 'IBAN' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inputs: Sender Bank & Name + Transaction Ref matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                SENDER BANK & NAME
              </label>
              <input
                type="text"
                value={bankForm.senderBankName}
                onChange={(e) => setBankForm({ ...bankForm, senderBankName: e.target.value })}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="e.g. HBL – Tayyaba"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                REFERENCE / TRANSACTION REF
              </label>
              <input
                type="text"
                value={bankForm.transactionRef}
                onChange={(e) => setBankForm({ ...bankForm, transactionRef: e.target.value })}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3.5 py-3 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="e.g. REF-482910"
              />
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* D. CASH ON DELIVERY VIEW                                                  */}
      {/* ========================================================================= */}
      {selectedPayment === 'cod' && (
        <div className="bg-[#171717] rounded-2xl p-5 border border-[#2a2a2a] text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Coins className="w-4 h-4" />
            <span>Doorstep Cash / QR Settlement</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Please keep exact change ready or scan the rider's JazzCash/EasyPaisa QR scanner upon delivery.
          </p>
        </div>
      )}

    </div>
  );
};
