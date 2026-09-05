import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import type { Station } from '../../types';

interface ShareModalProps {
  station: Station;
  onClose: () => void;
}

export function ShareModal({ station, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}?station=${station.slug}`;
  const shareText = `Listen to ${station.name} (${station.genre || 'Christian Radio'}) live on Christian Radios:`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      '_blank'
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share Radio Station</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{station.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: station.name, text: shareText, url: shareUrl }).catch(() => {});
              } else {
                shareWhatsApp();
              }
            }}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-2xl transition-colors text-xs font-semibold"
            title="Open all device apps"
          >
            <Share2 className="w-5 h-5 text-purple-400" />
            More Apps
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl transition-colors text-xs font-semibold"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
          <button
            onClick={shareTwitter}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-2xl transition-colors text-xs font-semibold"
          >
            <span className="font-bold text-sm">𝕏</span>
            X / Twitter
          </button>
          <button
            onClick={shareFacebook}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl transition-colors text-xs font-semibold"
          >
            <span className="font-bold text-sm">f</span>
            Facebook
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Direct Link
          </label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-300 w-full outline-none truncate"
            />
            <button
              onClick={copyToClipboard}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
