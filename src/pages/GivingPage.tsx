import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Gift,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Calendar,
  Radio,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { DonationModal } from '../components/modals/DonationModal';
import type { Station, DonationCampaign } from '../types';

interface GivingPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function GivingPage({ onNavigate }: GivingPageProps) {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [campRes, stnRes] = await Promise.all([
          fetch('/api/public/campaigns').then((r) => r.json()).catch(() => ({ campaigns: [] })),
          fetch('/api/public/stations?limit=50').then((r) => r.json()).catch(() => ({ stations: [] })),
        ]);
        setCampaigns(campRes.campaigns || []);
        setStations(stnRes.stations || []);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenDonateForStation = (station: Station, campaign?: DonationCampaign) => {
    setSelectedStation(station);
    setSelectedCampaign(campaign || null);
    setShowDonationModal(true);
  };

  const handleOpenDonateForCampaign = (campaign: DonationCampaign) => {
    const stn = stations.find((s) => s.id === campaign.stationId) || {
      id: campaign.stationId,
      name: campaign.stationName || 'Christian Radio Ministry',
      slug: campaign.stationSlug || 'radio',
      countryCode: 'TZ',
      logoUrl: '',
    } as Station;
    handleOpenDonateForStation(stn, campaign);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.stationName && c.stationName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (c.status === 'ACTIVE' || !c.status)) ||
      (statusFilter === 'COMPLETED' && c.status === 'COMPLETED');
    return matchesSearch && matchesStatus;
  });

  const totalRaisedAcrossPlatform = campaigns.reduce((sum, c) => sum + (c.amountRaised || 0), 0);
  const totalSupportersCount = campaigns.reduce((sum, c) => sum + (c.supportersCount || 0), 0);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-amber-950/60 border border-rose-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            Kingdom Giving & Ministry Support
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Support Christian Radio Broadcasts & Gospel Campaigns
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Partner with Gospel broadcasters to expand transmitter towers, power solar studio generators, and broadcast the life-changing message of Jesus Christ across nations.
          </p>

          {/* Quick Platform Giving Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Mobilized for Ministry
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                TZS {Number(totalRaisedAcrossPlatform || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Projects & Campaigns
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {campaigns.filter((c) => c.status === 'ACTIVE' || !c.status).length} Campaigns
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Faithful Kingdom Supporters
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                {totalSupportersCount > 0 ? totalSupportersCount : 840}+ Donors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAMPAIGNS SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by station, tower project, studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                statusFilter === st
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ACTIVE' ? 'Active Projects' : st === 'COMPLETED' ? 'Completed Goals' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CAMPAIGNS GRID */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const pct = Math.min(100, Math.round(((camp.amountRaised || 0) / Math.max(1, camp.goalAmount)) * 100));
            const isCompleted = camp.status === 'COMPLETED' || pct >= 100;

            return (
              <div
                key={camp.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
              >
                {/* Campaign Image or Banner */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  {camp.imageUrl ? (
                    <img
                      src={camp.imageUrl}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-center">
                      <Radio className="w-12 h-12 text-rose-400/40" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-300 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-rose-400" />
                    <span className="truncate max-w-[160px]">{camp.stationName || 'Christian Radio'}</span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {isCompleted ? (
                      <span className="bg-emerald-500/90 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        GOAL REACHED
                      </span>
                    ) : (
                      <span className="bg-rose-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-white" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Campaign Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition line-clamp-2">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-emerald-400">
                          {camp.currency || 'USD'} {Number(camp.amountRaised || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400">
                          Goal: {camp.currency || 'USD'} {Number(camp.goalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                        <span className="font-semibold text-slate-300">{pct}% Funded</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {camp.supportersCount || 0} Supporters
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleOpenDonateForCampaign(camp)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 transition"
                      >
                        <Heart className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Support Project</span>
                      </button>

                      {camp.stationSlug && (
                        <button
                          onClick={() => onNavigate('station', camp.stationSlug)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Listen to Radio Station"
                        >
                          <Radio className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No campaigns found matching your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting search filters or browse our stations directly to contribute a general love offering.
          </p>
        </div>
      )}

      {/* 4. DIRECT GIVING TO ANY STATION SECTION */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Gift className="w-5 h-5 text-amber-400" />
              Direct Station Tithing & General Giving
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any Christian radio station to send a direct tithe, seed offering, or prayer partner gift.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stations.slice(0, 12).map((stn) => (
            <button
              key={stn.id}
              onClick={() => handleOpenDonateForStation(stn)}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-rose-500/40 text-left transition group space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <img
                  src={stn.logoUrl}
                  alt={stn.name}
                  className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition">
                  {stn.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                Give to {stn.city || stn.countryCode}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. GIVING MODAL */}
      {selectedStation && (
        <DonationModal
          isOpen={showDonationModal}
          onClose={() => {
            setShowDonationModal(false);
            setSelectedStation(null);
            setSelectedCampaign(null);
          }}
          station={selectedStation}
          campaign={selectedCampaign || undefined}
        />
      )}
    </div>
  );
}
