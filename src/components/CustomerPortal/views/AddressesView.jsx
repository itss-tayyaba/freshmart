import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, Home, Briefcase, Users, X } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const AddressesView = () => {
  const { addToast } = useStore();
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      title: 'Home (Default)',
      icon: 'Home',
      isDefault: true,
      receiverName: 'Alex Morgan',
      phone: '0300-1234567',
      address: 'House # 42, Block G-3, Johar Town',
      city: 'Lahore, Punjab',
      instructions: 'Please ring bell and leave on the porch if unavailable.'
    },
    {
      id: 'addr-2',
      title: 'Office / Tech Hub',
      icon: 'Briefcase',
      isDefault: false,
      receiverName: 'Alex Morgan (Work)',
      phone: '0300-1234567',
      address: 'Floor 4, Software Tech Park, Gulberg III',
      city: 'Lahore, Punjab',
      instructions: 'Deliver between 9 AM and 6 PM to receptionist.'
    },
    {
      id: 'addr-3',
      title: "Parents' Residence",
      icon: 'Users',
      isDefault: false,
      receiverName: 'Tariq Morgan',
      phone: '0321-7654321',
      address: 'Street 7, Sector Y, DHA Phase 3',
      city: 'Lahore, Punjab',
      instructions: 'Elderly residents, please handle fragile items with care.'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    receiverName: '',
    phone: '',
    address: '',
    city: 'Lahore, Punjab',
    instructions: '',
    isDefault: false
  });

  const handleSetDefault = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
        title: a.id === id && !a.title.includes('Default') ? `${a.title} (Default)` : a.title.replace(' (Default)', '')
      }))
    );
    addToast('Default Address Set 📍', 'Future express deliveries will ship to this address.');
  };

  const handleDelete = (id, title) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    addToast('Address Removed', `"${title}" was removed.`, 'info');
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const newAddr = {
      id: `addr-${Date.now()}`,
      title: addressForm.title,
      icon: addressForm.title.toLowerCase().includes('office') ? 'Briefcase' : 'Home',
      isDefault: addressForm.isDefault,
      receiverName: addressForm.receiverName || 'Alex Morgan',
      phone: addressForm.phone || '0300-1234567',
      address: addressForm.address,
      city: addressForm.city,
      instructions: addressForm.instructions || 'Standard delivery.'
    };

    if (addressForm.isDefault) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: false })));
    }

    setAddresses((prev) => [newAddr, ...prev]);
    setIsModalOpen(false);
    addToast('Address Saved 📍', `New address "${newAddr.title}" added to your account.`);
    setAddressForm({
      title: 'Home',
      receiverName: '',
      phone: '',
      address: '',
      city: 'Lahore, Punjab',
      instructions: '',
      isDefault: false
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">Saved Delivery Addresses</h3>
          <p className="text-xs text-slate-500">Manage multiple delivery locations for speedy 10-minute checkout.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`bg-white rounded-3xl p-5 border transition-all relative flex flex-col justify-between space-y-4 ${
              addr.isDefault
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-100 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  addr.isDefault ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {addr.icon === 'Briefcase' ? <Briefcase className="w-4 h-4" /> : addr.icon === 'Users' ? <Users className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                </div>
                <h4 className="font-black text-sm text-slate-900">{addr.title}</h4>
              </div>

              {addr.isDefault ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Default
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Set as Default
                </button>
              )}
            </div>

            {/* Address Details */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-bold text-slate-800">{addr.receiverName} • {addr.phone}</p>
              <p className="leading-relaxed">{addr.address}</p>
              <p className="text-slate-400 font-semibold">{addr.city}</p>
              {addr.instructions && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100 mt-2">
                  📝 {addr.instructions}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-50 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => handleDelete(addr.id, addr.title)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 font-serif">+ Add New Delivery Address</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home, Office, Villa"
                  value={addressForm.title}
                  onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={addressForm.receiverName}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="0300-1234567"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address / House No.</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House #, Street, Block, Area..."
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ring door bell, Leave with guard"
                  value={addressForm.instructions}
                  onChange={(e) => setAddressForm({ ...addressForm, instructions: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2.5 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="makeDefaultCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor="makeDefaultCheck" className="font-bold text-slate-700 cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Address
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
