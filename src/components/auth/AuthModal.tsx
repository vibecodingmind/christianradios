import React, { useState } from 'react';
import { X, Radio, Headphones, ShieldCheck, Mail, Lock, User as UserIcon, Building, Phone, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  defaultTab?: 'login' | 'register';
  onClose: () => void;
}

export function AuthModal({ isOpen, defaultTab = 'login', onClose }: AuthModalProps) {
  const { login, register, quickLoginAs } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('LISTENER');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Tanzania');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await register({
          email,
          password,
          name,
          role,
          organizationName: role === 'RADIO_OWNER' ? organizationName : undefined,
          phone,
          country,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Christian Radios</h2>
            <p className="text-xs text-slate-400">Stream & Discover Gospel Radio</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('LISTENER')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      role === 'LISTENER'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Headphones className="w-5 h-5 mb-2" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">Listener</div>
                      <div className="text-[10px] text-slate-400">Save favorites & history</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('RADIO_OWNER')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      role === 'RADIO_OWNER'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Radio className="w-5 h-5 mb-2" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">Broadcaster</div>
                      <div className="text-[10px] text-slate-400">Publish & manage stations</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pastor David Mwangi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {role === 'RADIO_OWNER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Radio / Organization Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Upendo FM Broadcast Network"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Instant Demo Logins (QA & Review)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={async () => {
                await quickLoginAs('SUPER_ADMIN');
                onClose();
              }}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 rounded-xl text-center transition-colors text-[11px] font-medium"
            >
              Super Admin
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('RADIO_OWNER');
                onClose();
              }}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 rounded-xl text-center transition-colors text-[11px] font-medium"
            >
              Radio Owner
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('LISTENER');
                onClose();
              }}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-sky-500/30 text-sky-300 rounded-xl text-center transition-colors text-[11px] font-medium"
            >
              Listener
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
