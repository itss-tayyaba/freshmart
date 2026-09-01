import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-3 border transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              isError
                ? 'bg-rose-950 text-white border-rose-800'
                : isInfo
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-[#07382c] text-white border-emerald-700/60'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isError ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : isInfo ? (
                <Info className="w-5 h-5 text-blue-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-lime-400" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
