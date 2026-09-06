import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  QrCode,
  Send,
  Copy,
  Check,
  ExternalLink,
  X,
  Radio,
  Sparkles,
  Music,
  Heart,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface WhatsAppSMSBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  onSuccess?: () => void;
}

type BridgeTab = 'WHATSAPP' | 'QR';
type MessageTemplateKey = 'PRAYER' | 'SONG' | 'SHOUTOUT' | 'GIVING' | 'CUSTOM';

interface BridgeConfig {
  stationId: string;
  stationName: string;
  whatsappNumber: string;
  cleanWhatsAppNumber: string;
  smsNumber: string;
  smsKeywordPrefix: string;
  whatsappBridgeEnabled: boolean;
  smsBridgeEnabled: boolean;
  templates: {
    prayer: string;
    song: string;
    shoutout: string;
    giving: string;
  };
}

export function WhatsAppSMSBridgeModal({
  isOpen,
  onClose,
  station,
  onSuccess,
}: WhatsAppSMSBridgeModalProps) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<BridgeTab>('WHATSAPP');
  const [templateKey, setTemplateKey] = useState<MessageTemplateKey>('SHOUTOUT');
  const [listenerName, setListenerName] = useState(user?.name || '');
  const [listenerCity, setListenerCity] = useState('');
  const [customText, setCustomText] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Web Bridge Direct Submission state
  const [submittingDirect, setSubmittingDirect] = useState(false);
  const [directSent, setDirectSent] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && station.id) {
      loadBridgeConfig();
    }
  }, [isOpen, station.id]);

  const loadBridgeConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await apiFetch(`/api/public/stations/${station.id}/bridge`);
      if (res.ok) {
        const data = await res.json();
        setBridgeConfig(data);
      }
    } catch (err) {
      console.error('Failed to load bridge configuration:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  if (!isOpen) return null;

  const rawPhone = bridgeConfig?.whatsappNumber || station.whatsappNumber || station.phone || '+255754123456';
  const cleanPhone = bridgeConfig?.cleanWhatsAppNumber || rawPhone.replace(/[^0-9]/g, '');
  const smsNumber = bridgeConfig?.smsNumber || station.smsNumber || rawPhone;
  const keywordPrefix = bridgeConfig?.smsKeywordPrefix || station.smsKeywordPrefix || station.name.split(' ')[0].toUpperCase();

  // Generate Message Text based on selected template
  const generateMessageBody = (): string => {
    const namePart = listenerName.trim() || 'A Faithful Listener';
    const cityPart = listenerCity.trim() ? ` (${listenerCity.trim()})` : '';

    switch (templateKey) {
      case 'PRAYER':
        return `🕊️ [PRAYER REQUEST]\nStation: ${station.name}\nFrom: ${namePart}${cityPart}\n\nDear Radio Team, please lift this in prayer:\n${customText.trim() || 'Praying for divine healing, peace, and spiritual strength for our family.'}`;
      case 'SONG':
        return `🎵 [SONG REQUEST & DEDICATION]\nStation: ${station.name}\nFrom: ${namePart}${cityPart}\n\nSong: ${customText.trim() || 'My Gospel Favorites'}\nDedicated to: All faithful listeners and brothers/sisters in Christ!`;
      case 'GIVING':
        return `🤝 [GIVING & PARTNERSHIP INQUIRY]\nStation: ${station.name}\nFrom: ${namePart}${cityPart}\n\nGrace and peace! I would like to support ${station.name}'s broadcast ministry. Please provide your bank/mobile money giving credentials.`;
      case 'CUSTOM':
        return customText.trim()
          ? `${customText.trim()}\n— ${namePart}${cityPart}`
          : `Hello ${station.name} studio desk! Tuning in and blessed by the program. — ${namePart}${cityPart}`;
      case 'SHOUTOUT':
      default:
        return `📣 [LIVE STUDIO SHOUTOUT]\nStation: ${station.name}\nFrom: ${namePart}${cityPart}\n\n${customText.trim() || 'Greetings to the on-air presenter and all listeners across the globe! Loving the broadcast!'}`;
    }
  };

  const currentMessage = generateMessageBody();
  const encodedMessage = encodeURIComponent(currentMessage);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&data=${encodeURIComponent(waUrl)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleTransmitDirect = async () => {
    setDirectError(null);
    setSubmittingDirect(true);
    try {
      const res = await apiFetch(`/api/public/stations/${station.id}/bridge/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: listenerName.trim() || 'Online Listener',
          from: rawPhone,
          body: currentMessage,
          messageType: templateKey === 'SONG' ? 'SONG_REQUEST' : 'SHOUTOUT',
          channel: 'WHATSAPP',
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit to studio desk');
      }

      setDirectSent(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setDirectSent(false);
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error transmitting message';
      setDirectError(msg);
    } finally {
      setSubmittingDirect(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Studio WhatsApp Hotline
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  LIVE DESK
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Connect directly with {station.name} presenters & prayer team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('WHATSAPP')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'WHATSAPP'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Direct Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'QR'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code (Mobile)</span>
          </button>
        </div>

        {/* Studio Phone Info Badge */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 text-[11px] block">
                Official Studio Desk Number:
              </span>
              <span className="text-slate-200 font-mono font-bold tracking-wide">
                {rawPhone}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleCopyNumber(rawPhone)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 font-medium transition shrink-0 cursor-pointer"
            title="Copy phone number"
          >
            {copiedNumber ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Tab 2: Desktop Scan QR Code */}
        {activeTab === 'QR' && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30">
              <img
                src={qrCodeUrl}
                alt="Scan with mobile camera to WhatsApp station"
                className="w-48 h-48 rounded-lg"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Scan with your phone camera
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Instantly opens WhatsApp on your phone with your selected dedication or prayer request pre-typed for {station.name}.
              </p>
            </div>
          </div>
        )}

        {/* Message Template Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Live Message Type:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTemplateKey('SHOUTOUT')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                templateKey === 'SHOUTOUT'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>📣</span> Shout-out
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Live on-air greeting
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateKey('SONG')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                templateKey === 'SONG'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Music className="w-3.5 h-3.5 text-sky-400" /> Song Request
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Gospel song dedication
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateKey('PRAYER')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                templateKey === 'PRAYER'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Prayer Item
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Pastor & team intercession
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateKey('GIVING')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                templateKey === 'GIVING'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>🤝</span> Giving / Info
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Support ministry
              </span>
            </button>
          </div>
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={listenerName}
              onChange={(e) => setListenerName(e.target.value)}
              placeholder="e.g. Grace Mwangi"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Your City / Country
            </label>
            <input
              type="text"
              value={listenerCity}
              onChange={(e) => setListenerCity(e.target.value)}
              placeholder="e.g. Nairobi, Kenya or London, UK"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Custom Message or Song Details */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between mb-1">
            <span>
              {templateKey === 'SONG'
                ? 'Song Title & Artist'
                : templateKey === 'PRAYER'
                ? 'Prayer Request Specifics'
                : 'Your Message / Shout-out'}
            </span>
            <span className="text-[10px] text-slate-500">
              {customText.length}/300 characters
            </span>
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={
              templateKey === 'SONG'
                ? 'e.g. "Neno Lako" by Florence Andenyi, dedicated to mum and family'
                : templateKey === 'PRAYER'
                ? 'e.g. Praying for complete recovery and job breakthrough'
                : 'Type your message to the studio presenter...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Live Message Preview & Copy */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Message Preview:
            </span>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Text Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-sans text-slate-300 whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/70 select-all">
            {currentMessage}
          </pre>
        </div>

        {/* Direct Transmission Feedback */}
        {directSent && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-bold">Transmitted to Studio Desk!</strong>
              Your message was received by {station.name}'s on-air producer.
            </div>
          </div>
        )}

        {directError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-bold">Transmission issue:</strong>
              {directError}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {activeTab === 'WHATSAPP' && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Launch WhatsApp Chat</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>
          )}

          {activeTab === 'QR' && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Or open WhatsApp directly on this browser</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Fallback Direct Transmission into Station Live Feed */}
          <button
            type="button"
            onClick={handleTransmitDirect}
            disabled={submittingDirect || directSent}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
          >
            {submittingDirect ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Transmitting to Studio Desk...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transmit Directly to Live Studio Feed (No Phone Required)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
