import React, { useState } from 'react';
import { Mail, Phone, ChevronDown, Check, Globe } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' }
];

export const TopBar = () => {
  const { language, setLanguage, currency, setCurrency } = useStore();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrOpen, setIsCurrOpen] = useState(false);

  return (
    <div className="bg-[#07382c] text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
        {/* Left Contact Details */}
        <div className="flex items-center gap-6">
          <a
            href="mailto:info.grocery@gmail.com"
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>info.grocery@gmail.com</span>
          </a>
          <span className="hidden sm:inline text-emerald-800">|</span>
          <a
            href="tel:+00017500399"
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>+00 017500399</span>
          </a>
        </div>

        {/* Right Settings */}
        <div className="flex items-center gap-5 ml-auto">
          {/* Currency Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCurrOpen(!isCurrOpen);
                setIsLangOpen(false);
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-0.5 focus:outline-none"
            >
              <span className="font-semibold text-emerald-400">{currency.code}</span>
              <span>({currency.symbol})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white text-slate-800 rounded-lg shadow-dropdown py-1 z-50 border border-slate-100 text-xs">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => {
                      setCurrency(curr);
                      setIsCurrOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50 hover:text-brand-green text-left ${
                      currency.code === curr.code ? 'font-semibold text-brand-green bg-emerald-50/50' : ''
                    }`}
                  >
                    <span>{curr.name}</span>
                    {currency.code === curr.code && <Check className="w-3 h-3 text-brand-green" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-emerald-800">|</span>

          {/* Language Dropdown with Flag */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsCurrOpen(false);
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-0.5 focus:outline-none"
            >
              <span className="text-sm leading-none">{language.flag}</span>
              <span>{language.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white text-slate-800 rounded-lg shadow-dropdown py-1 z-50 border border-slate-100 text-xs">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang);
                      setIsLangOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between hover:bg-emerald-50 hover:text-brand-green text-left ${
                      language.code === lang.code ? 'font-semibold text-brand-green bg-emerald-50/50' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {language.code === lang.code && <Check className="w-3 h-3 text-brand-green" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
