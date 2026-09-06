import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  MessageSquare,
  QrCode,
  Code2,
  Radio,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { Station } from '../../types';

interface ShareModalProps {
  station: Station;
  onClose: () => void;
}

export function ShareModal({ station, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'qr' | 'embed'>('social');

  const shareUrl = `${window.location.origin}?station=${station.slug}`;
  const shareText = `Listen to ${station.name} (${station.genre || 'Christian Radio'}) live on Christian Radios:`;
  const embedCode = `<iframe src="${shareUrl}&embed=true" width="100%" height="160" frameborder="0" allow="autoplay"></iframe>`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&bgcolor=020617&color=38bdf8&margin=10`;

  const countryName =
    typeof station.country === 'object' && station.country !== null
      ? (station.country as any).name || (station.country as any).code || 'Global'
      : typeof station.country === 'string' && station.country
      ? station.country
      : station.countryCode
      ? station.countryCode.toUpperCase()
      : 'Global';

  const countryFlag =
    typeof station.country === 'object' && station.country !== null
      ? (station.country as any).flagEmoji || '🌍'
      : '🌍';

  const copyToClipboard = (text: string, type: 'link' | 'embed' | 'message') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else if (type === 'embed') {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const socialNetworks = [
    {
      name: 'WhatsApp',
      color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10',
      iconColor: 'text-[#25D366]',
      action: () => openWindow(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      color: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30 hover:border-sky-500/60 shadow-sky-500/10',
      iconColor: 'text-[#229ED9]',
      action: () => openWindow(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.195 1.006.128.832.942z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border-blue-600/30 hover:border-blue-500/60 shadow-blue-500/10',
      iconColor: 'text-[#1877F2]',
      action: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      color: 'bg-slate-800/60 hover:bg-slate-750 text-white border-slate-700 hover:border-slate-500 shadow-slate-900/50',
      iconColor: 'text-white',
      action: () => openWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`),
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Threads',
      color: 'bg-zinc-800/60 hover:bg-zinc-750 text-zinc-200 border-zinc-750 hover:border-zinc-500 shadow-zinc-900/50',
      iconColor: 'text-zinc-100',
      action: () => openWindow(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24h-.007C5.452 24 0 18.544 0 11.815 0 5.085 5.452 0 12.18 0h.014c6.728 0 12.18 5.454 12.18 12.185 0 2.75-.923 5.405-2.602 7.481-1.898 2.348-4.664 3.737-7.79 3.916-.13.007-.26.011-.39.011-.274 0-.528-.023-.78-.063-.522-.083-.873-.574-.79-1.096.082-.52.573-.875 1.095-.792.203.032.407.051.626.051.106 0 .211-.003.316-.01 2.585-.147 4.87-1.296 6.436-3.232 1.4-1.733 2.17-3.95 2.17-6.245 0-5.617-4.57-10.185-10.186-10.185C6.552 2 2 6.553 2 12.185c0 5.632 4.552 10.184 10.18 10.184.004 0 .008 0 .012 0 2.502-.007 4.802-.916 6.478-2.558.384-.378 1.006-.372 1.385.012.378.384.372 1.006-.012 1.385-2.035 1.996-4.832 3.104-7.857 3.111v-.32z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      color: 'bg-sky-700/10 hover:bg-sky-700/20 text-sky-200 border-sky-700/30 hover:border-sky-600/60 shadow-sky-600/10',
      iconColor: 'text-[#0A66C2]',
      action: () => openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`),
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      name: 'Reddit',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border-orange-500/30 hover:border-orange-500/60 shadow-orange-500/10',
      iconColor: 'text-[#FF4500]',
      action: () => openWindow(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .616-.32 1.157-.798 1.464.037.262.057.528.057.798 0 2.925-3.411 5.297-7.618 5.297-4.207 0-7.618-2.372-7.618-5.297 0-.27.02-.536.058-.798a1.748 1.748 0 0 1-.8-1.464c0-.968.786-1.754 1.754-1.754.477 0 .899.182 1.207.491 1.194-.856 2.85-1.418 4.674-1.488l.8-3.747a.56.56 0 0 1 .665-.43l2.87.604a1.25 1.25 0 0 1 1.249-.74z" />
        </svg>
      ),
    },
    {
      name: 'Pinterest',
      color: 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border-rose-600/30 hover:border-rose-500/60 shadow-rose-500/10',
      iconColor: 'text-[#E60023]',
      action: () => openWindow(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0a12 12 0 0 0-4.37 23.18c-.08-.94-.15-2.38.03-3.41l1.19-5.06s-.3-.6-.3-1.49c0-1.4 1.05-2.45 2.33-2.45 1.1 0 1.63.83 1.63 1.82 0 1.11-.71 2.76-1.07 4.3-.3 1.29.65 2.34 1.92 2.34 2.3 0 4.07-2.43 4.07-5.93 0-3.1-2.23-5.27-5.41-5.27-3.69 0-5.85 2.77-5.85 5.62 0 1.11.43 2.31.96 2.96.11.13.12.24.09.37l-.36 1.48c-.06.24-.2.29-.46.17-1.71-.8-2.78-3.29-2.78-5.3 0-4.31 3.13-8.27 9.04-8.27 4.75 0 8.43 3.38 8.43 7.9 0 4.71-2.97 8.51-7.1 8.51-1.39 0-2.69-.72-3.14-1.57l-.85 3.26c-.31 1.19-1.15 2.68-1.71 3.59A12 12 0 1 0 12 0z" />
        </svg>
      ),
    },
    {
      name: 'Email',
      color: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/10',
      iconColor: 'text-cyan-400',
      action: () => openWindow(`mailto:?subject=${encodeURIComponent(`Listen to ${station.name} on Christian Radios`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`),
      icon: <Mail className="w-5 h-5" />,
    },
    {
      name: 'SMS',
      color: 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border-emerald-600/30 hover:border-emerald-500/60 shadow-emerald-500/10',
      iconColor: 'text-emerald-400',
      action: () => openWindow(`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      name: 'More Apps',
      color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10',
      iconColor: 'text-purple-400',
      action: () => {
        if (navigator.share) {
          navigator.share({ title: station.name, text: shareText, url: shareUrl }).catch(() => {});
        } else {
          copyToClipboard(`${shareText} ${shareUrl}`, 'message');
        }
      },
      icon: <Share2 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-slate-100 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Share Radio Station</h3>
            <p className="text-xs text-slate-400">Invite friends, brethren, and fellowship to listen live</p>
          </div>
        </div>

        {/* Station Preview Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 sm:p-3.5 mb-5 flex items-center gap-3.5 shadow-inner">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-750 shrink-0 relative">
            <img
              src={
                station.logoUrl ||
                station.coverUrl ||
                'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'
              }
              alt={station.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (
                  img.src !==
                  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'
                ) {
                  img.src =
                    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                }
              }}
            />
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white truncate">{station.name}</h4>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full shrink-0">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {station.genre || 'Christian Gospel'} • {countryFlag} {countryName}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Apps, QR Code, Embed */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'social'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Networks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'embed'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Embed Player</span>
          </button>
        </div>

        {/* TAB 1: SOCIAL NETWORKS GRID */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2.5">
              {socialNetworks.map((net) => (
                <button
                  key={net.name}
                  onClick={net.action}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${net.color}`}
                  title={`Share on ${net.name}`}
                >
                  <div className={`p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 group-hover:bg-slate-950/90 transition-colors ${net.iconColor}`}>
                    {net.icon}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight text-slate-200 group-hover:text-white truncate max-w-full">
                    {net.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: QR CODE SCAN-TO-LISTEN */}
        {activeTab === 'qr' && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
            <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-xl flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${station.name}`}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Scan to Listen Immediately</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                Scan with any smartphone camera to open and play {station.name} in mobile browser without installing an app.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: EMBED CODE FOR WEBSITES & CHURCHES */}
        {activeTab === 'embed' && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-sky-400" />
                Church & Ministry Website Embed
              </span>
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={embedCode}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-500">
              Paste this responsive HTML snippet into your WordPress, Squarespace, or custom ministry website to embed a live player widget.
            </p>
          </div>
        )}

        {/* Bottom Link Box (always accessible) */}
        <div className="space-y-1.5 pt-4 mt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Direct Station Web Link
            </label>
            <button
              type="button"
              onClick={() => copyToClipboard(`${shareText} ${shareUrl}`, 'message')}
              className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied Share Note</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Copy Note + Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="bg-transparent text-xs text-slate-300 w-full outline-none font-mono truncate"
            />
            <button
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className={`shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
