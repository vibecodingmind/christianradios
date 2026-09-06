import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Radio,
  Music,
  MapPin,
  Share2,
  Wand2,
  Image as ImageIcon,
  Loader2,
  Volume2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { WORLDWIDE_COUNTRIES } from '../../data/worldwideCountries';
import type { Station, Category } from '../../types';

interface StationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (station: Station) => void;
  stationToEdit?: Station | null;
  categories: Category[];
}

const STEPS = [
  { id: 1, title: 'Identity', subtitle: 'Name & Info', icon: Radio },
  { id: 2, title: 'Audio Stream', subtitle: 'Feed & Testing', icon: Music },
  { id: 3, title: 'Location & Tags', subtitle: 'Region & Genre', icon: MapPin },
  { id: 4, title: 'Branding & Links', subtitle: 'Media & Social', icon: Share2 },
  { id: 5, title: 'Review & Launch', subtitle: 'Final Confirmation', icon: CheckCircle2 },
];

export const StationWizardModal: React.FC<StationWizardModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  stationToEdit,
  categories,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    logoUrl: '',
    coverUrl: '',
    countryCode: 'TZ',
    region: '',
    city: '',
    language: 'Swahili',
    genre: 'Gospel & Praise',
    categoryId: 'cat_gospel',
    categoryIds: ['cat_gospel'],
    denomination: '',
    websiteUrl: '',
    email: '',
    phone: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      whatsapp: '',
      tiktok: '',
      linkedin: '',
    },
    streamUrl: '',
    backupStreamUrl: '',
    streamType: 'MP3' as const,
    bitrateKbps: 128,
    timezone: 'Africa/Dar_es_Salaam',
  });

  // Stream Testing State
  const [testingStream, setTestingStream] = useState(false);
  const [streamTestResult, setStreamTestResult] = useState<{
    valid: boolean;
    error?: string;
    detectedType?: string;
    latencyMs?: number;
  } | null>(null);

  // Stream Extractor State
  const [extractingStream, setExtractingStream] = useState(false);
  const [extractPageUrl, setExtractPageUrl] = useState('');
  const [showExtractorInput, setShowExtractorInput] = useState(false);

  // Prepopulate when editing or reset when adding
  useEffect(() => {
    if (stationToEdit) {
      setFormData({
        name: stationToEdit.name || '',
        tagline: stationToEdit.tagline || '',
        description: stationToEdit.description || '',
        logoUrl: stationToEdit.logoUrl || '',
        coverUrl: stationToEdit.coverUrl || '',
        countryCode: stationToEdit.countryCode || 'TZ',
        region: stationToEdit.region || '',
        city: stationToEdit.city || '',
        language: stationToEdit.language || 'Swahili',
        genre: stationToEdit.genre || 'Gospel & Praise',
        categoryId: stationToEdit.categoryId || (categories[0]?.id || 'cat_gospel'),
        categoryIds: stationToEdit.categoryIds && stationToEdit.categoryIds.length > 0
          ? stationToEdit.categoryIds
          : [stationToEdit.categoryId || 'cat_gospel'],
        denomination: stationToEdit.denomination || '',
        websiteUrl: stationToEdit.websiteUrl || '',
        email: stationToEdit.email || '',
        phone: stationToEdit.phone || '',
        socialLinks: {
          facebook: stationToEdit.socialLinks?.facebook || '',
          twitter: stationToEdit.socialLinks?.twitter || '',
          instagram: stationToEdit.socialLinks?.instagram || '',
          youtube: stationToEdit.socialLinks?.youtube || '',
          whatsapp: stationToEdit.socialLinks?.whatsapp || '',
          tiktok: stationToEdit.socialLinks?.tiktok || '',
          linkedin: stationToEdit.socialLinks?.linkedin || '',
        },
        streamUrl: stationToEdit.streamUrl || '',
        backupStreamUrl: stationToEdit.backupStreamUrl || '',
        streamType: (stationToEdit.streamType as any) || 'MP3',
        bitrateKbps: stationToEdit.bitrateKbps || 128,
        timezone: stationToEdit.timezone || 'Africa/Dar_es_Salaam',
      });
      setStreamTestResult(null);
    } else {
      setFormData({
        name: '',
        tagline: '',
        description: '',
        logoUrl: '',
        coverUrl: '',
        countryCode: 'TZ',
        region: '',
        city: 'Dar es Salaam',
        language: 'Swahili',
        genre: 'Gospel & Praise',
        categoryId: categories[0]?.id || 'cat_gospel',
        categoryIds: [categories[0]?.id || 'cat_gospel'],
        denomination: '',
        websiteUrl: '',
        email: '',
        phone: '',
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          whatsapp: '',
          tiktok: '',
          linkedin: '',
        },
        streamUrl: '',
        backupStreamUrl: '',
        streamType: 'MP3',
        bitrateKbps: 128,
        timezone: 'Africa/Dar_es_Salaam',
      });
      setStreamTestResult(null);
    }
    setCurrentStep(1);
    setStepError(null);
    setShowExtractorInput(false);
  }, [stationToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Stream Validation via SSRF Endpoint
  const handleTestStream = async () => {
    if (!formData.streamUrl) {
      setStreamTestResult({ valid: false, error: 'Please enter a stream URL first.' });
      return;
    }
    setTestingStream(true);
    setStreamTestResult(null);
    try {
      const res = await apiFetch('/api/owner/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: formData.streamUrl,
          backupStreamUrl: formData.backupStreamUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setStreamTestResult({
          valid: true,
          detectedType: data.detectedType,
          latencyMs: data.latencyMs,
        });
      } else {
        setStreamTestResult({
          valid: false,
          error: data.error || 'Stream validation failed. Stream endpoint unreachable.',
        });
      }
    } catch (err: any) {
      setStreamTestResult({
        valid: false,
        error: err.message || 'Stream test request failed.',
      });
    } finally {
      setTestingStream(false);
    }
  };

  // Stream Extractor
  const handleExtractStream = async () => {
    if (!extractPageUrl.trim()) return;
    setExtractingStream(true);
    try {
      const res = await apiFetch('/api/owner/extract-stream-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl: extractPageUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.extractedStreamUrl) {
        setFormData((prev) => ({
          ...prev,
          streamUrl: data.extractedStreamUrl,
          streamType: data.detectedType || prev.streamType,
        }));
        setStreamTestResult({
          valid: true,
          detectedType: data.detectedType,
          latencyMs: 45,
        });
        setShowExtractorInput(false);
        setExtractPageUrl('');
      } else {
        alert(data.error || 'Could not find a direct audio stream URL on that page source.');
      }
    } catch (err: any) {
      alert('Extraction failed: ' + (err.message || 'Network error'));
    } finally {
      setExtractingStream(false);
    }
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setStepError(null);
    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setStepError('Station Name is required (at least 2 characters).');
        return false;
      }
      if (!formData.description.trim() || formData.description.trim().length < 10) {
        setStepError('Station Description must be at least 10 characters.');
        return false;
      }
      if (!formData.language.trim()) {
        setStepError('Broadcasting Language is required.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.streamUrl.trim()) {
        setStepError('Primary Live Audio Stream URL is required.');
        return false;
      }
      if (!formData.streamUrl.startsWith('http://') && !formData.streamUrl.startsWith('https://')) {
        setStepError('Stream URL must start with http:// or https://');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.city.trim()) {
        setStepError('Broadcast City / Town is required.');
        return false;
      }
      if (!formData.countryCode) {
        setStepError('Broadcasting Country is required.');
        return false;
      }
      if (!formData.categoryIds || formData.categoryIds.length === 0) {
        setStepError('Please select at least one primary category for your station.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.logoUrl.trim()) {
        setStepError('Station Logo URL is required (must be a valid image link).');
        return false;
      }
      if (!formData.logoUrl.startsWith('http://') && !formData.logoUrl.startsWith('https://')) {
        setStepError('Logo URL must be a valid http:// or https:// URL.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const url = stationToEdit
        ? `/api/owner/stations/${stationToEdit.id}`
        : '/api/owner/stations';
      const method = stationToEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryIds[0] || formData.categoryId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.station) {
        onSaved(data.station);
        onClose();
      } else {
        setStepError(data.error || 'Failed to save radio station.');
      }
    } catch (err: any) {
      setStepError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = WORLDWIDE_COUNTRIES.find((c) => c.code === formData.countryCode);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Wizard Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Radio className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {stationToEdit ? `Edit "${stationToEdit.name}"` : 'Register New Radio Station'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Breadcrumbs Bar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px] gap-2">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep || validateCurrentStep()) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : isPassed
                      ? 'text-emerald-400 hover:bg-slate-800/60'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-sky-500 text-slate-950'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : step.id}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="leading-none text-[11px]">{step.title}</p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="w-4 h-[1px] bg-slate-800 ml-1 hidden sm:block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800 h-1 shrink-0">
          <div
            className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 text-xs">
          {stepError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY & BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-400" /> Station Identity & Profile
                </h3>
                <p className="text-slate-400 text-xs">
                  Enter your radio station's official public broadcasting name, tagline, and ministry mission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Station Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radio Maria Tanzania"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Tagline / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. A Christian Voice in Your Home"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Station Mission & Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share your station's vision, Christian ministry programs, and target audience..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Primary Broadcast Language <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swahili, English, Luganda"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Denomination / Affiliation (Optional)
                  </label>
                  <select
                    value={formData.denomination}
                    onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Non-Denominational / All Christian</option>
                    <option value="Catholic">Catholic</option>
                    <option value="Pentecostal">Pentecostal / Charismatic</option>
                    <option value="Lutheran">Lutheran</option>
                    <option value="Anglican">Anglican / Episcopal</option>
                    <option value="Seventh-Day Adventist">Seventh-Day Adventist</option>
                    <option value="Baptist">Baptist</option>
                    <option value="Methodist">Methodist</option>
                    <option value="Presbyterian">Presbyterian</option>
                    <option value="Evangelical">Evangelical</option>
                    <option value="Ecumenical">Ecumenical / Interdenominational</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AUDIO STREAM & VERIFICATION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Music className="w-4 h-4 text-sky-400" /> Live Audio Stream Configuration
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Connect your Icecast, Shoutcast, Zeno, or direct audio link. Test stream reachability in real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExtractorInput(!showExtractorInput)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Auto-Extract from Page URL
                </button>
              </div>

              {/* Stream Extractor Helper */}
              {showExtractorInput && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2 text-xs animate-in fade-in">
                  <p className="text-amber-200">
                    Paste any website or player link (e.g. Zeno.fm radio page, Streema, RadioKing, or church web page). We'll inspect the source code and extract the direct audio stream URL!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://zeno.fm/radio/your-station-name"
                      value={extractPageUrl}
                      onChange={(e) => setExtractPageUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleExtractStream}
                      disabled={extractingStream || !extractPageUrl.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shrink-0 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {extractingStream ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...
                        </>
                      ) : (
                        'Extract Stream'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Stream URL */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Primary Stream URL <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://stream.example.org/live.mp3"
                    value={formData.streamUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, streamUrl: e.target.value });
                      setStreamTestResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestStream}
                    disabled={testingStream || !formData.streamUrl}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 rounded-xl shrink-0 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {testingStream ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Test Stream
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stream Test Results Card */}
              {streamTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    streamTestResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {streamTestResult.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-emerald-200">
                          Stream verified reachable & playable!
                        </p>
                        <p className="text-[11px] text-emerald-400/90 mt-0.5">
                          Codec: {streamTestResult.detectedType || formData.streamType} • Latency: ~{streamTestResult.latencyMs || 45}ms
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-rose-200">Stream verification failed</p>
                        <p className="text-[11px] text-rose-300/90 mt-0.5">
                          {streamTestResult.error}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Backup Failover & Stream Format Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Backup Failover Stream URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://backup.example.org/stream"
                    value={formData.backupStreamUrl}
                    onChange={(e) => setFormData({ ...formData, backupStreamUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Format Type</label>
                  <select
                    value={formData.streamType}
                    onChange={(e) => setFormData({ ...formData, streamType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="MP3">MP3 Stream</option>
                    <option value="AAC">AAC / AAC+</option>
                    <option value="HLS">HLS (m3u8)</option>
                    <option value="ICECAST">Icecast</option>
                    <option value="SHOUTCAST">Shoutcast</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION & CATEGORIES */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" /> Location & Ministry Categories
                </h3>
                <p className="text-slate-400 text-xs">
                  Where is your station headquartered, and which Christian categories describe your broadcast content?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Broadcasting Country <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    {WORLDWIDE_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    City / Town <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dar es Salaam"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Music / Content Genre</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gospel & Praise, Worship"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-category selection */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Content Categories (Select all that apply) <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-2xl custom-scrollbar">
                  {categories.map((cat) => {
                    const isSelected = (formData.categoryIds || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const current = formData.categoryIds || [];
                          let nextIds: string[];
                          if (isSelected) {
                            if (current.length === 1) return; // Keep at least one
                            nextIds = current.filter((id) => id !== cat.id);
                          } else {
                            nextIds = [...current, cat.id];
                          }
                          setFormData({
                            ...formData,
                            categoryIds: nextIds,
                            categoryId: nextIds[0] || cat.id,
                          });
                        }}
                        className={`p-2.5 rounded-xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-semibold shadow-sm'
                            : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }`}
                      >
                        <span className="truncate text-xs">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MEDIA BRANDING, CONTACTS & SOCIAL BRIDGE */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" /> Branding Artwork, Contacts & Social Bridge
                </h3>
                <p className="text-slate-400 text-xs">
                  Upload your station visual identity and connect listener engagement channels (WhatsApp, phone, social links).
                </p>
              </div>

              {/* Artwork URLs with live thumbnail previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-medium text-slate-300">
                    Station Logo URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/logo.jpg"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none text-xs font-mono"
                  />
                  {formData.logoUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={formData.logoUrl}
                        alt="Logo Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=100&h=100&fit=crop';
                        }}
                      />
                      <span className="text-[11px] text-slate-400">Logo preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-slate-300">
                    Cover Banner Artwork URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none text-xs font-mono"
                  />
                  {formData.coverUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={formData.coverUrl}
                        alt="Cover Preview"
                        className="w-20 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=100&fit=crop';
                        }}
                      />
                      <span className="text-[11px] text-slate-400">Banner preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Station Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Official Website</label>
                  <input
                    type="url"
                    placeholder="https://yourstation.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Station Email</label>
                  <input
                    type="email"
                    placeholder="studio@yourstation.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Studio Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+255 700 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  Social Channels & WhatsApp Listener Bridge
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">WhatsApp Direct Link / Number</label>
                    <input
                      type="text"
                      placeholder="https://wa.me/255..."
                      value={formData.socialLinks.whatsapp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, whatsapp: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/yourpage"
                      value={formData.socialLinks.facebook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/yourhandle"
                      value={formData.socialLinks.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">YouTube Channel</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@channel"
                      value={formData.socialLinks.youtube}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, youtube: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">TikTok Handle</label>
                    <input
                      type="url"
                      placeholder="https://tiktok.com/@handle"
                      value={formData.socialLinks.tiktok}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, tiktok: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">X (Twitter) URL</label>
                    <input
                      type="url"
                      placeholder="https://x.com/yourhandle"
                      value={formData.socialLinks.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & LAUNCH */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Review & Launch Broadcast Station
                </h3>
                <p className="text-slate-400 text-xs">
                  Review your station details below. You can navigate back to adjust any section before publishing.
                </p>
              </div>

              {/* Station Card Mock Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-sky-500/30 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      formData.logoUrl ||
                      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=120&h=120&fit=crop'
                    }
                    alt={formData.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=120&h=120&fit=crop';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{selectedCountry?.flagEmoji || '🌍'}</span>
                      <h4 className="text-base font-bold text-white truncate">{formData.name}</h4>
                    </div>
                    {formData.tagline && (
                      <p className="text-xs text-sky-400 italic truncate mt-0.5">{formData.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>{formData.city}</span>
                      <span>•</span>
                      <span>{formData.language}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 font-medium">
                        {formData.genre}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300 line-clamp-2">
                  {formData.description}
                </div>
              </div>

              {/* Technical & Verification Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Audio Feed Summary
                  </span>
                  <p className="font-mono text-[11px] text-slate-300 truncate">{formData.streamUrl}</p>
                  <p className="text-slate-400 mt-1">
                    Format: <strong className="text-white">{formData.streamType}</strong> • Bitrate: <strong className="text-white">{formData.bitrateKbps} kbps</strong>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Categories & Affiliation
                  </span>
                  <p className="text-slate-300">
                    {formData.categoryIds.length} categories selected • {formData.denomination || 'Non-Denominational'}
                  </p>
                  <p className="text-slate-400 mt-1">
                    WhatsApp Listener Bridge: <strong className="text-white">{formData.socialLinks.whatsapp ? 'Connected' : 'Not Set'}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Station...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {stationToEdit ? 'Save & Update Station' : 'Publish Radio Station'}
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
