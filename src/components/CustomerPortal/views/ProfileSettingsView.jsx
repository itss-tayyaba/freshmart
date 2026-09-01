import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Bell, Shield, Save, Check } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const ProfileSettingsView = () => {
  const { addToast } = useStore();

  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    email: 'customer@freshmart.com',
    phone: '0300-1234567',
    city: 'Lahore, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
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
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-500">Update your primary contact details used for express grocery delivery.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            VIP Gold Member
          </span>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
          
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
            />
            <div>
              <span className="font-bold text-slate-800 block">{profile.name}</span>
              <span className="text-slate-400">Customer ID: CUST-08492</span>
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
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number (For Courier OTP)</label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">City / Region</label>
              <input
                type="text"
                required
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </button>
          </div>

        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">Security & Password</h3>
          <p className="text-xs text-slate-500">Keep your FreshMart account secure with a strong password.</p>
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
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">Communication Preferences</h3>
          <p className="text-xs text-slate-500">Choose how you want to receive live order dispatches and offers.</p>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { key: 'orderSms', title: 'SMS Order Dispatch & Courier OTP Alerts', desc: 'Real-time SMS when courier is 2 minutes away.' },
            { key: 'whatsappTracking', title: 'WhatsApp Live GPS Map Updates', desc: 'Instant WhatsApp message with rider location link.' },
            { key: 'flashSaleAlerts', title: 'Weekend Flash Sale & Exclusive Deals', desc: 'Notifications for 50% flat discounts on grocery staples.' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-800 block">{item.title}</span>
                <span className="text-[11px] text-slate-500">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
