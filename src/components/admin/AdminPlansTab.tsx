import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Radio,
  Clock,
  Sparkles,
  ShieldAlert,
  X,
  Check,
  Save,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { SubscriptionPlan } from '../../types';

const PRESET_PACKAGE_FEATURES = [
  {
    category: '📻 Station Capacity',
    items: [
      '1 Radio Station listing',
      'Up to 3 Radio Stations',
      'Up to 10 Radio Stations',
      'Unlimited Radio Stations',
    ],
  },
  {
    category: '🎵 Audio & Stream Failover',
    items: [
      '24/7 Live Stream Player (up to 128kbps)',
      'HD Audio Stream & Backup Stream URL',
      'Multi-Region Backup Stream Failover',
    ],
  },
  {
    category: '🤲 Giving & Monetization',
    items: [
      'Sow a Seed & Donation System',
      'Listener Premium Subscriptions Gating',
      'Unlimited Giving & Crowdfunding (0% fee)',
    ],
  },
  {
    category: '⭐ Badges & Directory Spotlight',
    items: [
      'Verified Broadcaster Badge',
      '1 Free Featured Directory Badge (3 days/mo)',
      '3 Free Featured Directory Badges (7 days/mo)',
      'Highest Priority Directory & Homepage Spotlight',
    ],
  },
  {
    category: '📣 Community & Live Feed',
    items: [
      'Up to 3 Pinned Announcements in Live Feed',
      'Unlimited Pinned Announcements in Live Feed',
    ],
  },
  {
    category: '📊 Analytics & Export',
    items: [
      '7 days analytics history',
      '90 days analytics & CSV report exports',
      '365 days full enterprise analytics & telemetry',
    ],
  },
  {
    category: '⏱️ Health SLA & Support',
    items: [
      'Basic 60-Min Stream Uptime Monitoring',
      '15-min stream health checks',
      '5-min stream health checks & instant alerts',
      'Priority email support (24h turnaround)',
      'Dedicated Account Manager & 24/7 Priority Support',
    ],
  },
];

interface AdminPlansTabProps {
  plans: SubscriptionPlan[];
  onRefresh: () => void;
}

