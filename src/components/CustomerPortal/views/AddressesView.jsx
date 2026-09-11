import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, Home, Briefcase, Users, X, Check } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const AddressesView = () => {
  const {
    savedDeliveryAddresses,
    addSavedAddress,
    removeSavedAddress,
    deliveryLocation,
    setDeliveryLocation,
    customerUser,
    addToast
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    city: 'Lahore, Pakistan',
    phone: customerUser?.phone || '',
    instructions: ''
  });

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    addSavedAddress({
      label: addressForm.label,
      address: addressForm.address,
      city: addressForm.city,
      phone: addressForm.phone
    });

    setIsModalOpen(false);
    setAddressForm({
      label: 'Home',
      address: '',
      city: 'Lahore, Pakistan',
      phone: customerUser?.phone || '',
      instructions: ''
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/30 p-6 rounded-3xl border border-emerald-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-900/20">
            📍
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Saved Delivery Addresses</h2>
            <p className="text-xs text-slate-500">Manage your home, workplace, and custom drop-off locations</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses Grid or Clean Empty State */}
      {savedDeliveryAddresses.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-emerald-50/40 rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-xs">
            📍
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-slate-900">No delivery addresses saved yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your home or office address to enable instant 1-click checkout and 10-minute grocery dispatch.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-900/20 cursor-pointer transition-all hover:scale-105"
          >
            + Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedDeliveryAddresses.map((addr) => {
            const isSelected = deliveryLocation.address === addr.address;

            return (
              <div
                key={addr.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/20'
                    : 'bg-white border-emerald-100/80 shadow-2xs hover:shadow-md hover:border-emerald-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-sm text-slate-900">{addr.label}</h3>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-200/80 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                        ✓ Active Drop-off
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed pl-1">{addr.address}</p>
                  <p className="text-[11px] text-slate-500 font-semibold pl-1">{addr.city} • {addr.phone}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-emerald-100/70 text-xs">
                  <button
                    onClick={() => {
                      setDeliveryLocation({
                        city: addr.city,
                        address: addr.address,
                        label: addr.label
                      });
                      addToast('Active Drop-off Set 📍', `Switched delivery to ${addr.label}.`);
                    }}
                    className={`font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'text-emerald-800 font-black flex items-center gap-1'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    {isSelected ? '✓ Currently Selected' : 'Set as Active Drop-off →'}
                  </button>

                  <button
                    onClick={() => removeSavedAddress(addr.id)}
                    className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h3 className="font-black text-base text-slate-900">Add New Delivery Location</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home, Office, Parents, Studio"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Street Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House/Apartment #, Street Name, Sector, Area"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option>Lahore, Pakistan</option>
                    <option>Karachi, Pakistan</option>
                    <option>Islamabad, Pakistan</option>
                    <option>Rawalpindi, Pakistan</option>
                    <option>Faisalabad, Pakistan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-md transition-all hover:scale-105"
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
