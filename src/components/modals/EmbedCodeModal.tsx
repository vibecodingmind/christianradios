import React, { useState } from 'react';
import { Code, X, Copy, Check, ExternalLink, Radio, Layout, Smartphone } from 'lucide-react';
import type { Station } from '../../types';

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
}

export function EmbedCodeModal({ isOpen, onClose, station }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'card' | 'compact'>('card');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${station.slug}?theme=${theme}${embedType === 'compact' ? '&compact=true' : ''}`;
  const iframeHeight = embedType === 'compact' ? 90 : 180;
  
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${iframeHeight}" frameborder="0" allow="autoplay; encrypted-media" style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);" title="${station.name} Live Stream"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Embed Player Widget</h3>
            <p className="text-xs text-slate-400">Add {station.name} to your church website, blog, or mobile portal</p>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-sky-400" /> Widget Size
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setEmbedType('card')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition ${
                  embedType === 'card'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Standard (180px)
              </button>
              <button
                type="button"
                onClick={() => setEmbedType('compact')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition ${
                  embedType === 'compact'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Compact (90px)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color Theme</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Dark (Slate)
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition ${
                  theme === 'light'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Light Theme
              </button>
            </div>
          </div>
        </div>

        {/* Live Widget Preview */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Preview</span>
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              Open in new tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden shadow-inner">
            <iframe
              src={embedUrl}
              width="100%"
              height={iframeHeight}
              frameBorder="0"
              style={{ borderRadius: 12 }}
              title="Station Embed Preview"
            />
          </div>
        </div>

        {/* Embed Code Output */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">HTML Embed Code (Copy & Paste into HTML)</label>
          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={iframeCode}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 select-all focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Responsive & cross-platform ready with SSL HTTPS stream proxy.
            </span>
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Embed Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
