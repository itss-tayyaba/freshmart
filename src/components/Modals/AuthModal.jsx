import React from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CustomerAuth } from '../CustomerPortal/CustomerAuth';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen } = useStore();

  if (!isAuthOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsAuthOpen(false);
      }}
    >
      <div className="relative max-w-md w-full animate-in zoom-in-95 duration-200">
        
        {/* Floating Close Button */}
        <button
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-10 right-6 z-20 w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <CustomerAuth onAuthSuccess={() => setIsAuthOpen(false)} />
      </div>
    </div>
  );
};
