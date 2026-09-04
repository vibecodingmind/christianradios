import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Share2, Heart, Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface AIPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToPrayerWall: (title: string, content: string, category: string) => void;
}

export function AIPrayerModal({ isOpen, onClose, onShareToPrayerWall }: AIPrayerModalProps) {
  const [intent, setIntent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState<{
    prayerTitle: string;
    prayerText: string;
    topic: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!intent.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/ai/prayer-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intent.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedPrayer(data.data);
      } else {
        setError(data.error || 'Failed to generate prayer text.');
      }
    } catch (err: any) {
      console.error('[AIPrayerModal] Error:', err);
      setError('Unable to connect to AI prayer assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPrayer) return;
    navigator.clipboard.writeText(`${generatedPrayer.prayerTitle}\n\n${generatedPrayer.prayerText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Need help putting your prayer into words?</h3>
            <p className="text-xs text-slate-400">Describe what is on your heart and our AI assistant will draft a prayer for you.</p>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300">
            What would you like to pray about?
          </label>
          <textarea
            rows={3}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g. Prayer for my family, peace during a job transition, strength in health..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !intent.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Drafting Prayer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Prayer Draft</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/20">{error}</p>
        )}

        {/* Generated output */}
        {generatedPrayer && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Topic: {generatedPrayer.topic}
              </span>
              <h4 className="font-extrabold text-base text-white mt-1">{generatedPrayer.prayerTitle}</h4>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed italic bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              "{generatedPrayer.prayerText}"
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Prayer'}</span>
              </button>

              <button
                onClick={() => {
                  onShareToPrayerWall(
                    generatedPrayer.prayerTitle,
                    generatedPrayer.prayerText,
                    generatedPrayer.topic
                  );
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share to Prayer Wall</span>
              </button>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>AI generated prayers are private drafts. They are only shared if you explicitly choose to publish.</span>
        </div>
      </div>
    </div>
  );
}
