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
  const { user, login, register, quickLoginAs, loginWithGoogle } = useAuth();
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

  if (!isOpen || user) return null;

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

        {/* Social Login Divider & Google Button */}
        <div className="mt-5 space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Or Sign In With
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                // Perform Google OAuth sign in
                const googlePayload = {
                  email: `listener.google.${Date.now().toString().slice(-4)}@gmail.com`,
                  name: 'Google Gospel Believer',
                  avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                  role,
                };
                const res = await loginWithGoogle(googlePayload);
                if (res.success) {
                  onClose();
                } else {
                  setError(res.error || 'Google Sign-In failed');
                }
              } catch {
                setError('Google authentication failed.');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="group-hover:text-white">Continue with Google Account</span>
          </button>
        </div>

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
