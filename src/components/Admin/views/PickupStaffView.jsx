import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Mail, Phone, Plus, RefreshCw, Users } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const PickupStaffView = () => {
  const { user, addToast } = useStore();
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const response = await apiService.getPickupStaff();
    if (!response?.success || !Array.isArray(response.staff)) {
      const message = response?.message || response?.error || 'Could not load pickup staff for this branch.';
      setError(message);
      setIsLoading(false);
      return;
    }
    setStaff(response.staff);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff, user?.branchId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    const response = await apiService.createPickupStaff(form);
    if (!response?.success || !response.staff) {
      const message = response?.message || response?.error || 'Could not create pickup staff account.';
      setError(message);
      addToast('Staff Account Not Created', message, 'error');
      setIsSaving(false);
      return;
    }
    setStaff((current) => [...current, response.staff].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: '', email: '', phone: '', password: '' });
    addToast('Pickup Staff Account Created', `${response.staff.name} can now sign in using this email and password.`);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pickup Staff</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create branch-scoped staff accounts. Orders assigned here appear in their pickup dashboard on any device.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStaff}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-slate-900">Branch Accounts</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {staff.length} staff
            </span>
          </div>
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading pickup staff…
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
              <Users className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              No pickup staff accounts in this branch yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {staff.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5" /> {member.email}
                    </p>
                    {member.phone && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3.5 w-3.5" /> {member.phone}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-black text-slate-900">Register Pickup Staff</h2>
            <p className="mt-1 text-xs text-slate-500">
              Account is assigned to branch <span className="font-bold">{user?.branchId || 'not set'}</span>.
            </p>
          </div>
          <label className="block text-xs font-bold text-slate-600">
            Full name
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            Email (login)
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            Temporary password (minimum 8 characters)
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <button
            disabled={isSaving || !user?.branchId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create staff account
          </button>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <KeyRound className="h-3.5 w-3.5" /> Passwords are hashed by the server before storage.
          </p>
        </form>
      </div>
    </div>
  );
};
