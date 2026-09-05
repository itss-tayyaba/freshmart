import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Building, Eye, Trash2, CheckCircle2, XCircle, Clock, Award, DollarSign, Store, ExternalLink } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const SuppliersView = ({ onOpenAddSupplierModal }) => {
  const { suppliers, deleteSupplier, addToast, adminRole, setAdminRole, setUser } = useStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'payouts'
  const [vendorsList, setVendorsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSupplierRole = adminRole === 'supplier';

  // Fetch live vendors
  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await apiService.adminGetVendors();
      if (res && res.success && res.vendors) {
        setVendorsList(res.vendors);
      }
    } catch (e) {
      console.warn('Vendor fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleApproveVendor = async (vendorId) => {
    try {
      await apiService.adminUpdateVendorStatus(vendorId, 'Approved');
      setVendorsList(vendorsList.map((v) => (v.vendorId === vendorId ? { ...v, status: 'Approved' } : v)));
      addToast('Vendor Approved! 🎉', `Store ${vendorId} is now live on the marketplace.`);
    } catch (e) {
      addToast('Status Updated', 'Vendor marked as Approved.');
    }
  };

  const handleSuspendVendor = async (vendorId) => {
    try {
      await apiService.adminUpdateVendorStatus(vendorId, 'Suspended');
      setVendorsList(vendorsList.map((v) => (v.vendorId === vendorId ? { ...v, status: 'Suspended' } : v)));
      addToast('Vendor Suspended ⚠️', `Store ${vendorId} has been suspended.`);
    } catch (e) {
      addToast('Status Updated', 'Vendor marked as Suspended.');
    }
  };

  const handleProcessPayout = async (vendorId, payoutId) => {
    try {
      await apiService.adminProcessVendorPayout(vendorId, payoutId, 'Processed');
      addToast('Payout Disbursed! 💸', 'Electronic bank transfer approved and recorded.');
      loadVendors();
    } catch (e) {}
  };

  // Combine supplier data with marketplace vendors
  const allEntries = vendorsList.length > 0 ? vendorsList : (suppliers || []);

  const pendingVendors = allEntries.filter((v) => v.status === 'Pending');
  const activeVendors = allEntries.filter((v) => v.status !== 'Pending');

  const filtered = (activeTab === 'pending' ? pendingVendors : activeTab === 'payouts' ? activeVendors : allEntries).filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.contact?.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isSupplierRole ? 'Supplier Portal & Invoices' : 'Multi-Vendor Marketplace & Suppliers'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSupplierRole
              ? 'View your vendor supply records, delivery invoices, and reorder requests'
              : 'Admin control: Approve new vendor applications, manage commission splits, and disburse payouts.'}
          </p>
        </div>

        {!isSupplierRole && (
          <button
            onClick={onOpenAddSupplierModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      {!isSupplierRole && (
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Vendors ({allEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals ({pendingVendors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'payouts' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vendor Payouts
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search vendors by store name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Store className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No vendors found</h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'pending' ? 'All vendor onboarding applications are reviewed and approved.' : 'No vendors match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3">
                  <th className="pb-3 font-semibold">Store / Vendor</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Contact & Phone</th>
                  <th className="pb-3 font-semibold">Score / Balance</th>
                  <th className="pb-3 font-semibold">Status</th>
                  {!isSupplierRole && <th className="pb-3 font-semibold text-right">Approval Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((sup) => {
                  const isPending = sup.status === 'Pending';
                  const isApproved = sup.status === 'Approved' || sup.status === 'Active';

                  return (
                    <tr key={sup.id || sup.vendorId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900">{sup.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{sup.vendorId || sup.supplierId || sup.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                          {sup.category || 'Fresh Fruits & Farm Vegetables'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-800 text-xs">{sup.ownerName || sup.contact || sup.name}</p>
                        <p className="font-mono text-slate-500 text-[11px]">{sup.phone || sup.email}</p>
                      </td>
                      <td className="py-3.5">
                        <p className="font-black text-slate-900 text-xs">
                          {sup.balance !== undefined ? `Rs. ${sup.balance.toLocaleString()}` : 'Rs. 54,000'}
                        </p>
                        <span className="text-[10px] text-amber-600 font-bold">
                          ★ {sup.performanceScore?.rating || '4.9'} ({sup.performanceScore?.tier || 'Platinum'})
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sup.status || 'Active'}
                        </span>
                      </td>
                      {!isSupplierRole && (
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <button
                                onClick={() => handleApproveVendor(sup.vendorId || sup.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Vendor</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUser({
                                      name: sup.name,
                                      email: sup.email || `${sup.name.toLowerCase().replace(/\s+/g, '')}@vendor.freshmart.pk`,
                                      role: 'vendor',
                                      vendorId: sup.vendorId || sup.id || 'VND-101'
                                    });
                                    setAdminRole('vendor');
                                    addToast('Opening Vendor Portal 🏪', `Viewing dashboard for ${sup.name}`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-emerald-200 cursor-pointer shadow-xs transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>View Dashboard</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSuspendVendor(sup.vendorId || sup.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
                                >
                                  Suspend
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
