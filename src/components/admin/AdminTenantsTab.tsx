import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Layers,
  Radio,
  Building2,
  Mail,
  ShieldCheck,
  X,
  RefreshCw,
  Plus,
  Edit2,
  Phone,
  Globe,
  Lock,
  ExternalLink,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { User, SubscriptionPlan, Station } from '../../types';

interface TenantItem {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt?: string;
  user: User;
  profile?: any;
  ownerProfile?: any;
  stationCount: number;
  stationsCount?: number;
  stations?: Station[];
  subscription?: any;
  plan?: SubscriptionPlan;
}

interface AdminTenantsTabProps {
  tenants: TenantItem[];
  plans: SubscriptionPlan[];
  onRefresh: () => void;
  onNavigateToStation?: (stationId: string) => void;
}

export function AdminTenantsTab({
  tenants,
  plans,
  onRefresh,
  onNavigateToStation,
}: AdminTenantsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [assigningTenant, setAssigningTenant] = useState<TenantItem | null>(null);
  const [viewingStationsTenant, setViewingStationsTenant] = useState<TenantItem | null>(null);
  
  // Action processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Broadcaster Form state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    phone: '',
    country: 'TZ',
    planId: plans[0]?.id || '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING',
  });

  // Edit Broadcaster Form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    organizationName: '',
    phone: '',
    country: 'TZ',
    bio: '',
    website: '',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'PENDING',
    planId: '',
  });

  // Assign Plan Form state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const openEditModal = (tenant: TenantItem) => {
    const user = tenant.user || tenant;
    const profile = tenant.profile || tenant.ownerProfile || {};
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      organizationName: profile.organizationName || '',
      phone: profile.phone || '',
      country: profile.country || 'TZ',
      bio: profile.bio || '',
      website: profile.website || '',
      status: (user.status || 'ACTIVE') as any,
      planId: tenant.plan?.id || tenant.subscription?.planId || '',
    });
    setEditingTenant(tenant);
    setErrorMsg('');
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    setProcessingId(tenantId);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await apiFetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccessMsg(`Broadcaster status updated to ${newStatus}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update broadcaster status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateBroadcaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          email: '',
          password: '',
          organizationName: '',
          phone: '',
          country: 'TZ',
          planId: plans[0]?.id || '',
          status: 'ACTIVE',
        });
        setSuccessMsg('Broadcaster registered and verified successfully!');
        setTimeout(() => setSuccessMsg(''), 5000);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create broadcaster');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const userId = editingTenant.user?.id || editingTenant.id;
      const res = await apiFetch(`/api/admin/tenants/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditingTenant(null);
        setSuccessMsg('Broadcaster profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTenant || !selectedPlanId) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const userId = assigningTenant.user?.id || assigningTenant.id;
      const res = await apiFetch(`/api/admin/tenants/${userId}/assign-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId, billingInterval: selectedInterval }),
      });

      if (res.ok) {
        setAssigningTenant(null);
        setSuccessMsg('Package assigned successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to assign package');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning package');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalCount = tenants.length;
  const activeCount = tenants.filter((t) => (t.user?.status || t.status) === 'ACTIVE').length;
  const suspendedCount = tenants.filter((t) => (t.user?.status || t.status) === 'SUSPENDED').length;
  const totalFleetStations = tenants.reduce(
    (acc, t) => acc + (t.stationCount || t.stationsCount || t.stations?.length || 0),
    0
  );

  // Filtering
  const filteredTenants = tenants.filter((t) => {
    const user = t.user || (t as any);
    const name = user?.name || '';
    const email = user?.email || '';
    const org = t.profile?.organizationName || t.ownerProfile?.organizationName || '';
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || org.toLowerCase().includes(q);

    const userStatus = user?.status || t.status || 'ACTIVE';
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = userStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-tenants-tab" className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Broadcasters & Radio Fleet Directory
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Fleet Control
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register radio owners, manage subscription packages, verify KYC documents, and monitor broadcast fleet capacity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              setErrorMsg('');
            }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Broadcaster</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Fleet KPI Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Broadcasters</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Registered accounts</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Broadcasters</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Broadcasting in good standing</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suspended</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{suspendedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Locked or pending review</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fleet Radio Stations</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{totalFleetStations}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total linked channels</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search broadcaster name, email, ministry..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: `All (${totalCount})` },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'SUSPENDED', label: `Suspended (${suspendedCount})` },
              { id: 'PENDING', label: 'Pending' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === filter.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Broadcasters Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Broadcaster / Ministry</th>
                <th className="py-3.5 px-4">Stations Fleet</th>
                <th className="py-3.5 px-4">Subscription Package</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">No broadcasters found matching your query.</p>
                    <p className="text-xs text-slate-600 mt-1">Try clearing search filters or add a new broadcaster.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant, idx) => {
                  const user = tenant.user || (tenant as any);
                  const userId = user.id || tenant.id;
                  const profile = tenant.profile || tenant.ownerProfile;
                  const stationCount = tenant.stationCount || tenant.stationsCount || (tenant.stations?.length || 0);
                  const plan = tenant.plan || (tenant.subscription ? plans.find((p) => p.id === tenant.subscription.planId) : null);
                  const isActive = (user.status || tenant.status) === 'ACTIVE';
                  const isProcessing = processingId === userId;

                  return (
                    <tr key={userId || idx} className="hover:bg-slate-800/40 transition-colors">
                      {/* Broadcaster Profile */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                            {(user.name || 'B').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              {user.name}
                              {profile?.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verified Broadcaster" />
                              )}
                            </div>
                            <div className="text-slate-400 text-xs truncate">
                              {profile?.organizationName || 'Independent Broadcaster'}
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {user.email}
                              </span>
                              {profile?.country && (
                                <span className="font-mono text-amber-400 font-bold uppercase">
                                  • {profile.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Station Count */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setViewingStationsTenant(tenant)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 text-amber-400" />
                          <span>{stationCount} Station{stationCount === 1 ? '' : 's'}</span>
                        </button>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-4">
                        {plan ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              <Layers className="w-3 h-3 text-purple-400" />
                              {plan.name}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              ${plan.monthlyPriceUsd}/mo • {plan.maxStations} max stations
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Free / Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {user.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Profile */}
                          <button
                            type="button"
                            onClick={() => openEditModal(tenant)}
                            className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-700"
                            title="Edit Broadcaster Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit</span>
                          </button>

                          {/* Assign Plan */}
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningTenant(tenant);
                              setSelectedPlanId(tenant.plan?.id || plans[0]?.id || '');
                            }}
                            className="p-1.5 px-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Assign Subscription Package"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Package</span>
                          </button>

                          {/* Quick Suspend / Activate Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(userId, user.status || 'ACTIVE')}
                            disabled={isProcessing}
                            className={`p-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                              isActive
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={isActive ? 'Suspend Broadcaster Account' : 'Activate Broadcaster Account'}
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isActive ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD BROADCASTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Broadcaster</h3>
                  <p className="text-xs text-slate-400">Create a radio owner account with instant package assignment.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcaster} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Broadcaster Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Pastor John Doe / Station Manager"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="broadcaster@station.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Leave blank for auto default: Broadcaster@2026!"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-20 py-2.5 text-xs text-slate-200 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, password: `Broadcaster_${Math.random().toString(36).slice(-6)}!` })}
                      className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Ministry / Org Name</label>
                    <input
                      type="text"
                      value={addForm.organizationName}
                      onChange={(e) => setAddForm({ ...addForm, organizationName: e.target.value })}
                      placeholder="Grace FM Ministries"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Country</label>
                    <select
                      value={addForm.country}
                      onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    >
                      <option value="TZ">Tanzania (TZ)</option>
                      <option value="KE">Kenya (KE)</option>
                      <option value="UG">Uganda (UG)</option>
                      <option value="RW">Rwanda (RW)</option>
                      <option value="NG">Nigeria (NG)</option>
                      <option value="GH">Ghana (GH)</option>
                      <option value="ZA">South Africa (ZA)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      placeholder="+255 700 000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Assign Package Tier</label>
                    <select
                      value={addForm.planId}
                      onChange={(e) => setAddForm({ ...addForm, planId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.monthlyPriceUsd}/mo)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Modal Action Footer */}
              <div className="flex items-center justify-end gap-3 p-4 px-6 bg-slate-950 border-t border-slate-800 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating Broadcaster...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT BROADCASTER PROFILE MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Broadcaster Profile</h3>
                  <p className="text-xs text-slate-400">{editingTenant.user?.email || editingTenant.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Broadcaster Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Ministry / Organization</label>
                    <input
                      type="text"
                      value={editForm.organizationName}
                      onChange={(e) => setEditForm({ ...editForm, organizationName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold"
                    >
                      <option value="ACTIVE">ACTIVE (Good Standing)</option>
                      <option value="SUSPENDED">SUSPENDED (Locked)</option>
                      <option value="PENDING">PENDING (Review)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+255 700 000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Country</label>
                    <select
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    >
                      <option value="TZ">Tanzania (TZ)</option>
                      <option value="KE">Kenya (KE)</option>
                      <option value="UG">Uganda (UG)</option>
                      <option value="RW">Rwanda (RW)</option>
                      <option value="NG">Nigeria (NG)</option>
                      <option value="GH">Ghana (GH)</option>
                      <option value="ZA">South Africa (ZA)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Package Tier</label>
                  <select
                    value={editForm.planId}
                    onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold"
                  >
                    <option value="">No Plan / Free Starter</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.monthlyPriceUsd}/mo ({p.maxStations} station slots)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://gracefm.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-3 p-4 px-6 bg-slate-950 border-t border-slate-800 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN PACKAGE MODAL */}
      {assigningTenant && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assign Subscription Package</h3>
                  <p className="text-xs text-slate-400">{assigningTenant.user?.name || assigningTenant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTenant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignPlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Select Package</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.monthlyPriceUsd}/mo ({p.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Billing Interval</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInterval('MONTHLY')}
                    className={`py-2 rounded-xl font-bold transition cursor-pointer border ${
                      selectedInterval === 'MONTHLY'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInterval('ANNUAL')}
                    className={`py-2 rounded-xl font-bold transition cursor-pointer border ${
                      selectedInterval === 'ANNUAL'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Annual Billing
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningTenant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VIEW STATIONS FLEET DRAWER */}
      {viewingStationsTenant && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Stations Fleet: {viewingStationsTenant.user?.name || viewingStationsTenant.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingStationsTenant.stations?.length || 0} radio station(s) registered
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStationsTenant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3 text-xs">
              {!viewingStationsTenant.stations || viewingStationsTenant.stations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No radio stations linked to this broadcaster account yet.
                </div>
              ) : (
                viewingStationsTenant.stations.map((station) => (
                  <div
                    key={station.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {station.logoUrl ? (
                          <img src={station.logoUrl} alt={station.name} className="w-full h-full object-cover" />
                        ) : (
                          <Radio className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{station.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">{station.streamUrl}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          station.streamStatus === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {station.streamStatus || 'ONLINE'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 px-6 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStationsTenant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Fleet Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