export function AdminPlansTab({ plans, onRefresh }: AdminPlansTabProps) {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Blank default template for new plan
  const defaultNewPlan: SubscriptionPlan = {
    id: '',
    name: '',
    tier: 'PRO',
    description: '',
    monthlyPriceTzs: 25000,
    annualPriceTzs: 250000,
    monthlyPriceUsd: 10,
    annualPriceUsd: 100,
    currency: 'TZS',
    maxStations: 10,
    featuredMonthlyQuota: 3,
    maxActiveFeatured: 2,
    donationCampaignLimit: 10,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 90,
    advancedAnalyticsEnabled: true,
    multiStationAnalyticsEnabled: true,
    exportsEnabled: true,
    advancedBrandingEnabled: true,
    prioritySupport: true,
    featuredPlacementPriority: 'HIGH',
    featuresList: [
      'Up to 10 Radio Stations',
      '3 Featured Campaigns per month',
      'Giving & Donation system',
      '90 days advanced analytics',
    ],
    isActive: true,
  };

  const [formData, setFormData] = useState<SubscriptionPlan>(defaultNewPlan);

  const startCreate = () => {
    setFormData({
      ...defaultNewPlan,
      id: `plan_${Date.now()}`,
    });
    setIsCreating(true);
    setEditingPlan(null);
    setErrorMsg('');
  };

  const startEdit = (plan: SubscriptionPlan) => {
    setFormData({ ...plan });
    setEditingPlan(plan);
    setIsCreating(false);
    setErrorMsg('');
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (isCreating) {
        const res = await apiFetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create plan');
        }
      } else if (editingPlan) {
        const res = await apiFetch(`/api/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update plan');
        }
      }

      setIsCreating(false);
      setEditingPlan(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving subscription package');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlan = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/plans/${id}/toggle`, {
        method: 'POST',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error', err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setDeletingId(null);
    }
  };

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    const current = formData.featuresList || formData.features || [];
    setFormData({
      ...formData,
      featuresList: [...current, newFeatureText.trim()],
    });
    setNewFeatureText('');
  };

  const togglePresetFeature = (featureItem: string) => {
    const current = [...(formData.featuresList || formData.features || [])];
    const existsIndex = current.findIndex(
      (f) => f.toLowerCase().trim() === featureItem.toLowerCase().trim()
    );
    if (existsIndex >= 0) {
      current.splice(existsIndex, 1);
    } else {
      current.push(featureItem);
    }
    setFormData({ ...formData, featuresList: current });
  };

  const removeFeature = (index: number) => {
    const current = [...(formData.featuresList || formData.features || [])];
    current.splice(index, 1);
    setFormData({ ...formData, featuresList: current });
  };

  return (
    <div id="admin-plans-tab" className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Broadcaster Subscription Packages
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, and price membership tiers for station owners (USD Currency Billing).
          </p>
        </div>

        <button
          id="btn-create-new-plan"
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Package
        </button>
      </div>

      {/* Grid of Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
              plan.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
            }`}
          >
            {/* Status & Actions Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    plan.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {plan.isActive ? 'Active Plan' : 'Archived / Hidden'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(plan)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    title="Edit Package"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePlan(plan.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      plan.isActive
                        ? 'bg-slate-800 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-slate-800 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                    title={plan.isActive ? 'Deactivate / Hide' : 'Activate'}
                  >
                    {plan.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deletingId === plan.id}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete Package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-black text-white">{plan.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.description}</p>

              {/* Pricing Blocks */}
              <div className="my-5 p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Monthly:</span>
                  <span className="text-base font-bold text-amber-400">
                    ${Number(plan.monthlyPriceUsd || 0).toLocaleString()} / mo
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-2">
                  <span className="text-xs text-slate-400">Annual:</span>
                  <span className="text-sm font-semibold text-slate-200">
                    ${Number(plan.annualPriceUsd || 0).toLocaleString()} / yr
                  </span>
                </div>
              </div>

              {/* Technical Limits */}
              <div className="space-y-2 text-xs text-slate-300 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" /> Max Stations:
                  </span>
                  <span className="font-semibold text-white">{plan.maxStations} Station(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Analytics Retention:
                  </span>
                  <span className="font-semibold text-white">{plan.analyticsRetentionDays || 7} Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Featured Quota:
                  </span>
                  <span className="font-semibold text-white">{plan.featuredMonthlyQuota || 0} / Mo</span>
                </div>
              </div>

              {/* Bullet Features */}
              <div className="border-t border-slate-800/80 pt-4 space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Included Capabilities:
                </span>
                {(plan.featuresList || plan.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>ID: {plan.id}</span>
              <span>{plan.givingEnabled ? '✓ Giving On' : '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  {isCreating ? 'Create Subscription Package' : `Edit Package: ${editingPlan?.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto space-y-6 flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Broadcaster Pro Tier"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Summary Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description of target ministries and key highlights..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* USD Pricing */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Package Pricing (USD $)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Monthly Rate (USD $)</label>
                    <input
                      type="number"
                      value={formData.monthlyPriceUsd}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyPriceUsd: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Annual Rate (USD $)</label>
                    <input
                      type="number"
                      value={formData.annualPriceUsd}
                      onChange={(e) =>
                        setFormData({ ...formData, annualPriceUsd: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Station Limits & Health Monitoring */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Plan Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tier: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="FREE">FREE STARTER</option>
                    <option value="PRO">PRO MINISTRY</option>
                    <option value="VIP">KINGDOM NETWORK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Stations
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStations}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStations: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Featured Quota/Mo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.featuredMonthlyQuota}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        featuredMonthlyQuota: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Analytics Retention
                  </label>
                  <select
                    value={formData.analyticsRetentionDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        analyticsRetentionDays: parseInt(e.target.value, 10) || 7,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value={7}>7 Days (Free)</option>
                    <option value={30}>30 Days (Basic)</option>
                    <option value={90}>90 Days (Pro)</option>
                    <option value={365}>365 Days (VIP)</option>
                  </select>
                </div>
              </div>

              {/* Preset Capabilities Selector Checkboxes */}
              <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Select Platform Features (Preset Checklist)
                  </span>
                  <span className="text-[11px] text-slate-400">Click checkboxes to include/exclude features</span>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {PRESET_PACKAGE_FEATURES.map((group) => (
                    <div key={group.category} className="space-y-1.5">
                      <h5 className="text-[11px] font-bold text-sky-400">{group.category}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.items.map((item) => {
                          const currentList = formData.featuresList || formData.features || [];
                          const isSelected = currentList.some(
                            (f) => f.toLowerCase().trim() === item.toLowerCase().trim()
                          );
                          return (
                            <label
                              key={item}
                              onClick={(e) => {
                                e.preventDefault();
                                togglePresetFeature(item);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 font-semibold shadow-sm'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-3.5 h-3.5 rounded text-sky-500 focus:ring-0"
                              />
                              <span className="truncate">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Tags & Bullets */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Feature Highlights List
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="Type feature bullet and press Add..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(formData.featuresList || formData.features || []).map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.donationButtonEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, donationButtonEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  Enable Station Listener Donations
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.priorityDirectoryListing}
                    onChange={(e) =>
                      setFormData({ ...formData, priorityDirectoryListing: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  Priority Search Directory Placement
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
