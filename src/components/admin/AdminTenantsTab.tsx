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
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { User, SubscriptionPlan } from '../../types';

interface TenantItem {
  id?: string;
  user: User;
  profile?: any;
  ownerProfile?: any;
  stationCount: number;
  stationsCount?: number;
  stations?: any[];
  subscription?: any;
  plan?: SubscriptionPlan;
}

interface AdminTenantsTabProps {
  tenants: TenantItem[];
  plans: SubscriptionPlan[];
  onRefresh: () => void;
}

export function AdminTenantsTab({ tenants, plans, onRefresh }: AdminTenantsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningTenant, setAssigningTenant] = useState<TenantItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [viewingStationsTenant, setViewingStationsTenant] = useState<TenantItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleToggleStatus = async (tenantId: string) => {
    setProcessingId(tenantId);
    try {
      const res = await apiFetch(`/api/admin/tenants/${tenantId}/toggle-status`, {
        method: 'POST',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Tenant toggle error', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTenant || !selectedPlanId) return;
    setSaving(true);

    try {
      const userId = assigningTenant.user?.id || assigningTenant.id;
      const res = await apiFetch(`/api/admin/tenants/${userId}/assign-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (res.ok) {
        setAssigningTenant(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Plan assignment error', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const user = t.user || (t as any);
    const name = user?.name || '';
    const email = user?.email || '';
    const org = t.profile?.organizationName || t.ownerProfile?.organizationName || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || org.toLowerCase().includes(q);
  });

  return (
    <div id="admin-tenants-tab" className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              Broadcasters & Radio Owners Directory
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Manage broadcaster tenant profiles, assign custom membership tiers, and toggle station fleet permissions.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            Total Broadcasters: <strong className="text-white">{tenants.length}</strong>
          </div>
        </div>

        <div className="relative max-w-md pt-2">
          <Search className="w-4 h-4 absolute left-3.5 top-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search broadcaster name, email, ministry..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Broadcaster / Ministry</th>
                <th className="py-3.5 px-4">Stations Fleet</th>
                <th className="py-3.5 px-4">Active Subscription Plan</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No broadcaster tenants found matching your query.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant, idx) => {
                  const user = tenant.user || (tenant as any);
                  const userId = user.id || tenant.id;
                  const profile = tenant.profile || tenant.ownerProfile;
                  const stationCount = tenant.stationCount || tenant.stationsCount || (tenant.stations?.length || 0);
                  const plan = tenant.plan || (tenant.subscription ? plans.find((p) => p.id === tenant.subscription.planId) : null);
                  const isActive = user.status === 'ACTIVE';

                  return (
                    <tr key={userId || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {(user.name || 'B').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {user.name}
                              {profile?.organizationName && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({profile.organizationName})
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => setViewingStationsTenant(tenant)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
                        >
                          <Radio className="w-3.5 h-3.5 text-amber-400" />
                          <span>{stationCount} Station(s)</span>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        {plan ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            <Layers className="w-3 h-3" /> {plan.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Free / Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {user.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAssigningTenant(tenant);
                              setSelectedPlanId(plans[0]?.id || '');
                            }}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Assign Subscription Tier"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Assign Plan
                          </button>

                          <button
                            onClick={() => handleToggleStatus(userId)}
                            disabled={processingId === userId}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-slate-800 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-slate-800 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={isActive ? 'Suspend Broadcaster' : 'Activate Broadcaster'}
                          >
                            {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* ASSIGN PLAN MODAL */}
      {assigningTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Assign Broadcaster Package
              </h3>
              <button onClick={() => setAssigningTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Assign package to <strong className="text-white">{assigningTenant.user?.name}</strong> (
              {assigningTenant.user?.email}).
            </p>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Package
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — TZS {Number(p.monthlyPriceTzs || 0).toLocaleString()}/mo (${p.monthlyPriceUsd}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningTenant(null)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20"
                >
                  {saving ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STATIONS MODAL */}
      {viewingStationsTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                Station Fleet ({viewingStationsTenant.user?.name})
              </h3>
              <button onClick={() => setViewingStationsTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {viewingStationsTenant.stations && viewingStationsTenant.stations.length > 0 ? (
                viewingStationsTenant.stations.map((st: any) => (
                  <div key={st.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{st.name}</div>
                      <div className="text-[11px] text-slate-400">{st.city}, {st.countryCode}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {st.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No stations created under this account yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingStationsTenant(null)}
                className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
