import React, { useState } from 'react';
import { Mail, Sparkles, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';

export const Newsletter = () => {
  const { addToast } = useStore();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribed(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    addToast('Coupon Unlocked! 🎁', `Use promo code FRESH30 for $10 OFF!`, 'success');
  };

  return (
    <section className="py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="bg-[#0b4d3c] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
        {/* Background Graphic shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-700/20 rounded-l-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-600/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-lime-300 text-xs font-bold shadow-2xs">
            <Gift className="w-3.5 h-3.5" />
            <span>Get $10 Off Your Next Order</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Stay Fresh With Daily Farm Updates
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Subscribe to our weekly newsletter to receive exclusive member discounts, fresh seasonal arrivals, and chef-curated organic recipes.
          </p>

          {isSubscribed ? (
            <div className="p-4 bg-emerald-800/80 rounded-2xl border border-emerald-500 max-w-md mx-auto flex items-center justify-center gap-2 text-lime-300 font-bold text-sm">
              <Check className="w-5 h-5 text-lime-400" />
              <span>You're subscribed! Use coupon code <span className="underline">FRESH30</span> at checkout.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="text-[11px] text-emerald-200/60">
            We respect your privacy. Unsubscribe at any time with one click.
          </p>
        </div>
      </div>
    </section>
  );
};
