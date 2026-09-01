import React from 'react';
import { Sparkles, Truck, Tag, Flame, Compass } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Navbar = () => {
  const { setIsOffersOpen, setIsOrderTrackerOpen, setActiveCategory } = useStore();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200/80 shadow-xs hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14">
        
        {/* Left spacing for aligned sidebar & Nav links */}
        <div className="flex items-center gap-8 lg:gap-10">
          
          {/* Top Categories placeholder button for small screens */}
          <div className="w-64 xl:w-72 hidden lg:flex items-center text-sm font-bold text-slate-800 tracking-wide">
            {/* Align with Top Categories card below */}
          </div>

          {/* Navigation Links */}
          <ul className="flex items-center gap-7 lg:gap-9 text-sm font-semibold text-slate-700">
            <li>
              <a
                href="#"
                className="text-brand-green font-bold border-b-2 border-brand-green pb-1 flex items-center gap-1.5 transition-colors"
              >
                Home
              </a>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  scrollToSection('products-section');
                }}
                className="hover:text-brand-green transition-colors pb-1 border-b-2 border-transparent hover:border-brand-green"
              >
                Shop
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('products-section')}
                className="hover:text-brand-green transition-colors pb-1 border-b-2 border-transparent hover:border-brand-green"
              >
                Products
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('flash-deals-section')}
                className="hover:text-brand-green transition-colors pb-1 border-b-2 border-transparent hover:border-brand-green flex items-center gap-1"
              >
                <span>Deals</span>
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Hot
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('blog-section')}
                className="hover:text-brand-green transition-colors pb-1 border-b-2 border-transparent hover:border-brand-green"
              >
                Blog
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('footer-section')}
                className="hover:text-brand-green transition-colors pb-1 border-b-2 border-transparent hover:border-brand-green"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>

        {/* Right Nav Action Buttons matching screenshot */}
        <div className="flex items-center gap-6">
          
          {/* Offers* Button */}
          <button
            onClick={() => setIsOffersOpen(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors group cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-3.5 h-3.5 fill-rose-600 text-rose-600 animate-bounce-soft" />
            </div>
            <span>Offers*</span>
          </button>

          {/* Track Order Button */}
          <button
            onClick={() => setIsOrderTrackerOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand-green transition-colors group cursor-pointer"
          >
            <Truck className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            <span>Track Order</span>
          </button>
        </div>

      </div>
    </nav>
  );
};
