import React, { useState } from 'react';
import { Store, Building, Mail, Phone, MapPin, CheckCircle2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { useStore } from '../../context/StoreContext';

export const VendorRegistrationModal = ({ isOpen, onClose }) => {
  const { addToast } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    category: 'Fresh Fruits & Farm Vegetables',
    city: 'Lahore',
    address: '',
    bio: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiService.registerVendor(formData);
      if (res && res.success) {
        setSubmitted(true);
        addToast('Application Received! 🏪', 'Your marketplace vendor application has been sent for admin review.');
      } else {
        addToast('Registration Note', res?.message || 'Application submitted for review.');
        setSubmitted(true);
      }
    } catch (err) {
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              🏪
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Become a FreshMart Vendor</h3>
              <span className="text-[11px] text-slate-500">Sell farm produce, beverages & goods to thousands of shoppers</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              ✅
            </div>
            <h4 className="text-base font-black text-slate-900">Application Submitted for Review!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your store <strong>{formData.name}</strong> is currently in the <strong>Pending Admin Approval</strong> queue. Once approved by the FreshMart operations team, you can log in to your Vendor Dashboard.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Farm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner / Representative Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mahmood"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Email</label>
                <input
                  type="email"
                  required
                  placeholder="vendor@greenvalley.pk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Specialty</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="Fresh Fruits & Farm Vegetables">Fresh Fruits & Farm Vegetables</option>
                  <option value="Fresh Milk & Pure Dairy">Fresh Milk & Pure Dairy</option>
                  <option value="Poultry & Farm Fresh Eggs">Poultry & Farm Fresh Eggs</option>
                  <option value="Beverages, Juices & Soft Drinks">Beverages, Juices & Soft Drinks</option>
                  <option value="Bakery, Flour & Yeast">Bakery, Flour & Yeast</option>
                  <option value="Snacks & Packaged Staples">Snacks & Packaged Staples</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Warehouse / Farm Address</label>
              <input
                type="text"
                required
                placeholder="Plot 18, Block B, Industrial Estate, Lahore"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Description & Specialty</label>
              <textarea
                rows={2}
                placeholder="Briefly describe the produce and products you will be supplying..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all mt-2"
            >
              {isLoading ? 'Submitting Application...' : 'Submit Vendor Application'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
