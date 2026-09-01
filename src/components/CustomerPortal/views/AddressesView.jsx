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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-slate-400">Manage your home, workplace, and custom drop-off locations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses Grid or Clean Empty State */}
      {savedDeliveryAddresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
            📍
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm text-slate-900">No delivery addresses saved yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your home or office address to enable instant 1-click checkout and 10-minute grocery dispatch.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
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
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' : 'border-slate-100 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-sm text-slate-900">{addr.label}</h3>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Active Drop-off
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{addr.address}</p>
                  <p className="text-[11px] text-slate-400">{addr.city} • {addr.phone}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setDeliveryLocation({
                        city: addr.city,
                        address: addr.address,
                        label: addr.label
                      });
                      addToast('Active Drop-off Set 📍', `Switched delivery to ${addr.label}.`);
                    }}
                    className={`font-bold transition-colors cursor-pointer ${
                      isSelected ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected Address' : 'Set as Active Drop-off'}
                  </button>

                  <button
                    onClick={() => removeSavedAddress(addr.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add New Delivery Location</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
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
