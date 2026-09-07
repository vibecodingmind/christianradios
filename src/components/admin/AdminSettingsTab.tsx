import React, { useState, useEffect, useRef } from 'react';
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
  Coins,
  Mail,
  MessageSquare,
  Server,
  Eye,
  EyeOff,
  ExternalLink,
  Database,
  Cpu,
  Send,
  Volume2,
  Play,
  Square,
  Upload,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { PlatformSettings } from '../../types';

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<
    'gateways' | 'ai' | 'email' | 'whatsapp' | 'radio' | 'giving' | 'social' | 'security' | 'general' | 'audioIdent'
  >('gateways');
  const [gatewayTesting, setGatewayTesting] = useState<string | null>(null);
  const [gatewayTestResult, setGatewayTestResult] = useState<{
    gateway: string;
    status: string;
    message: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadSuccess, setAudioUploadSuccess] = useState('');
  const [audioPreviewError, setAudioPreviewError] = useState('');
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSecret = (key: string) => {
    setShowSecret((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg('Audio file exceeds maximum 12MB limit.');
      return;
    }

    setAudioUploading(true);
    setErrorMsg('');
    setAudioUploadSuccess('');
    setAudioPreviewError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await apiFetch('/api/admin/settings/upload-ident', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData, fileName: file.name }),
          });

          if (res.ok) {
            const data = await res.json();
            updateSetting('audioIdentUrl', data.audioUrl);
            setAudioUploadSuccess(`Audio "${file.name}" uploaded successfully!`);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('cr:config_updated', {
                  detail: { audioIdent: { url: data.audioUrl } },
                })
              );
            }
            setTimeout(() => setAudioUploadSuccess(''), 6000);
          } else {
            const err = await res.json();
            setErrorMsg(err.error || 'Failed to upload audio file.');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Error processing audio file upload.');
        } finally {
          setAudioUploading(false);
          if (audioFileInputRef.current) audioFileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read selected audio file.');
        setAudioUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error initiating file upload.');
      setAudioUploading(false);
    }
  };

  const toggleTestAudio = () => {
    setAudioPreviewError('');
    if (testAudioPlaying) {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setTestAudioPlaying(false);
    } else {
      let url = (settings?.audioIdentUrl || '').trim() || '/audio/christianradios_ident.mp3';
      let playUrl = url;

      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const parsed = new URL(url);
          if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
            playUrl = `/api/public/stream-proxy?url=${encodeURIComponent(url)}`;
          }
        } catch {}
      }

      if (!testAudioRef.current) {
        testAudioRef.current = new Audio();
      }
      const audio = testAudioRef.current;
      audio.onerror = () => {
        console.warn('Audio preview failed on URL:', playUrl);
        setAudioPreviewError('Could not play audio from this URL (Remote server returned an error or blocked hotlinking). Try uploading the MP3 directly using the button below.');
        setTestAudioPlaying(false);
      };
      audio.onended = () => {
        setTestAudioPlaying(false);
      };
      audio.src = playUrl;
      audio.currentTime = 0;
      audio.play().then(() => {
        setTestAudioPlaying(true);
      }).catch((err) => {
        console.warn('Preview play notice:', err);
        setAudioPreviewError('Audio playback was blocked or failed to load from this link. Please upload the file directly.');
        setTestAudioPlaying(false);
      });

      if (typeof window !== 'undefined' && 'speechSynthesis' in window && !url.toLowerCase().includes('.mp3')) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(
            settings?.audioIdentCustomText || "You're listening to Christian Radios. One World. One Faith. Thousands of Voices."
          );
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch {}
      }

      const dur = (settings?.audioIdentDurationSeconds || 4) * 1000;
      setTimeout(() => {
        setTestAudioPlaying(false);
      }, dur);
    }
  };

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cr:config_updated', {
              detail: { audioIdent: data.settings },
            })
          );
        }
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

  const testApi = async (apiName: string) => {
    setGatewayTesting(apiName);
    setGatewayTestResult(null);
    try {
      const res = await apiFetch('/api/admin/settings/test-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: apiName }),
      });
      if (res.ok) {
        const data = await res.json();
        setGatewayTestResult(data);
      } else {
        setGatewayTestResult({
          gateway: apiName.toUpperCase(),
          status: 'ERROR',
          message: 'Failed to test API endpoint.',
        });
      }
    } catch (err: any) {
      setGatewayTestResult({
        gateway: apiName.toUpperCase(),
        status: 'ERROR',
        message: err.message || 'Connection failed during API test',
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'gateways'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          Payment Gateways
        </button>

        <button
          id="nav-sub-ai"
          onClick={() => setActiveSubSection('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'ai'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          AI & Gemini API
        </button>

        <button
          id="nav-sub-email"
          onClick={() => setActiveSubSection('email')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'email'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-purple-400" />
          Email & Resend / SMTP
        </button>

        <button
          id="nav-sub-whatsapp"
          onClick={() => setActiveSubSection('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'whatsapp'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          WhatsApp Gateway API
        </button>

        <button
          id="nav-sub-radio"
          onClick={() => setActiveSubSection('radio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'radio'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400" />
          Radio Directory APIs
        </button>

        <button
          id="nav-sub-social"
          onClick={() => setActiveSubSection('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'social'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4 text-blue-400" />
          Social Logins & OAuth
        </button>

        <button
          id="nav-sub-security"
          onClick={() => setActiveSubSection('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'security'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Security & SSRF Firewall
        </button>

        <button
          id="nav-sub-general"
          onClick={() => setActiveSubSection('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'general'
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-slate-300" />
          Branding & URLs
        </button>

        <button
          id="nav-sub-audio-ident"
          onClick={() => setActiveSubSection('audioIdent')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeSubSection === 'audioIdent'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          Pre-Listen Audio Ident
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
                  onClick={() => testApi('pesapal')}
                  disabled={gatewayTesting === 'pesapal'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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

          {/* 2. PayPal Gateway */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PayPal International (PayPal Wallet & Recurring)</h3>
                  <p className="text-xs text-slate-400">
                    Express Checkout and recurring subscriptions via PayPal account balance or linked debit cards.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testApi('paypal')}
                  disabled={gatewayTesting === 'paypal'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {gatewayTesting === 'paypal' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  Test Connection
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paypalEnabled ?? true}
                    onChange={(e) => updateSetting('paypalEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Environment Mode
                </label>
                <select
                  value={settings.paypalEnv || 'sandbox'}
                  onChange={(e) => updateSetting('paypalEnv', e.target.value as 'sandbox' | 'live')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="sandbox">Sandbox (Testing / Developer Account)</option>
                  <option value="live">Live Production (Real transactions)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PayPal Client ID
                </label>
                <input
                  type="text"
                  value={settings.paypalClientId || ''}
                  onChange={(e) => updateSetting('paypalClientId', e.target.value)}
                  placeholder="client_id_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PayPal Client Secret
                </label>
                <input
                  type="password"
                  value={settings.paypalClientSecret || ''}
                  onChange={(e) => updateSetting('paypalClientSecret', e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Stripe Gateway */}
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
                  onClick={() => testApi('stripe')}
                  disabled={gatewayTesting === 'stripe'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Platform Base Currency</label>
                <select
                  value={settings.defaultCurrency || 'USD'}
                  onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                >
                  <option value="USD">USD ($) - US Dollar (Platform Base)</option>
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

            {/* Referral & Commission Rules */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-sky-400" />
                  Referral & Commission Program Rules
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure commission percentages awarded to broadcasters and listeners when their invited users subscribe.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Broadcaster Referral Commission (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={settings.referralCommissionOwnerPercentage ?? 10}
                    onChange={(e) => updateSetting('referralCommissionOwnerPercentage', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500">Awarded on owner plan upgrades</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Listener Referral Commission (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={settings.referralCommissionListenerPercentage ?? 10}
                    onChange={(e) => updateSetting('referralCommissionListenerPercentage', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500">Awarded on premium radio subscriptions</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Attribution Window (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.referralAttributionWindowDays ?? 30}
                    onChange={(e) => updateSetting('referralAttributionWindowDays', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500">Referral cookie / tracking duration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AI DISCOVERY ENGINE */}
      {activeSubSection === 'ai' && (
        <div id="section-ai" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini AI Intelligence Engine</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage AI feature toggles, Google Gemini API Key, models, rate limits, and custom chaplain instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testApi('gemini')}
                  disabled={gatewayTesting === 'gemini'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {gatewayTesting === 'gemini' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  Test Gemini API
                </button>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-cyan-300">
                    Google Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Get Key from Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showSecret['gemini'] ? 'text' : 'password'}
                    value={settings.aiApiKey || ''}
                    onChange={(e) => updateSetting('aiApiKey', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('gemini')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSecret['gemini'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Once saved, this key takes effect immediately across all listener queries and searches.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model Selection</label>
                <select
                  value={settings.aiModel || 'gemini-2.5-flash'}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Fast & High Throughput)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Theological & Complex Reasoning)</option>
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

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  AI Spiritual Guide Custom Prompt Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={settings.systemPromptOverride || ''}
                  onChange={(e) => updateSetting('systemPromptOverride', e.target.value)}
                  placeholder="You are a gracious, compassionate Christian chaplain guiding listeners to gospel stations, uplifting worship, and biblical scriptures..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500 font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: EMAIL SERVICE (RESEND & SMTP) */}
      {activeSubSection === 'email' && (
        <div id="section-email" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transactional Email Delivery (Resend / SMTP)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Dispatches 6-digit login verification codes, 1-click magic links, password resets, and payout alerts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => testApi('email')}
                disabled={gatewayTesting === 'email'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {gatewayTesting === 'email' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-purple-400" />
                )}
                Test Email Dispatch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Delivery Provider</label>
                <select
                  value={settings.emailProvider || 'RESEND'}
                  onChange={(e) => updateSetting('emailProvider', e.target.value as 'RESEND' | 'SMTP' | 'SIMULATOR')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500"
                >
                  <option value="RESEND">Resend.com API (Recommended: Instant & 99.9% Inbox Delivery)</option>
                  <option value="SMTP">Custom SMTP Server (Office 365, Google Workspace, Self-Hosted)</option>
                  <option value="SIMULATOR">Local Development Simulator (Console Logs Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Address & Sender Name</label>
                <input
                  type="text"
                  value={settings.emailFrom || 'Christian Radios <auth@christianradios.org>'}
                  onChange={(e) => updateSetting('emailFrom', e.target.value)}
                  placeholder="Christian Radios <auth@christianradios.org>"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              {/* Resend Section */}
              <div className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" /> Resend API Key
                  </span>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Get API Key from Resend.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showSecret['resend'] ? 'text' : 'password'}
                    value={settings.resendApiKey || ''}
                    onChange={(e) => updateSetting('resendApiKey', e.target.value)}
                    placeholder="re_123456789..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono pr-10 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('resend')}
                    className="absolute right-3 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSecret['resend'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SMTP Section */}
              <div className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> Custom SMTP Server Parameters (For SMTP Provider)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.smtpHost || ''}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.mailgun.org"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Port</label>
                    <input
                      type="number"
                      value={settings.smtpPort || 587}
                      onChange={(e) => updateSetting('smtpPort', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={settings.smtpSecure ?? false}
                        onChange={(e) => updateSetting('smtpSecure', e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-purple-600"
                      />
                      SSL / TLS
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">SMTP Username</label>
                    <input
                      type="text"
                      value={settings.smtpUser || ''}
                      onChange={(e) => updateSetting('smtpUser', e.target.value)}
                      placeholder="postmaster@domain.org"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.smtpPass || ''}
                      onChange={(e) => updateSetting('smtpPass', e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WHATSAPP GATEWAY API */}
      {activeSubSection === 'whatsapp' && (
        <div id="section-whatsapp" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">WhatsApp Studio Gateway & Cloud API</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect listener WhatsApp song requests, prayer petitions, and on-air shout-outs directly to broadcaster consoles.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testApi('whatsapp')}
                  disabled={gatewayTesting === 'whatsapp'}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {gatewayTesting === 'whatsapp' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  Test WhatsApp API
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.whatsappGatewayEnabled ?? true}
                    onChange={(e) => updateSetting('whatsappGatewayEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Gateway API URL</label>
                <input
                  type="text"
                  value={settings.whatsappApiUrl || 'https://graph.facebook.com/v19.0'}
                  onChange={(e) => updateSetting('whatsappApiUrl', e.target.value)}
                  placeholder="https://graph.facebook.com/v19.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meta Phone Number ID</label>
                <input
                  type="text"
                  value={settings.whatsappPhoneNumberId || ''}
                  onChange={(e) => updateSetting('whatsappPhoneNumberId', e.target.value)}
                  placeholder="e.g. 109823719283719"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meta Cloud API Permanent Access Token</label>
                <div className="relative">
                  <input
                    type={showSecret['wa'] ? 'text' : 'password'}
                    value={settings.whatsappAccessToken || ''}
                    onChange={(e) => updateSetting('whatsappAccessToken', e.target.value)}
                    placeholder="EAAG..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('wa')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSecret['wa'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Webhook Verify Token</label>
                <input
                  type="text"
                  value={settings.whatsappVerifyToken || 'christian_radios_wa_webhook_token'}
                  onChange={(e) => updateSetting('whatsappVerifyToken', e.target.value)}
                  placeholder="christian_radios_wa_webhook_token"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Station WhatsApp Hotline</label>
                <input
                  type="text"
                  value={settings.whatsappDefaultNumber || '+255700000000'}
                  onChange={(e) => updateSetting('whatsappDefaultNumber', e.target.value)}
                  placeholder="+255 700 000 000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format: International E.164 with country code (e.g. +255 712 345 678). Used for station click-to-chat links.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: RADIO DIRECTORY APIS */}
      {activeSubSection === 'radio' && (
        <div id="section-radio" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Radio Directory & Streaming Mirror APIs</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect to the global Radio-Browser API mirrors for automated metadata imports and station stream updates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => testApi('radio-browser')}
                disabled={gatewayTesting === 'radio-browser'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {gatewayTesting === 'radio-browser' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                )}
                Test Directory API
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Radio-Browser API Mirror URL</label>
                <select
                  value={settings.radioBrowserApiUrl || 'https://de1.api.radio-browser.info'}
                  onChange={(e) => updateSetting('radioBrowserApiUrl', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                >
                  <option value="https://de1.api.radio-browser.info">Germany Mirror (https://de1.api.radio-browser.info)</option>
                  <option value="https://nl1.api.radio-browser.info">Netherlands Mirror (https://nl1.api.radio-browser.info)</option>
                  <option value="https://at1.api.radio-browser.info">Austria Mirror (https://at1.api.radio-browser.info)</option>
                  <option value="https://all.api.radio-browser.info">Global Load-Balanced (https://all.api.radio-browser.info)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Auto-Sync Streams Interval (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={settings.autoSyncStreamsIntervalHours || 6}
                  onChange={(e) => updateSetting('autoSyncStreamsIntervalHours', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stream Health Probe Interval (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.streamCheckIntervalMinutes || 5}
                  onChange={(e) => updateSetting('streamCheckIntervalMinutes', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stream Socket Probe Timeout (Seconds)</label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={settings.streamTimeoutSeconds || 8}
                  onChange={(e) => updateSetting('streamTimeoutSeconds', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: PRE-LISTEN AUDIO IDENT / SONIC BRANDING */}
      {activeSubSection === 'audioIdent' && (
        <div id="section-audio-ident" className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Pre-Listen Audio Ident & Sonic Branding
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Broadcasting Ident
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure the platform audio ident that plays before listeners connect to live radio streams.
                  </p>
                </div>
              </div>

              {/* Audio Test / Preview Button */}
              <button
                type="button"
                onClick={toggleTestAudio}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  testAudioPlaying
                    ? 'bg-rose-500 hover:bg-rose-400 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {testAudioPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Preview Sonic Ident</span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Preview Error Alert */}
            {audioPreviewError && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 shadow-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-300">Audio Preview Failed</p>
                  <p className="text-[11px] text-rose-200/90 mt-0.5">{audioPreviewError}</p>
                </div>
              </div>
            )}

            {/* Audio Upload Success Alert */}
            {audioUploadSuccess && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 shadow-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{audioUploadSuccess}</span>
              </div>
            )}

            {/* Toggle Switch: Enable / Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <h4 className="text-sm font-semibold text-white">Enable Pre-Listen Audio Ident</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  When active, listeners hear a quick, memorable branding intro before the live radio station connects.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.audioIdentEnabled ?? true}
                  onChange={(e) => updateSetting('audioIdentEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Frequency Capping */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Playback Frequency (Retention & UX Protection)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => updateSetting('audioIdentFrequency', 'ONCE_PER_SESSION')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    (settings.audioIdentFrequency || 'ONCE_PER_SESSION') === 'ONCE_PER_SESSION'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">Once Per Session</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Plays once on the user's first station play. Subsequent station flips connect immediately with zero wait.
                  </p>
                </div>

                <div
                  onClick={() => updateSetting('audioIdentFrequency', 'HOURLY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.audioIdentFrequency === 'HOURLY'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">Once Every Hour</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Plays on the first play, then again if the listener tunes into a new station after 60 minutes.
                  </p>
                </div>

                <div
                  onClick={() => updateSetting('audioIdentFrequency', 'EVERY_PLAY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.audioIdentFrequency === 'EVERY_PLAY'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">Every Station Play</span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                      Always Plays
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Plays before connecting to any radio station every single time the listener clicks Play.
                  </p>
                </div>
              </div>
            </div>

            {/* Audio URL & Direct File Upload */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Audio File Source (MP3 / WAV / AAC)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={audioFileInputRef}
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                    className="hidden"
                    onChange={handleAudioFileUpload}
                  />
                  <button
                    type="button"
                    disabled={audioUploading}
                    onClick={() => audioFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {audioUploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {audioUploading ? 'Uploading Audio File...' : 'Upload Audio File from Device'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <input
                    type="text"
                    placeholder="/audio/christianradios_ident.mp3"
                    value={settings.audioIdentUrl || ''}
                    onChange={(e) => updateSetting('audioIdentUrl', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => updateSetting('audioIdentUrl', '/audio/christianradios_ident.mp3')}
                      className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 hover:border-amber-500/30 cursor-pointer font-medium"
                    >
                      Studio Voiceover (MP3)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('audioIdentUrl', '/audio/christianradios_ident.wav')}
                      className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer font-medium"
                    >
                      Celestial Chime (WAV)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={settings.audioIdentDurationSeconds || 4}
                    onChange={(e) => updateSetting('audioIdentDurationSeconds', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auto-transitions when audio finishes.
                  </p>
                </div>
              </div>
            </div>

            {/* Listener Skip Permission */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <h4 className="text-sm font-semibold text-white">Allow Listeners to Skip</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Displays a sleek "Skip to Live ›" button on the player so listeners can jump straight to the live broadcast if they wish.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.audioIdentSkipAllowed ?? true}
                  onChange={(e) => updateSetting('audioIdentSkipAllowed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Custom Voiceover Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Spoken Ident Phrase (Voiceover / Tagline)
              </label>
              <textarea
                rows={2}
                value={settings.audioIdentCustomText || "You're listening to ChristianRadios.org. One World. One Faith. Thousands of Voices."}
                onChange={(e) => updateSetting('audioIdentCustomText', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 resize-none font-medium"
                placeholder="You're listening to ChristianRadios.org. One World. One Faith. Thousands of Voices."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Spoken warmly by browser speech synthesis when using the built-in chime, or displayed as the on-air tagline during custom audio playback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
