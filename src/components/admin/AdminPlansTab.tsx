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
    description: '',
    monthlyPriceTzs: 25000,
    annualPriceTzs: 250000,
    monthlyPriceUsd: 10,
    annualPriceUsd: 100,
    maxStations: 1,
    maxBitrateKbps: 128,
    maxMonthlyBandwidthGb: 100,
    streamMonitoringIntervalMinutes: 5,
    analyticsTier: 'BASIC',
    customDomainSupported: false,
    whiteLabelPlayer: false,
    priorityDirectoryListing: false,
    donationButtonEnabled: true,
    podcastUploadLimitMb: 500,
    features: [
      '24/7 Stream Uptime Health Checks',
      'Direct Listener Donation Integration',
      'HLS & MP3 Universal Stream Support',
      'Mobile App & Web Directory Listing',
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
    setFormData({
      ...formData,
      features: [...(formData.features || []), newFeatureText.trim()],
    });
    setNewFeatureText('');
  };

  const removeFeature = (index: number) => {
    const updated = [...(formData.features || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, features: updated });
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
            Create, edit, and price membership tiers for station owners (TZS & USD dual-currency billing).
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
                  <div className="text-right">
                    <span className="text-base font-bold text-amber-400">
                      TZS {Number(plan.monthlyPriceTzs || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5">(${plan.monthlyPriceUsd || 0})</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-2">
                  <span className="text-xs text-slate-400">Annual:</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-200">
                      TZS {Number(plan.annualPriceTzs || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5">(${plan.annualPriceUsd || 0})</span>
                  </div>
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
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Stream Check Interval:
                  </span>
                  <span className="font-semibold text-white">Every {plan.streamMonitoringIntervalMinutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Analytics Tier:
                  </span>
                  <span className="font-semibold text-white">{plan.analyticsTier}</span>
                </div>
              </div>

              {/* Bullet Features */}
              <div className="border-t border-slate-800/80 pt-4 space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Included Capabilities:
                </span>
                {(plan.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>ID: {plan.id}</span>
              <span>{plan.donationButtonEnabled ? '✓ Donations On' : '—'}</span>
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

              {/* Dual-Currency Pricing */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Pricing Matrix (TZS & USD)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Monthly (TZS)</label>
                    <input
                      type="number"
                      value={formData.monthlyPriceTzs}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyPriceTzs: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Annual (TZS)</label>
                    <input
                      type="number"
                      value={formData.annualPriceTzs}
                      onChange={(e) =>
                        setFormData({ ...formData, annualPriceTzs: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Monthly (USD)</label>
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
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Annual (USD)</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Radio Stations
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStations}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStations: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Health Check Frequency
                  </label>
                  <select
                    value={formData.streamMonitoringIntervalMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        streamMonitoringIntervalMinutes: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value={1}>Every 1 Minute (Live)</option>
                    <option value={3}>Every 3 Minutes</option>
                    <option value={5}>Every 5 Minutes</option>
                    <option value={15}>Every 15 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Analytics Tier
                  </label>
                  <select
                    value={formData.analyticsTier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        analyticsTier: e.target.value as 'BASIC' | 'ADVANCED' | 'ENTERPRISE',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="BASIC">Basic Metrics</option>
                    <option value="ADVANCED">Advanced Analytics</option>
                    <option value="ENTERPRISE">Enterprise Real-Time</option>
                  </select>
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
                  {(formData.features || []).map((f, i) => (
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
