import React from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CustomerAuth } from '../CustomerPortal/CustomerAuth';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen } = useStore();

  if (!isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-md w-full animate-in zoom-in-95 duration-200">
        
        {/* Floating Close Button */}
        <button
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <CustomerAuth onAuthSuccess={() => setIsAuthOpen(false)} />
      </div>
    </div>
  );
};
