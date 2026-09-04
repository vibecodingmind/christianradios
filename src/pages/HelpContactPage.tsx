import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Mail,
  MessageSquare,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Send,
  RefreshCw,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface HelpContactPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export function HelpContactPage({ onNavigate, onOpenAuth }: HelpContactPageProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'report'>('faq');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactTopic, setContactTopic] = useState('GENERAL');
  const [contactMessage, setContactMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'Help & Contact Support — Christian Radios';
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSubmitSuccess(false);

    try {
      const res = await apiFetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject.trim(),
          topic: contactTopic,
          message: contactMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitSuccess(true);
        setSubmitMessage(data.message || 'Thank you! Your message has been received.');
        setContactSubject('');
        setContactMessage('');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit inquiry.');
      }
    } catch {
      setErrorMsg('Network error while submitting contact message.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqList = [
    {
      cat: 'General & Listening',
      items: [
        {
          q: 'Is listening to radio stations free on Christian Radios?',
          a: 'Yes, 100% free! You can discover and stream live Christian radio stations 24/7 without creating an account. Creating a free account unlocks favorites, following stations, and prayer wall posts.',
        },
        {
          q: 'Why is a radio stream not playing or buffering?',
          a: 'Streams rely on the station provider server. If a stream buffers or fails, click "Retry Stream" on the player or test if your browser allows HTTP/HTTPS audio feeds. You can also click "Report Issue" to notify our engineering team.',
        },
        {
          q: 'How do I install Christian Radios as a mobile app?',
          a: 'Christian Radios is a Progressive Web App (PWA). Click the "Install App" button in the header or menu, or tap "Add to Home Screen" in your mobile Safari / Chrome browser for instant access.',
        },
      ],
    },
    {
      cat: 'Radio Owners & Streaming',
      items: [
        {
          q: 'How do I add or import my radio station?',
          a: 'Sign up as a Radio Owner, go to your Workspace Dashboard, and click "Add Station" or "Import Radio". Paste your Shoutcast, Icecast, HLS, Zeno Media, or RadioKing URL to automatically initialize your stream.',
        },
        {
          q: 'How do failover backup streams work?',
          a: 'In your Station Settings, enter a secondary backup stream URL. If your primary stream suffers an outage, our player automatically switches to the failover stream to prevent broadcast interruption.',
        },
        {
          q: 'What is the SSRF Security Check?',
          a: 'To prevent network attacks, our engine automatically verifies stream URLs against loopbacks, link-local addresses, and private IP blocks. Valid public streaming URLs pass validation instantly.',
        },
      ],
    },
    {
      cat: 'Giving & Financial Support',
      items: [
        {
          q: 'How do station donations and giving work?',
          a: 'Listeners can bless stations through the Giving Hub or station details page using Pesapal. Supported methods include Vodacom M-Pesa, Airtel Money, Tigo Pesa, Visa, and MasterCard.',
        },
        {
          q: 'Are donations verified?',
          a: 'Yes! Every completed transaction generates an instant printable verified receipt with a cryptographic tracking ID.',
        },
      ],
    },
  ];

  return (
    <div id="help-contact-page-root" className="space-y-8 pb-24">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          Help Center & Support Desk
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          How Can We Help You Today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Explore frequently asked questions, send our support team a direct message, or report a stream issue.
        </p>

        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'faq'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Frequently Asked Questions
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contact'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Contact Support Form
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'report'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Report Stream Outage
          </button>
        </div>
      </div>

      {/* TAB 1: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {faqList.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h2 className="text-base font-bold text-sky-400 uppercase tracking-wider text-xs px-2">
                {group.cat}
              </h2>
              <div className="space-y-2">
                {group.items.map((item, idx) => {
                  const globalIdx = gIdx * 10 + idx;
                  const isOpen = openFaqIndex === globalIdx;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : globalIdx)}
                        className="w-full text-left p-4 font-bold text-sm text-white flex items-center justify-between gap-4 hover:bg-slate-800/40"
                      >
                        <span>{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CONTACT FORM */}
      {activeTab === 'contact' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" />
              Send Us a Support Message
            </h2>
            <p className="text-xs text-slate-400">
              Our engineering and broadcaster support team will respond within 24 hours.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-300">{submitMessage}</p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Joseph"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Inquiry Topic</label>
                  <select
                    value={contactTopic}
                    onChange={(e) => setContactTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="GENERAL">General Inquiry</option>
                    <option value="BROADCASTER_SUPPORT">Broadcaster Account / Subscription</option>
                    <option value="STREAM_ISSUE">Stream Outage / Audio Quality</option>
                    <option value="GIVING_PAYMENT">Donations & Payouts</option>
                    <option value="COPYRIGHT">Copyright / DMCA Concern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of inquiry..."
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe your inquiry or technical concern in detail..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? 'Submitting Inquiry...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: REPORT STREAM OUTAGE */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Report a Stream Issue or Station Outage</h2>
              <p className="text-xs text-slate-400">Help us keep the directory clean and 100% online.</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            If you encounter a station that is offline, playing silent audio, displaying incorrect station metadata, or violating broadcasting policies:
          </p>

          <ol className="space-y-2 text-xs text-slate-300 list-decimal pl-4">
            <li>Open the specific station page or player modal.</li>
            <li>Click the <strong>"Report Issue"</strong> button on the bottom player bar or station header.</li>
            <li>Select the report category (e.g. Stream Offline, Audio Quality, Copyright Concern).</li>
            <li>Our automated stream health monitor will ping the endpoint and notify the station owner.</li>
          </ol>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('directory')}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
            >
              Browse Directory & Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
