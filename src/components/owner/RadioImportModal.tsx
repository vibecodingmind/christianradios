import React, { useState } from 'react';
import {
  Radio,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Globe,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Category, RadioImportPreviewResult, SourceType } from '../../types';

interface RadioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (station: any) => void;
  categories: Category[];
  availableCountries: { code: string; name: string }[];
  onOpenClaimModal?: (stationId: string, stationName: string) => void;
}

const PROVIDER_INFO: Record<SourceType, { label: string; bg: string; text: string; icon: string }> = {
  RADIOKING: { label: 'RadioKing', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: '👑' },
  ZENO: { label: 'Zeno FM / Media', bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-400', icon: '📡' },
  STREEMA: { label: 'Streema Directory', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', icon: '📻' },
  ICECAST: { label: 'Icecast Server', bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-400', icon: '❄️' },
  SHOUTCAST: { label: 'SHOUTcast Server', bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', icon: '⚡' },
  AZURACAST: { label: 'AzuraCast Radio', bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400', icon: '🎛️' },
  DIRECT_STREAM: { label: 'Direct Audio Stream', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', icon: '🔗' },
  IMPORTED_OTHER: { label: 'Web Auto-Discovery', bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-300', icon: '🌐' },
  MANUAL: { label: 'Manual Broadcaster', bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-300', icon: '✍️' },
};

export const RadioImportModal: React.FC<RadioImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  availableCountries,
  onOpenClaimModal,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<RadioImportPreviewResult | null>(null);

  // Editable Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [backupStreamUrl, setBackupStreamUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [countryCode, setCountryCode] = useState('TZ');
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [bitrateKbps, setBitrateKbps] = useState<number>(128);

  // Audio Testing
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsDiscovering(true);
    setDiscoveryError(null);
    setPreviewResult(null);
    stopAudio();

    try {
      const res = await fetch('/api/owner/stations/import-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to discover radio station.');
      }

      setPreviewResult(data);

      // Populate form
      const meta = data.metadata;
      setName(meta.name || '');
      setTagline(meta.tagline || '');
      setDescription(meta.description || '');
      setStreamUrl(meta.streamUrl || '');
      setBackupStreamUrl(meta.backupStreamUrl || '');
      setLogoUrl(meta.logoUrl || '');
      setWebsiteUrl(meta.websiteUrl || urlInput.trim());
      setCountryCode(meta.countryCode || 'TZ');
      setCity(meta.city || 'Dar es Salaam');
      setLanguage(meta.language || 'Swahili');
      setGenre(meta.genre || 'Gospel & Praise');
      const initCat = meta.categoryId || (categories[0]?.id || 'cat_gospel');
      setCategoryId(initCat);
      setCategoryIds(meta.categoryIds && meta.categoryIds.length > 0 ? meta.categoryIds : [initCat]);
      setBitrateKbps(meta.bitrateKbps || 128);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Discovery failed';
      setDiscoveryError(msg);
    } finally {
      setIsDiscovering(false);
    }
  };

  const togglePlayAudio = () => {
    if (!streamUrl) return;
    if (isPlayingAudio) {
      stopAudio();
    } else {
      setAudioError(false);
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(streamUrl);
          audioRef.current.onerror = () => {
            setAudioError(true);
            setIsPlayingAudio(false);
          };
        } else {
          audioRef.current.src = streamUrl;
        }
        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch(() => {
          setAudioError(true);
          setIsPlayingAudio(false);
        });
      } catch {
        setAudioError(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlayingAudio(false);
    }
  };

  const handleSubmitImport = async () => {
    if (!name.trim() || !streamUrl.trim()) {
      setDiscoveryError('Station name and stream URL are required.');
      return;
    }

    setIsSubmitting(true);
    setDiscoveryError(null);
    stopAudio();

    try {
      const res = await fetch('/api/owner/stations/import-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: previewResult?.sourceType || 'IMPORTED_OTHER',
          sourceUrl: urlInput.trim(),
          externalId: previewResult?.externalId,
          metadata: {
            name: name.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            streamUrl: streamUrl.trim(),
            backupStreamUrl: backupStreamUrl.trim() || undefined,
            logoUrl: logoUrl.trim(),
            websiteUrl: websiteUrl.trim(),
            countryCode,
            city: city.trim(),
            language: language.trim(),
            genre: genre.trim(),
            categoryId,
            bitrateKbps,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import station.');
      }

      onSuccess(data.station);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setDiscoveryError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const provider = previewResult ? PROVIDER_INFO[previewResult.sourceType] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Import Existing Radio Station
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Smart Auto-Discovery
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Paste any RadioKing, Zeno, Streema, Icecast, SHOUTcast, AzuraCast, or stream link to auto-fill.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* URL Input Form */}
          <form onSubmit={handleDiscover} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Radio URL, Directory Page, or Direct Stream Link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  required
                  placeholder="e.g. https://www.radioking.com/radio/gospel-fm or https://stream.zeno.fm/xyz"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isDiscovering || !urlInput.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Auto-Discover
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">Supported:</span>
              {['RadioKing', 'Zeno FM', 'Streema', 'Icecast', 'SHOUTcast', 'AzuraCast', 'Direct MP3/AAC/HLS'].map((s) => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  {s}
                </span>
              ))}
            </div>
          </form>

          {/* Error Message */}
          {discoveryError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Discovery Notice</p>
                <p className="text-xs text-red-300/90 mt-0.5">{discoveryError}</p>
              </div>
            </div>
          )}

          {/* Discovery Preview / Editable Form */}
          {previewResult && (
            <div className="space-y-6 pt-2 border-t border-slate-800">
              {/* Provider & Health Status Bar */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{provider?.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Detected Source:</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${provider?.bg} ${provider?.text}`}>
                        {provider?.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{previewResult.sourceUrl}</p>
                  </div>
                </div>

                {/* Stream Health & Test Listen */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`w-2 h-2 rounded-full ${previewResult.streamValidation.isValid ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      <span className="text-xs font-medium text-slate-300">
                        {previewResult.streamValidation.isValid ? 'Stream Online' : 'Stream Check Warning'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {previewResult.streamValidation.detectedType} • {previewResult.streamValidation.bitrateKbps || 128} kbps
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className={`p-2.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition ${
                      isPlayingAudio
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    {isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPlayingAudio ? 'Stop Test' : 'Test Audio'}
                  </button>
                </div>
              </div>

              {audioError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Audio test notice: Browser autoplay or CORS restriction. The direct stream will be proxied and playable in the Christian Radios player.</span>
                </div>
              )}

              {/* Duplicate Warnings */}
              {previewResult.duplicates.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Existing Matching Station(s) Detected in Directory</span>
                  </div>
                  <p className="text-xs text-amber-200/90">
                    We found {previewResult.duplicates.length} station(s) with matching stream URL or name. If you own one of these stations, please submit an <strong>Ownership Claim</strong> instead of creating a duplicate entry.
                  </p>
                  <div className="space-y-2 mt-2">
                    {previewResult.duplicates.map((dup) => (
                      <div key={dup.stationId} className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {dup.logoUrl ? (
                            <img src={dup.logoUrl} alt={dup.stationName} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                              <Radio className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-white">{dup.stationName}</p>
                            <p className="text-[11px] text-slate-400">{dup.city}, {dup.countryCode} • Reason: {dup.matchReason}</p>
                          </div>
                        </div>
                        {onOpenClaimModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenClaimModal(dup.stationId, dup.stationName);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            Claim Ownership <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    Station Name <span className="text-amber-400">*</span>
                    {previewResult.metadata.confidenceMap.name && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Auto-Extracted
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Sauti ya Matumaini na Baraka"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    Stream URL (MP3 / AAC / HLS) <span className="text-amber-400">*</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> SSRF Verified
                    </span>
                  </label>
                  <input
                    type="url"
                    required
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Backup Stream URL (Optional)</label>
                  <input
                    type="url"
                    value={backupStreamUrl}
                    onChange={(e) => setBackupStreamUrl(e.target.value)}
                    placeholder="Optional fallback stream URL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Logo Image URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Primary Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Gospel, Praise & Worship, Sermon"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. Swahili, English"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Official Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Description / Ministry Mission</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <p className="text-xs text-slate-500">
            Imported stations sync external stream updates automatically.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            {previewResult && (
              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={isSubmitting || !name.trim() || !streamUrl.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Station...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Import & Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
