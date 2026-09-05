import React, { useState, useEffect } from 'react';
import { ShieldCheck, Printer, Heart, ArrowLeft, Radio, Download, Share2, Check } from 'lucide-react';
import type { Donation, Station } from '../types';

interface DonationReceiptPageProps {
  receiptId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export function DonationReceiptPage({ receiptId, onNavigate }: DonationReceiptPageProps) {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const trackingId = receiptId || params.get('id') || params.get('trackingId');

  useEffect(() => {
    if (!trackingId) {
      setError('Receipt tracking ID missing.');
      setLoading(false);
      return;
    }

    fetch(`/api/public/donations/receipt/${trackingId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Receipt not found');
        return res.json();
      })
      .then((data) => {
        setDonation(data.donation);
        setStation(data.station);
      })
      .catch((err) => {
        setError(err.message || 'Unable to find donation receipt');
      })
      .finally(() => setLoading(false));
  }, [trackingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Retrieving verified donation receipt...</p>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <Heart className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Receipt Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Please check your tracking ID and try again.'}</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Radios</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Top Watermark / Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg print:border print:border-slate-400">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white print:text-black tracking-tight">
                Christian Radios
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">Official Ministry Contribution Receipt</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 print:text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFIED CONTRIBUTION</span>
            </span>
            <p className="font-mono text-xs text-slate-400 print:text-slate-600 mt-1">
              Receipt: <strong>{donation.trackingId}</strong>
            </p>
          </div>
        </div>

        {/* Amount & Beneficiary Header */}
        <div className="bg-slate-950 print:bg-slate-50 p-6 rounded-2xl border border-slate-800 print:border-slate-300 mb-6 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">
            Total Blessing Amount
          </span>
          <div className="text-3xl sm:text-4xl font-black text-rose-400 print:text-rose-600 font-mono">
            {donation.currency || 'USD'} ${(donation.amount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-300 print:text-slate-700">
            Designated for: <strong className="text-amber-300 print:text-amber-700">{donation.fundType.replace('_', ' ')}</strong>
          </p>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="space-y-3 text-xs mb-8">
          <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-600">Recipient Radio Ministry:</span>
            <strong className="text-white print:text-black font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-sky-400" />
              {donation.stationName}
            </strong>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-600">Donor Name:</span>
            <strong className="text-white print:text-black font-semibold">{donation.donorName}</strong>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-600">Donor Email:</span>
            <span className="text-slate-300 print:text-slate-700">{donation.donorEmail}</span>
          </div>

          {donation.donorPhone && (
            <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-600">Mobile Money Phone:</span>
              <span className="text-slate-300 print:text-slate-700">{donation.donorPhone}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-600">Payment Method:</span>
            <span className="font-semibold text-slate-200 print:text-slate-800">{donation.paymentMethod}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/80 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-600">Date & Time:</span>
            <span className="text-slate-200 print:text-slate-800">
              {new Date(donation.createdAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'medium',
              })}
            </span>
          </div>

          {donation.message && (
            <div className="py-2 border-b border-slate-800/80 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-600 block mb-1">Encouragement Note:</span>
              <p className="italic text-slate-300 print:text-slate-700 bg-slate-950/40 print:bg-slate-100 p-2.5 rounded-xl">
                “{donation.message}”
              </p>
            </div>
          )}
        </div>

        {/* Biblical Blessing & Footer */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-center space-y-2">
          <blockquote className="text-xs italic text-slate-400 print:text-slate-600">
            “Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously.” — 2 Corinthians 9:6
          </blockquote>
          <p className="text-[11px] text-slate-500 print:text-slate-500">
            Christian Radios Global Ministry Network • christianradiosorg@gmail.com • www.christianradios.org
          </p>
        </div>
      </div>
    </div>
  );
}
