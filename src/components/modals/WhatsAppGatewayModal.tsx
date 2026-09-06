import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Copy,
  Check,
  X,
  ExternalLink,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  Phone,
  Send,
  Building2,
  User,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station, WhatsAppSession, WhatsAppAccountType } from '../../types';

interface WhatsAppGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  stations?: Station[];
  onStationUpdated?: (updated: Station) => void;
}

type GatewayTab = 'QR_PAIR' | 'META_CLOUD' | 'TEST_SIMULATOR';

export function WhatsAppGatewayModal({
  isOpen,
  onClose,
  station: initialStation,
  stations = [],
  onStationUpdated,
}: WhatsAppGatewayModalProps) {
  const [selectedStationId, setSelectedStationId] = useState<string>(initialStation.id);
  const currentStation = stations.find((s) => s.id === selectedStationId) || initialStation;

  const [activeTab, setActiveTab] = useState<GatewayTab>('QR_PAIR');
  const [session, setSession] = useState<WhatsAppSession>(
    currentStation.whatsappSession || {
      status: currentStation.whatsappNumber ? 'CONNECTED' : 'DISCONNECTED',
      connectedPhone: currentStation.whatsappNumber,
      accountType: 'STANDARD',
    }
  );

  // QR Pairing states
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [expiresSeconds, setExpiresSeconds] = useState<number>(120);
  const [loadingPairing, setLoadingPairing] = useState(false);
  const [confirmingPhone, setConfirmingPhone] = useState(
    currentStation.whatsappNumber || currentStation.phone || ''
  );
  const [accountType, setAccountType] = useState<WhatsAppAccountType>('STANDARD');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Meta Cloud API states
  const [metaPhoneId, setMetaPhoneId] = useState(currentStation.whatsappSession?.metaPhoneNumberId || '');
  const [metaToken, setMetaToken] = useState(currentStation.whatsappSession?.metaAccessToken || '');
  const [metaVerifyToken, setMetaVerifyToken] = useState(
    currentStation.whatsappSession?.metaVerifyToken || `wa_verify_${currentStation.id.slice(0, 8)}`
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulator states
  const [simSenderName, setSimSenderName] = useState('Sarah Mwangi');
  const [simSenderCity, setSimSenderCity] = useState('Nairobi, Kenya');
  const [simSenderPhone, setSimSenderPhone] = useState('+254 712 345 678');
  const [simAccountType, setSimAccountType] = useState<WhatsAppAccountType>('BUSINESS');
  const [simType, setSimType] = useState<'SONG' | 'SHOUTOUT'>('SONG');
  const [simSongTitle, setSimSongTitle] = useState('Cha Kutumaini Sina');
  const [simArtistName, setSimArtistName] = useState('Traditional Gospel Choir');
  const [simContent, setSimContent] = useState(
    'Praise the Lord studio presenter! Please play this blessed worship song for our choir practice tonight!'
  );
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (isOpen && currentStation) {
      loadSessionStatus();
    }
  }, [isOpen, selectedStationId]);

  // Countdown timer for pairing QR code
  useEffect(() => {
    if (session.status === 'PAIRING' && expiresSeconds > 0) {
      const timer = setInterval(() => {
        setExpiresSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session.status, expiresSeconds]);

  const loadSessionStatus = async () => {
    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/whatsapp/status`);
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        if (data.session.connectedPhone) {
          setConfirmingPhone(data.session.connectedPhone);
        }
        if (data.session.accountType) {
          setAccountType(data.session.accountType);
        }
        if (data.session.qrCode) {
          setQrImageUrl(data.session.qrCode);
        }
      }
    } catch (err) {
      console.error('Failed to load WhatsApp session status:', err);
    }
  };

  const handleStartPairing = async () => {
    setLoadingPairing(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/whatsapp/pair`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setQrImageUrl(data.qrImageUrl);
        setPairingToken(data.pairingToken);
        setExpiresSeconds(120);
      } else {
        setErrorMessage(data.error || 'Could not initialize WhatsApp pairing.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while connecting.');
    } finally {
      setLoadingPairing(false);
    }
  };

  const handleConfirmPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingPhone.trim()) {
      setErrorMessage('Please enter your WhatsApp phone number.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/whatsapp/confirm-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: confirmingPhone.trim(),
          accountType,
          deviceInfo: `${accountType === 'BUSINESS' ? 'WhatsApp Business' : 'Personal WhatsApp'} (Linked Device)`,
          token: pairingToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setSuccessMessage(
          `🎉 Connected! Your ${accountType === 'BUSINESS' ? 'WhatsApp Business' : 'Personal WhatsApp'} number is now live on Studio Desk.`
        );
        if (data.station && onStationUpdated) {
          onStationUpdated(data.station);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to complete pairing.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error confirming scan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to unlink this WhatsApp device from your radio station?')) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/whatsapp/disconnect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setQrImageUrl(null);
        setSuccessMessage('Device unlinked successfully.');
        if (data.station && onStationUpdated) {
          onStationUpdated(data.station);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to unlink device.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error unlinking device.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMetaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/whatsapp/meta-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaPhoneNumberId: metaPhoneId,
          metaAccessToken: metaToken,
          metaVerifyToken: metaVerifyToken,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setSuccessMessage('Meta WhatsApp Cloud API settings saved successfully!');
        if (data.station && onStationUpdated) {
          onStationUpdated(data.station);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save Meta settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving Meta configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/public/stations/${currentStation.id}/bridge/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: simSenderPhone,
          senderName: simSenderName,
          senderCity: simSenderCity,
          body: simType === 'SONG' ? `[SONG REQUEST] ${simSongTitle} by ${simArtistName} - ${simContent}` : simContent,
          messageType: simType === 'SONG' ? 'SONG_REQUEST' : 'SHOUTOUT',
          songTitle: simType === 'SONG' ? simSongTitle : undefined,
          artistName: simType === 'SONG' ? simArtistName : undefined,
          accountType: simAccountType,
          channel: 'WHATSAPP',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          `✅ Test ${simAccountType === 'BUSINESS' ? 'WhatsApp Business' : 'Personal WhatsApp'} message arrived on Studio Desk!`
        );
        setTimeout(() => setSuccessMessage(null), 4500);
      } else {
        setErrorMessage(data.error || 'Simulation failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate incoming message.');
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/api/public/stations/${currentStation.id}/bridge/inbound`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 text-slate-100 shadow-2xl relative space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  WhatsApp Studio Gateway
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  STANDARD & BUSINESS SUPPORT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Link your smartphone via WhatsApp Web QR or connect official Meta Cloud API to stream live listener song requests onto your presenter console.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station Selector if broadcaster has multiple */}
        {stations.length > 1 && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              Active Radio Station:
            </span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.city || st.countryCode})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('QR_PAIR')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'QR_PAIR'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Link Device (QR Code)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('META_CLOUD')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'META_CLOUD'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Meta Cloud API (Enterprise)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TEST_SIMULATOR')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'TEST_SIMULATOR'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Live Test Inbound</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: QR DEVICE PAIRING (STANDARD & BUSINESS WHATSAPP) */}
        {activeTab === 'QR_PAIR' && (
          <div className="space-y-6">
            {/* Condition 1: Device Already Connected */}
            {session.status === 'CONNECTED' ? (
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-3xl p-6 space-y-5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Device Linked & Listening Live</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Incoming listener chats sent to this phone stream directly to your on-air console.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  >
                    <Unlink className="w-4 h-4" />
                    <span>Unlink Device</span>
                  </button>
                </div>

                {/* Connection Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Connected Number</span>
                    <span className="text-sm font-mono font-bold text-white mt-1 block">
                      {session.connectedPhone || currentStation.whatsappNumber || 'Configured'}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">WhatsApp Version</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {session.accountType === 'BUSINESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30">
                          <Building2 className="w-3.5 h-3.5" />
                          WhatsApp Business
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                          <User className="w-3.5 h-3.5" />
                          Personal WhatsApp
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Connection Status</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active / Listening
                    </span>
                  </div>
                </div>

                {/* Live Advice */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
                  <span className="font-bold text-slate-200 block">💡 Broadcaster Pro Tip:</span>
                  <p>
                    When listeners WhatsApp you song requests or testimonies, they appear automatically on your Studio Desk. You can click <strong>"Copy Presenter Cue"</strong> to read their dedication on-air, or click <strong>"Play On-Air"</strong> to notify them their song is playing!
                  </p>
                </div>
              </div>
            ) : (
              /* Condition 2: Not connected yet - Pairing Flow */
              <div className="space-y-6">
                {/* 3 Step Instruction Guide */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    How to Link Your WhatsApp (Standard or Business)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs inline-flex items-center justify-center mr-1.5">1</span>
                      <span className="font-bold text-white">Open WhatsApp</span>
                      <p className="text-slate-400 text-[10px]">
                        Open WhatsApp or WhatsApp Business on your Android or iPhone.
                      </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs inline-flex items-center justify-center mr-1.5">2</span>
                      <span className="font-bold text-white">Tap Linked Devices</span>
                      <p className="text-slate-400 text-[10px]">
                        Tap <strong>Menu (⋮)</strong> on Android or <strong>Settings</strong> on iPhone &gt; <strong>Linked Devices</strong>.
                      </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs inline-flex items-center justify-center mr-1.5">3</span>
                      <span className="font-bold text-white">Scan Screen QR</span>
                      <p className="text-slate-400 text-[10px]">
                        Tap <strong>Link a Device</strong> and point your camera at the QR code below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code Card or Generator Button */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-5">
                  {!qrImageUrl ? (
                    <div className="py-8 space-y-4 max-w-md">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/10">
                        <QrCode className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">Ready to Pair WhatsApp Hotline</h4>
                        <p className="text-xs text-slate-400">
                          Click below to generate a real-time WhatsApp Web pairing token for your radio station.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartPairing}
                        disabled={loadingPairing}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2 mx-auto disabled:opacity-50"
                      >
                        {loadingPairing ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Generating Pairing Token...</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            <span>Generate Pairing QR Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Displaying QR Code */
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <div className="relative p-4 rounded-3xl bg-white shadow-2xl">
                        <img
                          src={qrImageUrl}
                          alt="WhatsApp Linked Device QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow">
                          WA MULTI-DEVICE
                        </div>
                      </div>

                      {/* Expiration & Refresh */}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Expires in: <strong className="text-amber-300">{expiresSeconds}s</strong>
                        </span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleStartPairing}
                          disabled={loadingPairing}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${loadingPairing ? 'animate-spin' : ''}`} />
                          <span>Refresh QR</span>
                        </button>
                      </div>

                      {/* Phone & Account Type Confirmation Form */}
                      <form
                        onSubmit={handleConfirmPairing}
                        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mt-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-white block">
                            Phone Number Being Linked
                          </label>
                          <span className="text-[10px] text-slate-400">With country code</span>
                        </div>

                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={confirmingPhone}
                            onChange={(e) => setConfirmingPhone(e.target.value)}
                            placeholder="e.g. +255 754 123 456"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        {/* Account Type Selector */}
                        <div>
                          <label className="text-xs font-bold text-white block mb-1.5">
                            Account Version on Phone
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAccountType('STANDARD')}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                accountType === 'STANDARD'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Personal WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountType('BUSINESS')}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                accountType === 'BUSINESS'
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              <span>WhatsApp Business</span>
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <>
                              <RotateCw className="w-4 h-4 animate-spin" />
                              <span>Activating Live Connection...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Scan & Connect Device</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: META WHATSAPP CLOUD API (ENTERPRISE) */}
        {activeTab === 'META_CLOUD' && (
          <div className="space-y-5 text-xs">
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-sky-300 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Official Meta WhatsApp Cloud API</span>
                <p className="text-[11px] text-sky-200/80 leading-relaxed">
                  Best for commercial or syndicated radio networks using Meta Developer Portal accounts. Incoming listener chats are received directly via webhook without maintaining a phone battery or browser socket.
                </p>
              </div>
            </div>

            {/* Webhook Endpoint for Meta Developers */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div>
                <span className="font-bold text-white block">1. Callback Webhook URL</span>
                <p className="text-[11px] text-slate-400">
                  Paste this URL into your Meta App Dashboard under <strong>WhatsApp &gt; Configuration &gt; Webhook URL</strong>:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedKey === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'webhook' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Webhook Verify Token */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div>
                <span className="font-bold text-white block">2. Webhook Verify Token</span>
                <p className="text-[11px] text-slate-400">
                  Paste this secret into Meta's <strong>Verify Token</strong> field:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={metaVerifyToken}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(metaVerifyToken, 'token')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'token' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Outbound Dispatch Form */}
            <form onSubmit={handleSaveMetaConfig} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="font-bold text-white block">3. Optional: Meta Credentials for Two-Way Presenter Replies</span>
              <p className="text-[11px] text-slate-400">
                Required only if you want presenters to send automated WhatsApp replies back to listeners directly from the console.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Meta Phone Number ID</label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    placeholder="e.g. 10482910492810"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Permanent System Access Token</label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAABw..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Meta Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: LIVE TEST & SIMULATOR */}
        {activeTab === 'TEST_SIMULATOR' && (
          <form onSubmit={handleSendSimulation} className="space-y-4 text-xs">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-purple-300 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Studio Desk Live Inbound Simulator</span>
                <p className="text-[11px] text-purple-200/80 leading-relaxed">
                  Test your live presenter workflow by simulating an incoming WhatsApp message as either a <strong>Personal WhatsApp</strong> user or a <strong>WhatsApp Business</strong> user.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Sender Name</label>
                <input
                  type="text"
                  required
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Sender Phone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={simSenderPhone}
                  onChange={(e) => setSimSenderPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">WhatsApp App Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimAccountType('STANDARD')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      simAccountType === 'STANDARD'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Personal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAccountType('BUSINESS')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      simAccountType === 'BUSINESS'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Business</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Message Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimType('SONG')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      simType === 'SONG'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🎵 Song Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('SHOUTOUT')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      simType === 'SHOUTOUT'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    📣 Shout-out
                  </button>
                </div>
              </div>
            </div>

            {simType === 'SONG' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Requested Song Title</label>
                  <input
                    type="text"
                    value={simSongTitle}
                    onChange={(e) => setSimSongTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Gospel Artist</label>
                  <input
                    type="text"
                    value={simArtistName}
                    onChange={(e) => setSimArtistName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Message Content</label>
              <textarea
                rows={3}
                required
                value={simContent}
                onChange={(e) => setSimContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={simulating}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Triggering Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Inbound Message to Live Desk</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                session.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {session.status === 'CONNECTED'
                ? `Paired: ${session.connectedPhone || 'Online'}`
                : 'Not Linked'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
