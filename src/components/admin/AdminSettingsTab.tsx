import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Key,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Building2,
  Radio,
  RefreshCw,
  Sliders,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { PlatformSettings } from '../../types';

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<'gateways' | 'security' | 'social' | 'general' | 'ai'>('gateways');
  const [gatewayTesting, setGatewayTesting] = useState<'pesapal' | 'stripe' | null>(null);
  const [gatewayTestResult, setGatewayTestResult] = useState<{
    gateway: string;
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update settings');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const testGateway = async (gateway: 'pesapal' | 'stripe') => {
    setGatewayTesting(gateway);
    setGatewayTestResult(null);
    try {
      const res = await apiFetch('/api/admin/settings/test-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway }),
      });
      if (res.ok) {
        const data = await res.json();
        setGatewayTestResult(data);
      } else {
        setGatewayTestResult({
          gateway: gateway.toUpperCase(),
          status: 'ERROR',
          message: 'Failed to test gateway endpoint.',
        });
      }
    } catch (err: any) {
      setGatewayTestResult({
        gateway: gateway.toUpperCase(),
        status: 'ERROR',
        message: err.message || 'Connection failed during gateway test',
      });
    } finally {
      setGatewayTesting(null);
    }
  };

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  if (loading) {
    return (
      <div id="admin-settings-loading" className="flex items-center justify-center p-16 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mr-3" />
        <span className="text-base font-medium">Loading platform configurations...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div id="admin-settings-error" className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 font-semibold mb-3">Unable to retrieve system configuration.</p>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div id="admin-settings-tab" className="space-y-6">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-400" />
            Platform & Engine Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure payment gateways, SSRF and security firewalls, social providers, and broadcast parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-950/60 border border-red-500/30 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          <button
            id="admin-save-settings-btn"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          id="nav-sub-gateways"
          onClick={() => setActiveSubSection('gateways')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeSubSection === 'gateways'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Gateways & Mobile Money
        </button>

        <button
          id="nav-sub-security"
          onClick={() => setActiveSubSection('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeSubSection === 'security'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Security, SSRF & Rate Limiting
        </button>

        <button
          id="nav-sub-social"
          onClick={() => setActiveSubSection('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeSubSection === 'social'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Social Logins & OAuth
        </button>

        <button
          id="nav-sub-general"
          onClick={() => setActiveSubSection('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeSubSection === 'general'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          General, Branding & Notice Banner
        </button>

        <button
          id="nav-sub-ai"
          onClick={() => setActiveSubSection('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeSubSection === 'ai'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          AI Radio Guide & Engine Controls
        </button>
      </div>

      {/* SECTION 1: PAYMENT GATEWAYS */}
      {activeSubSection === 'gateways' && (
        <div id="section-gateways" className="space-y-6">
          {/* Gateway Test Result Callout */}
          {gatewayTestResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                gatewayTestResult.status === 'CONNECTED'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {gatewayTestResult.status === 'CONNECTED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <span className="font-bold mr-2">{gatewayTestResult.gateway}:</span>
                  <span className="text-sm">{gatewayTestResult.message}</span>
                </div>
              </div>
              <button
                onClick={() => setGatewayTestResult(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. PesaPal Gateway */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PesaPal 3.0 (East Africa Multi-Channel)</h3>
                  <p className="text-xs text-slate-400">
                    Direct integration for M-Pesa, Airtel Money, Tigo Pesa, Visa, and Mastercard in TZS/USD.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testGateway('pesapal')}
                  disabled={gatewayTesting === 'pesapal'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {gatewayTesting === 'pesapal' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  Test Connection
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pesapalEnabled}
                    onChange={(e) => updateSetting('pesapalEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Environment Mode
                </label>
                <select
                  value={settings.pesapalEnv}
                  onChange={(e) => updateSetting('pesapalEnv', e.target.value as 'sandbox' | 'live')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="sandbox">Sandbox (Testing / Cybersource Simulator)</option>
                  <option value="live">Live Production (Real transactions)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Consumer Key
                </label>
                <input
                  type="text"
                  value={settings.pesapalConsumerKey || ''}
                  onChange={(e) => updateSetting('pesapalConsumerKey', e.target.value)}
                  placeholder="e.g. q1w2e3r4t5y6..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Consumer Secret
                </label>
                <input
                  type="password"
                  value={settings.pesapalConsumerSecret || ''}
                  onChange={(e) => updateSetting('pesapalConsumerSecret', e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered IPN Notification ID
                </label>
                <input
                  type="text"
                  value={settings.pesapalIpnId || ''}
                  onChange={(e) => updateSetting('pesapalIpnId', e.target.value)}
                  placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Stripe Gateway */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Stripe International (Card & Global Wallets)</h3>
                  <p className="text-xs text-slate-400">
                    Supports global cards (USD, EUR, GBP) for diaspora donations and international subscriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testGateway('stripe')}
                  disabled={gatewayTesting === 'stripe'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {gatewayTesting === 'stripe' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  Test Connection
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stripeEnabled}
                    onChange={(e) => updateSetting('stripeEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={settings.stripePublishableKey || ''}
                  onChange={(e) => updateSetting('stripePublishableKey', e.target.value)}
                  placeholder="pk_test_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={settings.stripeSecretKey || ''}
                  onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                  placeholder="sk_test_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Webhook Signing Secret
                </label>
                <input
                  type="password"
                  value={settings.stripeWebhookSecret || ''}
                  onChange={(e) => updateSetting('stripeWebhookSecret', e.target.value)}
                  placeholder="whsec_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Direct Mobile Money Numbers (Lipa Namba / Paybill) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Mobile Money & Merchant Tills</h3>
                <p className="text-xs text-slate-400">
                  Enable direct USSD/Lipa Namba instructions shown on donation and subscription checkout pages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* M-Pesa */}
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">Vodacom M-Pesa Till / Paybill</span>
                  <input
                    type="checkbox"
                    checked={settings.directMpesaEnabled}
                    onChange={(e) => updateSetting('directMpesaEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                </div>
                <input
                  type="text"
                  value={settings.directMpesaTill || ''}
                  onChange={(e) => updateSetting('directMpesaTill', e.target.value)}
                  placeholder="e.g. Lipa Namba: 5432100"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* Tigo Pesa */}
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-400">Tigo Pesa (Mixx) Lipa Namba</span>
                  <input
                    type="checkbox"
                    checked={settings.directTigoPesaEnabled}
                    onChange={(e) => updateSetting('directTigoPesaEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-0"
                  />
                </div>
                <input
                  type="text"
                  value={settings.directTigoPesaTill || ''}
                  onChange={(e) => updateSetting('directTigoPesaTill', e.target.value)}
                  placeholder="e.g. Lipa Namba: 8765432"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* Airtel Money */}
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-red-400">Airtel Money Merchant Till</span>
                  <input
                    type="checkbox"
                    checked={settings.directAirtelMoneyEnabled}
                    onChange={(e) => updateSetting('directAirtelMoneyEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0"
                  />
                </div>
                <input
                  type="text"
                  value={settings.directAirtelMoneyTill || ''}
                  onChange={(e) => updateSetting('directAirtelMoneyTill', e.target.value)}
                  placeholder="e.g. Airtel Till: 334455"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* HaloPesa */}
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-400">HaloPesa Merchant Code</span>
                  <input
                    type="checkbox"
                    checked={settings.directHaloPesaEnabled}
                    onChange={(e) => updateSetting('directHaloPesaEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-0"
                  />
                </div>
                <input
                  type="text"
                  value={settings.directHaloPesaTill || ''}
                  onChange={(e) => updateSetting('directHaloPesaTill', e.target.value)}
                  placeholder="e.g. HaloPesa Till: 998877"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>

            {/* Direct Bank Wire */}
            <div className="pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-slate-200">Direct Bank Wire / SWIFT Instructions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bankTransferEnabled}
                    onChange={(e) => updateSetting('bankTransferEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                </div>
                <textarea
                  rows={3}
                  value={settings.bankTransferInstructions || ''}
                  onChange={(e) => updateSetting('bankTransferInstructions', e.target.value)}
                  placeholder="Bank Name: CRDB / NMB, Account Name: Christian Radios Network, Account No: 0150XXXXXXX, SWIFT: CORUTZTZ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SECURITY & SSRF */}
      {activeSubSection === 'security' && (
        <div id="section-security" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                SSRF Firewall & Broadcast Stream Protection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prevents attackers from probing private internal IPs or cloud metadata servers through radio stream URLs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-white">Stream SSRF Protection Layer</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Blocks loopback (127.0.0.1), link-local, AWS/GCP metadata endpoints (169.254.169.254), and private RFC1918 addresses.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.streamSsrfProtection}
                    onChange={(e) => updateSetting('streamSsrfProtection', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-white">Require Manual Station Approval</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    New station submissions stay in 'PENDING_APPROVAL' until reviewed by a Super Admin or Operations Officer.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.requireStationApproval}
                    onChange={(e) => updateSetting('requireStationApproval', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-white">Global Rate Limiting</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Protects public search, player pings, and prayer walls against DDoS flooding and scraping.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.rateLimitingEnabled}
                    onChange={(e) => updateSetting('rateLimitingEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-white">Enforce 2FA for Admin Portal</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Requires two-factor authentication or one-time passcodes for SUPER_ADMIN logins.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.enforceAdmin2fa}
                    onChange={(e) => updateSetting('enforceAdmin2fa', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stream Monitor Interval (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.streamCheckIntervalMinutes}
                  onChange={(e) => updateSetting('streamCheckIntervalMinutes', parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stream Check Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={settings.streamTimeoutSeconds}
                  onChange={(e) => updateSetting('streamTimeoutSeconds', parseInt(e.target.value, 10) || 8)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Auto-Suspend Offline Station (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.autoSuspendOfflineStationDays}
                  onChange={(e) => updateSetting('autoSuspendOfflineStationDays', parseInt(e.target.value, 10) || 14)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                IP Blocklist (Comma or line separated)
              </label>
              <textarea
                rows={2}
                value={settings.ipBlocklist || ''}
                onChange={(e) => updateSetting('ipBlocklist', e.target.value)}
                placeholder="198.51.100.4, 203.0.113.19"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SOCIAL LOGINS */}
      {activeSubSection === 'social' && (
        <div id="section-social" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Social Login & OAuth Identity Providers
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Allow listeners and radio broadcasters to sign in with Google, Facebook, Apple, or Passwordless Magic Links.
              </p>
            </div>

            {/* Google Auth */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <span className="text-sm font-bold text-white">Google Identity Services</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.googleAuthEnabled}
                    onChange={(e) => updateSetting('googleAuthEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Google Client ID</label>
                  <input
                    type="text"
                    value={settings.googleClientId || ''}
                    onChange={(e) => updateSetting('googleClientId', e.target.value)}
                    placeholder="123456789-xxxxxx.apps.googleusercontent.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Google Client Secret</label>
                  <input
                    type="password"
                    value={settings.googleClientSecret || ''}
                    onChange={(e) => updateSetting('googleClientSecret', e.target.value)}
                    placeholder="GOCSPX-••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Facebook Auth */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    f
                  </div>
                  <span className="text-sm font-bold text-white">Facebook Login SDK</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.facebookAuthEnabled}
                    onChange={(e) => updateSetting('facebookAuthEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Facebook App ID</label>
                <input
                  type="text"
                  value={settings.facebookAppId || ''}
                  onChange={(e) => updateSetting('facebookAppId', e.target.value)}
                  placeholder="e.g. 987654321012345"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Apple Sign-In */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100/20 text-slate-200 flex items-center justify-center font-bold text-xs">
                    
                  </div>
                  <span className="text-sm font-bold text-white">Sign in with Apple</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.appleAuthEnabled}
                    onChange={(e) => updateSetting('appleAuthEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-400"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Apple Service ID</label>
                <input
                  type="text"
                  value={settings.appleServiceId || ''}
                  onChange={(e) => updateSetting('appleServiceId', e.target.value)}
                  placeholder="org.christianradios.web"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Passwordless Magic Links */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-sm font-bold text-white">Passwordless Magic Link Sign-In</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows listeners to request a 1-click authentication token sent to their email.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.passwordlessMagicLinkEnabled}
                  onChange={(e) => updateSetting('passwordlessMagicLinkEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: GENERAL & BRANDING */}
      {activeSubSection === 'general' && (
        <div id="section-general" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                Platform Identity & Announcement Banner
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize network name, support contact channels, default currency, and global emergency notices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Platform Title</label>
                <input
                  type="text"
                  value={settings.platformName || ''}
                  onChange={(e) => updateSetting('platformName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Currency</label>
                <select
                  value={settings.defaultCurrency || 'TZS'}
                  onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                >
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Support & Inquiry Email</label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => updateSetting('supportEmail', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={(e) => updateSetting('contactEmail', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>
            </div>

            {/* Global Notice Banner */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-amber-400">Global Announcement Notice Banner</span>
                  <p className="text-xs text-slate-400">
                    Displays a top banner across all visitor and listener pages for conferences, prayer events, or maintenance.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.bannerNoticeActive}
                    onChange={(e) => updateSetting('bannerNoticeActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <input
                type="text"
                value={settings.bannerNotice || ''}
                onChange={(e) => updateSetting('bannerNotice', e.target.value)}
                placeholder="e.g. Join the 24/7 Global Praise & Fasting stream starting this Friday! 🕊️"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: AI DISCOVERY ENGINE */}
      {activeSubSection === 'ai' && (
        <div id="section-ai" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  AI Discovery Guide & Engine Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage AI feature toggles, model parameters, rate limiting, and system prompt constraints.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeof settings.aiEnabled === 'boolean' ? settings.aiEnabled : true}
                  onChange={(e) => updateSetting('aiEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">AI Provider Engine</label>
                <input
                  type="text"
                  disabled
                  value="Google Gemini (@google/genai)"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-cyan-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model Selection</label>
                <select
                  value={settings.aiModel || 'gemini-2.5-flash'}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Fast & High Throughput)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning & Research)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Anon Rate Limit (Req/Min)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.aiRateLimitAnon || 30}
                  onChange={(e) => updateSetting('aiRateLimitAnon', parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
