import React from 'react';
import { Smartphone, Download, ShieldCheck, CheckCircle2, ArrowLeft, Bike, Boxes } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const StaffAppDownload = () => {
  const { navigateTo, currentTenant } = useStore();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-xl mx-auto w-full pt-6">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-6 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>

        <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Staff Only · Confidential
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                FreshMart Staff Mobile App
              </h1>
              <p className="text-xs text-slate-400">
                For Delivery Couriers & Warehouse Pickup Specialists
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300 mb-8 leading-relaxed">
            <p>
              The unified Staff App switches automatically to your role after login:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
                <Bike className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Rider Shell</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live GPS telemetry, customer calling, turn-by-turn navigation, OTP completion & cash collection.
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
                <Boxes className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Pickup Shell</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Assigned packing list, 1-tap Start Preparing, and Ready for Pickup status dispatch.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-center mb-6">
            <a
              href="/downloads/freshmart-staff.apk"
              download="freshmart-staff.apk"
              className="w-full inline-flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide transition shadow-lg shadow-emerald-900/40 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Staff APK (v1.0.0)</span>
            </a>
            <p className="text-[11px] text-emerald-300/80 mt-2 font-medium">
              Android 8.0+ · APK direct download · 28 MB
            </p>
          </div>

          {/* Android Installation Tip */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Android Installation Guide</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
              <li>Tap the green Download button above.</li>
              <li>When prompted by Chrome/browser, choose <strong>"Download anyway"</strong>.</li>
              <li>Open the downloaded APK and enable <strong>"Install unknown apps"</strong> when requested.</li>
              <li>Log in using your store courier credentials or pickup staff account.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 py-4">
        © 2026 FreshMart Super Grocery Operations. Internal distribution only.
      </div>
    </div>
  );
};
