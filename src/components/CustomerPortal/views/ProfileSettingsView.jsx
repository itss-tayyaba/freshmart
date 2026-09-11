import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Bell, Shield, Save, Check } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const ProfileSettingsView = () => {
  const { addToast, customerUser, updateCustomerAvatar } = useStore();

  const [profile, setProfile] = useState({
    name: customerUser?.name || 'Customer User',
    email: customerUser?.email || 'customer@freshmart.com',
    phone: customerUser?.phone || '0320-6551699',
    city: customerUser?.city || 'Lahore, Pakistan',
    avatar: customerUser?.avatar || ''
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    orderSms: true,
    whatsappTracking: true,
    promoEmails: false,
    flashSaleAlerts: true
  });

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    addToast('Profile Updated 👤', 'Your personal account details have been saved.');
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      addToast('Password Mismatch', 'New passwords do not match.', 'error');
      return;
    }
    addToast('Password Updated 🔐', 'Your account password has been changed securely.');
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
              👤
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Personal Account Details</h3>
              <p className="text-xs text-slate-500">Update your primary contact details used for express grocery delivery.</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 to-amber-400 px-3.5 py-1 rounded-full shadow-xs border border-amber-400/40">
            ★ VIP Gold Member
          </span>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
          
          <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-4 rounded-2xl border border-emerald-100/80">
            {customerUser?.avatar ? (
              <img
                src={customerUser.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#07382c] text-white font-black text-xl flex items-center justify-center shadow-md ring-2 ring-emerald-300/30">
                {getInitials(profile.name)}
              </div>
            )}
            <div>
              <span className="font-black text-slate-900 text-sm block">{profile.name}</span>
              <span className="text-emerald-700 font-semibold font-mono text-xs">Customer ID: {customerUser?.id || 'CUST-08492'}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">{profile.email} • {profile.phone}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number (For Courier OTP)</label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">City / Region</label>
              <input
                type="text"
                required
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Account Details</span>
            </button>
          </div>

        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-emerald-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            🔐
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Security & Password</h3>
            <p className="text-xs text-slate-500">Keep your FreshMart account secure with a strong password.</p>
          </div>
        </div>

        <form onSubmit={handleSecuritySave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-slate-900 to-emerald-950 hover:from-slate-800 hover:to-emerald-900 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
            🔔
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Communication Preferences</h3>
            <p className="text-xs text-slate-500">Choose how you want to receive live order dispatches and offers.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { key: 'orderSms', title: 'SMS Order Dispatch & Courier OTP Alerts', desc: 'Real-time SMS when courier is 2 minutes away from your gate.' },
            { key: 'whatsappTracking', title: 'WhatsApp Live GPS Map Updates', desc: 'Instant WhatsApp message with direct rider live location link.' },
            { key: 'flashSaleAlerts', title: 'Weekend Flash Sale & Exclusive Deals', desc: 'Notifications for up to 50% discounts on grocery staples.' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 hover:bg-emerald-50/70 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">{item.title}</span>
                <span className="text-[11px] text-slate-500">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
