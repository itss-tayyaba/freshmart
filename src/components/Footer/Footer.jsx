import React from 'react';
import { Mail, Phone, MapPin, ArrowUp, Heart, ShieldCheck, Sparkles, Smartphone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Footer = () => {
  const { setActiveCategory, setIsVendorRegisterOpen, navigateTo, currentTenant } = useStore();
  const isUnimaart = currentTenant?.id === 'tenant-freshmart';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer
      id="footer-section"
      className={`text-slate-300 pt-16 pb-8 px-4 sm:px-8 border-t mt-12 transition-colors duration-200 ${
        isUnimaart ? 'bg-[#091522] border-sky-950' : 'bg-[#07382c] border-emerald-900/60'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Main Footer Links Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b ${
          isUnimaart ? 'border-sky-950' : 'border-emerald-900/60'
        }`}>
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-md ${
                isUnimaart
                  ? 'bg-gradient-to-br from-[#0284c7] to-[#0369a1]'
                  : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              }`}>
                🛒
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                {isUnimaart ? 'Unimaart ' : 'Grocery '}<span className={isUnimaart ? 'text-sky-400' : 'text-lime-400'}>{isUnimaart ? 'Market' : 'Shop'}</span>
              </span>
            </a>

            <p className="text-xs text-slate-300/80 leading-relaxed max-w-sm">
              {isUnimaart
                ? 'Fresh food, fair prices, and fast 10-15 minute grocery delivery right to your doorstep. Quality farm produce and daily market essentials.'
                : 'We connect local organic farmers directly with your kitchen. Everyday low prices on fresh vegetables, wild fruits, prime meats, and healthy pantry staples.'}
            </p>

            <div className="space-y-2 text-xs text-slate-300/90 pt-1">
              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4 shrink-0 ${isUnimaart ? 'text-sky-400' : 'text-emerald-400'}`} />
                <span>{isUnimaart ? 'Gulberg Express Dark Store SuperHub, Lahore, Pakistan' : '124 Market Boulevard, Suite 500, Seattle, WA'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className={`w-4 h-4 shrink-0 ${isUnimaart ? 'text-sky-400' : 'text-emerald-400'}`} />
                <span>{isUnimaart ? '+9870-256-679' : '88 01434 65768 / +00 017500399'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className={`w-4 h-4 shrink-0 ${isUnimaart ? 'text-sky-400' : 'text-emerald-400'}`} />
                <span>{isUnimaart ? 'support@unimaart.com' : 'info.grocery@gmail.com'}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {['vegetables', 'fruits', 'fish-meats', 'drinks-juice', 'cooking', 'biscuits-cakes'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className={`transition-colors capitalize text-slate-300 ${
                      isUnimaart ? 'hover:text-sky-400' : 'hover:text-lime-400'
                    }`}
                  >
                    {cat.replace('-', ' & ')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#flash-deals-section" className={`transition-colors ${isUnimaart ? 'hover:text-sky-400' : 'hover:text-lime-400'}`}>Daily Deals & Coupons</a></li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsVendorRegisterOpen(true)}
                  className={`font-bold transition-colors text-left flex items-center gap-1 cursor-pointer ${
                    isUnimaart ? 'text-sky-300 hover:text-sky-400' : 'text-emerald-300 hover:text-lime-400'
                  }`}
                >
                  <span>🏪 Sell on {isUnimaart ? 'Unimaart' : 'FreshMart'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className={`text-slate-300 transition-colors text-left cursor-pointer ${
                    isUnimaart ? 'hover:text-sky-400' : 'hover:text-lime-400'
                  }`}
                >
                  📦 {isUnimaart ? 'Unimaart Store Admin' : 'Vendor / Partner Login'}
                </button>
              </li>
              <li><a href="#" className={`transition-colors ${isUnimaart ? 'hover:text-sky-400' : 'hover:text-lime-400'}`}>Order Tracking</a></li>
              <li><a href="#" className={`transition-colors ${isUnimaart ? 'hover:text-sky-400' : 'hover:text-lime-400'}`}>FAQ & Support</a></li>
            </ul>
          </div>

          {/* Col 4: Mobile Apps & Certifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Get Our App
            </h4>
            <p className="text-xs text-slate-300/80">
              Download our mobile app on iOS & Android for 1-tap express ordering.
            </p>

            <div className="space-y-2 pt-1">
              {/* App Store button */}
              <div className={`p-2 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                isUnimaart
                  ? 'bg-slate-900/90 hover:bg-slate-900 border-sky-900/50'
                  : 'bg-slate-900/90 hover:bg-slate-900 border-emerald-800'
              }`}>
                <Smartphone className="w-5 h-5 text-white" />
                <div className="text-left">
                  <span className="text-[9px] uppercase text-slate-400 block leading-none">Download on the</span>
                  <span className="text-xs font-bold text-white leading-tight">Apple App Store</span>
                </div>
              </div>

              {/* Google Play button */}
              <div className={`p-2 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                isUnimaart
                  ? 'bg-slate-900/90 hover:bg-slate-900 border-sky-900/50'
                  : 'bg-slate-900/90 hover:bg-slate-900 border-emerald-800'
              }`}>
                <Smartphone className={`w-5 h-5 ${isUnimaart ? 'text-sky-400' : 'text-lime-400'}`} />
                <div className="text-left">
                  <span className="text-[9px] uppercase text-slate-400 block leading-none">Get it on</span>
                  <span className="text-xs font-bold text-white leading-tight">Google Play Store</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © 2026 <strong className="text-white">{isUnimaart ? 'Unimaart Market Store' : 'Grocery Shop'}</strong>. All rights reserved. Made with fresh farm ingredients.
          </p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 mr-1">Secured by:</span>
            <div className={`flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border ${
              isUnimaart ? 'border-sky-950' : 'border-emerald-900'
            }`}>
              <span className="font-extrabold text-white text-[11px] tracking-wider">VISA</span>
              <span className="text-slate-500">•</span>
              <span className="font-extrabold text-white text-[11px] tracking-wider">Mastercard</span>
              <span className="text-slate-500">•</span>
              <span className="font-extrabold text-blue-400 text-[11px] tracking-wider">PayPal</span>
              <span className="text-slate-500">•</span>
              <span className="font-extrabold text-white text-[11px] tracking-wider">Pay</span>
            </div>
          </div>

          {/* Back to Top */}
          <button
            onClick={scrollToTop}
            className={`w-9 h-9 rounded-full text-white flex items-center justify-center transition-all shadow-md focus:outline-none ${
              isUnimaart
                ? 'bg-[#0284c7] hover:bg-sky-400 hover:text-slate-950'
                : 'bg-emerald-800 hover:bg-lime-500 hover:text-emerald-950'
            }`}
            aria-label="Back to Top"
            title="Back to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
