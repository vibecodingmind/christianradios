import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Lock,
  Cookie,
  Copyright,
  HeartHandshake,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'terms' | 'privacy' | 'cookies' | 'copyright' | 'giving' | 'refund';
  onNavigate: (view: string, param?: string) => void;
}

export function LegalPage({ initialTab = 'terms', onNavigate }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cookies' | 'copyright' | 'giving' | 'refund'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const titles: Record<string, string> = {
      terms: 'Terms of Service — Christian Radios',
      privacy: 'Privacy Policy — Christian Radios',
      cookies: 'Cookie Policy — Christian Radios',
      copyright: 'Copyright & DMCA Policy — Christian Radios',
      giving: 'Station Giving & Donation Terms — Christian Radios',
      refund: 'Refund & Cancellation Policy — Christian Radios',
    };
    document.title = titles[activeTab] || 'Legal Policies — Christian Radios';
  }, [activeTab]);

  return (
    <div id="legal-page-root" className="space-y-8 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-3 shadow-xl text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Legal & Governance Framework
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Terms, Privacy & Platform Governance
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Clear, transparent policies for listeners, radio station owners, donors, and content rightsholders.
        </p>

        {/* Legal Navigation Subtabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'terms'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cookies'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Cookie Policy
          </button>
          <button
            onClick={() => setActiveTab('copyright')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'copyright'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Copyright / DMCA
          </button>
          <button
            onClick={() => setActiveTab('giving')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'giving'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Giving & Donation Terms
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'refund'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Refund & Cancellation Policy
          </button>
        </div>
      </div>

      {/* Main Content Policy Box */}
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed shadow-xl">
        {/* 1. TERMS OF SERVICE */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Terms of Service
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. Acceptance of Terms</h3>
              <p>
                By accessing or using the Christian Radios SaaS directory platform ("Christian Radios", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. Core Purpose & Directory Nature</h3>
              <p>
                Christian Radios is a web directory and aggregation streaming platform dedicated to discovering live 24/7 Christian radio feeds. We do not host original audio recordings or modify broadcaster audio feeds; we index public streaming endpoints (Shoutcast, Icecast, AAC, HLS) provided by third-party radio station owners.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">3. Broadcaster & Station Owner Responsibilities</h3>
              <p>
                Station owners and representatives who submit or claim a listing guarantee that:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>They hold legitimate authorization to broadcast the radio stream.</li>
                <li>Their content complies with applicable broadcasting and copyright laws.</li>
                <li>Stream URLs submitted pass SSRF firewall requirements (no internal or private network IP addresses).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">4. Platform Subscriptions & Billing</h3>
              <p>
                Broadcaster subscription packages (Free, Pro, Enterprise) are billed on a recurring monthly or annual basis as specified during checkout. Subscriptions renew automatically unless cancelled prior to the renewal date.
              </p>
            </section>
          </div>
        )}

        {/* 2. PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Privacy Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. Information We Collect</h3>
              <p>
                We collect personal information necessary to deliver and secure our platform:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Account Details:</strong> Name, email address, password hashes, and profile settings.</li>
                <li><strong>Broadcaster Details:</strong> Organization name, station metadata, stream URLs, and payout information.</li>
                <li><strong>Telemetry Data:</strong> IP address, user agent, station playback events, and diagnostic logs.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. How We Use Information</h3>
              <p>
                We use your data strictly to authenticate users, manage stream monitoring telemetry, process financial transactions via Pesapal, prevent fraudulent attacks, and send broadcast notifications.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">3. Data Sharing & Security</h3>
              <p>
                We do not sell user data to third parties. We share data only with essential infrastructure providers (e.g., Pesapal for payment settlement and Google Identity for OAuth logins).
              </p>
            </section>
          </div>
        )}

        {/* 3. COOKIE POLICY */}
        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Cookie className="w-5 h-5 text-amber-400" />
                Cookie Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. Use of Cookies</h3>
              <p>
                Christian Radios uses essential cookies and local storage tokens to maintain user sessions, store audio volume/player state, and remember your favorite radio stations.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. Types of Cookies Used</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li><strong>Strictly Necessary:</strong> HTTP-only authentication tokens (`auth_token`) for session verification.</li>
                <li><strong>Functional:</strong> Local storage settings for audio volume, current station, and sleep timer.</li>
                <li><strong>Analytics Telemetry:</strong> Minimal playback event cookies to count station listening stats.</li>
              </ul>
            </section>
          </div>
        )}

        {/* 4. COPYRIGHT / DMCA POLICY */}
        {activeTab === 'copyright' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Copyright className="w-5 h-5 text-amber-400" />
                Copyright & DMCA Complaint Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. DMCA Notice & Takedown Policy</h3>
              <p>
                Christian Radios respects intellectual property rights. Because we index publicly accessible third-party streams, rightsholders who believe a stream indexed on our platform infringes copyright may submit a notice.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. How to File a Copyright Inquiry</h3>
              <p>
                Please send formal written notification to our support desk via our <button onClick={() => onNavigate('help')} className="text-amber-400 underline font-semibold">Help & Contact Page</button> selecting topic "Copyright / DMCA Concern". Include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Identification of the copyrighted work claimed to be infringed.</li>
                <li>The exact URL / station listing on Christian Radios.</li>
                <li>Your contact details and a statement under penalty of perjury.</li>
              </ul>
            </section>
          </div>
        )}

        {/* 5. GIVING & DONATION TERMS */}
        {activeTab === 'giving' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-400" />
                Station Giving & Donation Terms
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. Listener Contributions</h3>
              <p>
                Listener donations made via the Giving Hub or station page are processed through Pesapal multi-channel payment gateway (M-Pesa, Tigo Pesa, Airtel Money, Cards). Every completed donation yields an official verified electronic receipt with a unique tracking reference.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. Broadcaster Settlement & Eligibility</h3>
              <p>
                Donation funds credited to verified radio station owner ledgers are eligible for payout disbursement. Stations must maintain active verified broadcaster status to request disbursements.
              </p>
            </section>
          </div>
        )}

        {/* 6. REFUND & CANCELLATION POLICY */}
        {activeTab === 'refund' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Refund & Cancellation Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: September 2026</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">1. Subscription Cancellations</h3>
              <p>
                Broadcasters may cancel auto-renewing subscriptions at any time via the Owner Dashboard. Your plan remains active until the conclusion of the paid billing period.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">2. Refund Requests</h3>
              <p>
                Subscription fee refunds are evaluated on a case-by-case basis within 7 days of initial charge if a technical outage on our platform prevented service delivery. Listener ministry donations are non-refundable once disbursed to the recipient radio station.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
