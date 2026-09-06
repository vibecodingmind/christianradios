import React, { useState, useEffect } from 'react';
import {
  Music,
  Radio,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Copy,
  Volume2,
  Mic2,
  User,
  Heart,
  RotateCw,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sliders,
  AlertCircle,
  X,
  Edit3,
  PlusCircle,
  Building2,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station, StationFeedPost } from '../../types';
import { WhatsAppGatewayModal } from '../modals/WhatsAppGatewayModal';

interface OwnerStudioDeskProps {
  stations: Station[];
  onAddStation?: () => void;
  onStationUpdated?: (updated: Station) => void;
}

export function OwnerStudioDesk({ stations, onAddStation, onStationUpdated }: OwnerStudioDeskProps) {
  const [requests, setRequests] = useState<StationFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'ALL' | 'WHATSAPP' | 'SONG_REQUEST' | 'SHOUTOUT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PLAYED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStudioTools, setShowStudioTools] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Station for WhatsApp Hotline
  const activeStation = (selectedStationId !== 'all' ? stations.find((s) => s.id === selectedStationId) : undefined) || stations[0];
  const [simulating, setSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);

  // WhatsApp Bridge Hotline Modal States
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [replyingPost, setReplyingPost] = useState<StationFeedPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [modalStationId, setModalStationId] = useState<string>(activeStation?.id || '');
  const [modalWhatsappNumber, setModalWhatsappNumber] = useState<string>(activeStation?.whatsappNumber || activeStation?.phone || '');
  const [modalSmsNumber, setModalSmsNumber] = useState<string>(activeStation?.smsNumber || '');
  const [modalSmsPrefix, setModalSmsPrefix] = useState<string>(activeStation?.smsKeywordPrefix || 'SONG');
  const [modalBridgeEnabled, setModalBridgeEnabled] = useState<boolean>(activeStation?.whatsappBridgeEnabled !== false);
  const [savingBridge, setSavingBridge] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const target = stations.find((s) => s.id === modalStationId) || activeStation;
    if (target) {
      if (!modalStationId) setModalStationId(target.id);
      setModalWhatsappNumber(target.whatsappNumber || target.phone || '');
      setModalSmsNumber(target.smsNumber || '');
      setModalSmsPrefix(target.smsKeywordPrefix || 'SONG');
      setModalBridgeEnabled(target.whatsappBridgeEnabled !== false);
    }
  }, [modalStationId, stations, activeStation?.id]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 15000); // Polling every 15s for live show freshness
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const res = await apiFetch('/api/owner/song-requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load owner studio requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPlayed = async (requestId: string) => {
    try {
      setActingId(requestId);
      const res = await apiFetch(`/api/owner/song-requests/${requestId}/play-on-air`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
        );
      }
    } catch (err) {
      console.error('Failed to mark request played:', err);
      alert('Could not update request status.');
    } finally {
      setActingId(null);
    }
  };

  const copyForStudioCue = (req: StationFeedPost) => {
    const text = req.postType === 'SONG_REQUEST'
      ? `🎵 [ON-AIR SONG REQUEST]\nSong: ${req.songTitle || 'Special Song'}\nArtist: ${req.artistName || 'Gospel Artist'}\nFrom: ${req.authorName} (${req.authorCity || 'Local Listener'})\nDedication: ${req.dedicationMessage || 'Fellow saints & family'}`
      : `📣 [ON-AIR SHOUT-OUT]\nFrom: ${req.authorName} (${req.authorCity || 'Local Listener'})\nMessage: "${req.content}"`;

    navigator.clipboard.writeText(text);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulateInbound = async (type: 'SONG' | 'SHOUTOUT') => {
    if (!activeStation) {
      alert('Please configure or select a station first.');
      return;
    }
    setSimulating(true);
    try {
      const res = await apiFetch(`/api/owner/stations/${activeStation.id}/bridge/simulate-inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Sarah Mwangi (WhatsApp)',
          senderCity: 'Mwanza, Tanzania',
          channel: 'WHATSAPP',
          messageType: type === 'SONG' ? 'SONG_REQUEST' : 'SHOUTOUT',
          content: type === 'SONG'
            ? 'Shalom radio team! Please play "Cha Kutumaini Sina" for my family and church choir!'
            : 'Praise the Lord studio presenter! Listening live online from work, wishing all listeners a blessed day!',
          songTitle: type === 'SONG' ? 'Cha Kutumaini Sina' : undefined,
          artistName: type === 'SONG' ? 'Traditional Gospel' : undefined,
        }),
      });

      if (res.ok) {
        setSimulationSuccess(`Simulated WhatsApp ${type === 'SONG' ? 'Song Request' : 'Shout-out'} arrived live!`);
        await loadRequests();
        setTimeout(() => setSimulationSuccess(null), 4500);
      }
    } catch (err) {
      console.error('Failed to simulate bridge message:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveBridgeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStation = stations.find((s) => s.id === modalStationId) || activeStation;
    if (!targetStation) return;

    setSavingBridge(true);
    setSaveSuccessMsg(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${targetStation.id}/bridge-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: modalWhatsappNumber,
          smsNumber: modalSmsNumber,
          smsKeywordPrefix: modalSmsPrefix,
          whatsappBridgeEnabled: modalBridgeEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.station) {
        setSaveSuccessMsg(`Studio WhatsApp Hotline updated for ${targetStation.name}!`);
        if (onStationUpdated) {
          onStationUpdated(data.station);
        }
        setTimeout(() => {
          setShowBridgeModal(false);
          setSaveSuccessMsg(null);
        }, 1500);
      } else {
        alert(data.error || 'Failed to update hotline settings.');
      }
    } catch (err) {
      console.error('Failed to save bridge settings:', err);
      alert('Network error while saving settings.');
    } finally {
      setSavingBridge(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingPost || !replyText.trim()) return;
    setSendingReply(true);
    setReplySuccess(null);
    try {
      const res = await apiFetch(`/api/owner/stations/${replyingPost.stationId}/whatsapp/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: replyingPost.id,
          message: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === replyingPost.id
              ? { ...r, replies: [...(r.replies || []), data.reply] }
              : r
          )
        );
        setReplySuccess('WhatsApp reply dispatched to listener!');
        setTimeout(() => {
          setReplyingPost(null);
          setReplyText('');
          setReplySuccess(null);
        }, 1500);
      } else {
        alert(data.error || 'Failed to send WhatsApp reply.');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Network error sending reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const isWhatsAppMsg = (r: StationFeedPost) =>
    r.channel === 'WHATSAPP' ||
    (r.authorName || '').toLowerCase().includes('whatsapp') ||
    (r.content || '').includes('WHATSAPP') ||
    r.id.startsWith('feed_bridge_') ||
    r.id.startsWith('feed_sim_') ||
    r.id.startsWith('feed_wa_');

  const filteredRequests = requests.filter((r) => {
    if (filterType === 'WHATSAPP') {
      if (!isWhatsAppMsg(r)) return false;
    } else if (filterType !== 'ALL' && r.postType !== filterType) {
      return false;
    }

    if (filterStatus === 'PENDING' && (r.playedOnAir || r.readOnAir)) return false;
    if (filterStatus === 'PLAYED' && !(r.playedOnAir || r.readOnAir)) return false;

    if (selectedStationId !== 'all' && r.stationId !== selectedStationId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = r.authorName.toLowerCase().includes(q);
      const matchSong = (r.songTitle || '').toLowerCase().includes(q);
      const matchArtist = (r.artistName || '').toLowerCase().includes(q);
      const matchContent = r.content.toLowerCase().includes(q);
      return matchAuthor || matchSong || matchArtist || matchContent;
    }

    return true;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => !r.playedOnAir && !r.readOnAir).length;
  const playedCount = requests.filter((r) => r.playedOnAir || r.readOnAir).length;
  const songsOnlyCount = requests.filter((r) => r.postType === 'SONG_REQUEST').length;
  const shoutoutsCount = requests.filter((r) => r.postType === 'SHOUTOUT').length;
  const whatsappCount = requests.filter(isWhatsAppMsg).length;

  return (
    <div className="space-y-4">
      {/* Sleek Top Studio Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Mic2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Studio Desk & Requests
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live listener interactions from web player & WhatsApp gateway
            </p>
          </div>
        </div>

        {/* Action Controls & Menu */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct WhatsApp Gateway Status Pill */}
          <button
            type="button"
            onClick={() => setShowGatewayModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            title="Configure WhatsApp Gateway & QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {activeStation?.whatsappSession?.status === 'CONNECTED'
                ? `WhatsApp Live (${activeStation?.whatsappSession?.accountType === 'BUSINESS' ? 'Business' : 'Personal'})`
                : activeStation?.whatsappNumber
                ? `${activeStation.whatsappNumber}`
                : 'Link WhatsApp (Scan QR)'}
            </span>
          </button>

          {/* Studio Controls / Simulator Tools Toggle */}
          <button
            type="button"
            onClick={() => setShowStudioTools((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showStudioTools
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Studio Controls & Simulation Tools"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Studio Tools</span>
          </button>

          <button
            type="button"
            onClick={loadRequests}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Refresh Live Messages"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Studio Controls & Tools Menu */}
      {showStudioTools && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Studio Controls & Testing Tools</h3>
            </div>
            <button
              onClick={() => setShowStudioTools(false)}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close Tools Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* WhatsApp Gateway Setup */}
            <div
              onClick={() => setShowGatewayModal(true)}
              className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer group transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    WhatsApp Gateway
                  </span>
                  <span className="text-xs font-mono font-bold text-white truncate block">
                    {activeStation?.whatsappSession?.connectedPhone || activeStation?.whatsappNumber || 'Configure QR Pair'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
                Open
              </span>
            </div>

            {/* Inbound Simulator */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Test Inbound</span>
                <span className="text-xs text-slate-300">Simulate listener</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimulateInbound('SONG')}
                  disabled={simulating}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                  title="Simulate incoming song request"
                >
                  + Song
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateInbound('SHOUTOUT')}
                  disabled={simulating}
                  className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                  title="Simulate incoming shoutout"
                >
                  + Shoutout
                </button>
              </div>
            </div>

            {/* SMS / Bridge Settings */}
            <div
              onClick={() => setShowBridgeModal(true)}
              className="bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/50 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer group transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Hotline Settings
                  </span>
                  <span className="text-xs text-white truncate block">
                    SMS & Phone Bridge
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20 group-hover:bg-sky-500/20 transition">
                Edit
              </span>
            </div>
          </div>

          {/* Quick Guide Snippet */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Listeners can send song requests directly from your radio player page or via WhatsApp QR. All inbound messages arrive here automatically in real time!</span>
          </div>
        </div>
      )}

      {/* Simulation Feedback Alert */}
      {simulationSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{simulationSuccess}</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Messages ({totalCount})
            </button>
            <button
              onClick={() => setFilterType('WHATSAPP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                filterType === 'WHATSAPP'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Messages ({whatsappCount})
            </button>
            <button
              onClick={() => setFilterType('SONG_REQUEST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'SONG_REQUEST'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎵 Song Requests ({songsOnlyCount})
            </button>
            <button
              onClick={() => setFilterType('SHOUTOUT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'SHOUTOUT'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📣 Shout-Outs ({shoutoutsCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by song, artist, listener, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Secondary Filter: Station & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            {stations.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Station:</span>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">All My Stations</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="ALL">All Statuses ({totalCount})</option>
                <option value="PENDING">In Studio Cue ({pendingCount})</option>
                <option value="PLAYED">Already Aired ({playedCount})</option>
              </select>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Showing <strong className="text-white">{filteredRequests.length}</strong> request{filteredRequests.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Full WhatsApp Studio Gateway Modal (QR Device Pairing & Meta Cloud API) */}
      {activeStation && (
        <WhatsAppGatewayModal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          station={activeStation}
          stations={stations}
          onStationUpdated={(updated) => {
            if (onStationUpdated) onStationUpdated(updated);
            loadRequests();
          }}
        />
      )}

      {/* Configure WhatsApp Listener Bridge Modal Dialog */}
      {showBridgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-slate-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure Studio WhatsApp Hotline
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect your WhatsApp number for live listener song requests & dedications.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBridgeModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Feedback Alert */}
            {saveSuccessMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{saveSuccessMsg}</span>
              </div>
            )}

            {/* Case A: Broadcaster has NO stations */}
            {stations.length === 0 ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No Radio Station Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    You need an active radio station in your broadcaster account to configure a WhatsApp listener bridge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBridgeModal(false);
                    onAddStation?.();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5 mx-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Radio Station Now</span>
                </button>
              </div>
            ) : (
              /* Case B: Form configuration */
              <form onSubmit={handleSaveBridgeSettings} className="space-y-4 text-xs">
                {/* Select Station if multiple */}
                {stations.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Select Radio Station
                    </label>
                    <select
                      value={modalStationId}
                      onChange={(e) => setModalStationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.city || st.countryCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* WhatsApp Number Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Studio WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={modalWhatsappNumber}
                      onChange={(e) => setModalWhatsappNumber(e.target.value)}
                      placeholder="e.g. +255 754 123 456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Include country code (e.g. <span className="font-mono text-slate-300">+255</span> for Tanzania, <span className="font-mono text-slate-300">+254</span> for Kenya).
                  </p>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="font-bold text-white block">Enable WhatsApp Bridge</span>
                    <span className="text-[11px] text-slate-400">
                      Show WhatsApp song request and prayer buttons on web player
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalBridgeEnabled}
                    onChange={(e) => setModalBridgeEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* SMS Bridge Optional Settings */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      SMS Hotline (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalSmsNumber}
                      onChange={(e) => setModalSmsNumber(e.target.value)}
                      placeholder="e.g. +255 700 000 000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      SMS Keyword Prefix
                    </label>
                    <input
                      type="text"
                      value={modalSmsPrefix}
                      onChange={(e) => setModalSmsPrefix(e.target.value.toUpperCase())}
                      placeholder="e.g. SONG"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Inbound Webhook Notice */}
                {modalStationId && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Inbound Webhook Endpoint:</span>
                    <code className="text-sky-400 font-mono text-[10px] break-all block">
                      /api/public/stations/{modalStationId}/bridge/inbound
                    </code>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBridgeModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBridge}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingBridge ? 'Saving Settings...' : 'Save WhatsApp Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Requests Stream */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Retrieving live studio requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center">
          <Music className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">No Studio Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When listeners submit gospel song requests or greetings via your station page, they will arrive here in real-time ready for on-air airing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isSong = req.postType === 'SONG_REQUEST';
            const isAired = req.playedOnAir || req.readOnAir;
            const isActing = actingId === req.id;
            const isCopied = copiedId === req.id;
            const isWhatsApp =
              req.channel === 'WHATSAPP' ||
              (req.authorName || '').toLowerCase().includes('whatsapp') ||
              (req.content || '').includes('WHATSAPP') ||
              req.id.startsWith('feed_bridge_') ||
              req.id.startsWith('feed_sim_') ||
              req.id.startsWith('feed_wa_');
            const isBusinessWhatsApp = req.accountType === 'BUSINESS';

            return (
              <div
                key={req.id}
                className={`flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-5 sm:p-6 transition-all hover:border-slate-700 ${
                  isAired
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isSong
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isSong ? '🎵 Song Request' : '📣 Studio Shoutout'}
                      </span>
                      {isWhatsApp && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          isBusinessWhatsApp
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isBusinessWhatsApp ? (
                            <Building2 className="w-2.5 h-2.5" />
                          ) : (
                            <MessageSquare className="w-2.5 h-2.5" />
                          )}
                          {isBusinessWhatsApp ? 'WhatsApp Business' : 'Personal WhatsApp'}
                        </span>
                      )}
                    </div>

                    {isAired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Aired on Broadcast
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-400 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        In Studio Cue
                      </span>
                    )}
                  </div>

                  {/* Song Details or Shoutout Text */}
                  {isSong && req.songTitle ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Requested Track:</span>
                        {req.artistName && (
                          <span className="text-xs font-medium text-sky-400">by {req.artistName}</span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-white">
                        "{req.songTitle}"
                      </h4>
                      {req.dedicationMessage && (
                        <p className="text-xs text-amber-300/90 pt-1 border-t border-slate-800/60">
                          <strong>Dedicated to:</strong> {req.dedicationMessage}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 border border-slate-800/60 p-3.5 rounded-xl italic">
                      "{req.content}"
                    </p>
                  )}

                  {/* Presenter WhatsApp Replies Thread */}
                  {req.replies && req.replies.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/25 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <Send className="w-2.5 h-2.5" /> Presenter WhatsApp Reply:
                      </div>
                      {req.replies.map((rep) => (
                        <p key={rep.id} className="text-slate-300 text-xs italic">
                          "{rep.message}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer and On-Air Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-200 font-semibold">{req.authorName}</span>
                      {req.senderPhone && (
                        <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {req.senderPhone}
                        </span>
                      )}
                      {req.authorCity && (
                        <span className="text-slate-400">({req.authorCity})</span>
                      )}
                    </div>
                    <div>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {req.playedAt && (
                        <span className="text-emerald-400 ml-1.5">
                          • Aired {new Date(req.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Copy to studio cue sheet */}
                    <button
                      onClick={() => copyForStudioCue(req)}
                      title="Copy details to clipboard for DJ show notes"
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Quick WhatsApp Reply to listener */}
                    {isWhatsApp && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingPost(req);
                          setReplyText(
                            `Praise the Lord ${req.authorName}! Thank you for tuning in to ${activeStation?.name || 'our station'}. We have received your request!`
                          );
                        }}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition text-xs flex items-center gap-1 cursor-pointer"
                        title="Send direct WhatsApp reply to listener"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reply</span>
                      </button>
                    )}

                    {/* Mark Played Action */}
                    {!isAired ? (
                      <button
                        onClick={() => handleMarkPlayed(req.id)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isActing ? 'Updating...' : isSong ? 'Play On-Air' : 'Read On-Air'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkPlayed(req.id)}
                        disabled={isActing}
                        title="Already broadcast. Click to re-play on show."
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-medium text-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aired
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick WhatsApp Reply Modal */}
      {replyingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Reply to {replyingPost.authorName}</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {replyingPost.senderPhone || 'WhatsApp Listener'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingPost(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {replySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{replySuccess}</span>
              </div>
            )}

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-300 italic">
              "{replyingPost.content}"
            </div>

            {/* Quick response chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Radio Cues:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      `Praise the Lord ${replyingPost.authorName}! Your song request is queued for on-air broadcast now!`
                    )
                  }
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  🎵 Song Queued
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      `Shalom ${replyingPost.authorName}! Our live studio team has received your prayer petition. Be blessed!`
                    )
                  }
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  🙏 Prayer Received
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      `Greetings ${replyingPost.authorName}! Thank you for listening to our live broadcast today!`
                    )
                  }
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  📣 Warm Greeting
                </button>
              </div>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your WhatsApp message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReplyingPost(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
