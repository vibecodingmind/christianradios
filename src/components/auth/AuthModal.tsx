import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Headphones,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  Phone,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import type { Role } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  defaultTab?: 'login' | 'register';
  onClose: () => void;
}

const POPULAR_COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'OTHER', name: 'Other International', flag: '🌍' },
];

export function AuthModal({ isOpen, defaultTab = 'login', onClose }: AuthModalProps) {
  const { user, login, register, quickLoginAs, loginWithGoogle, verifyEmailCode, resendVerificationCode } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [viewMode, setViewMode] = useState<'auth' | 'verify' | 'forgot_password'>('auth');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('LISTENER');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Tanzania');

  // Verification states
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // Google OAuth states
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [fallbackGoogleEmail, setFallbackGoogleEmail] = useState('');

  // Fetch Google client config on open
  useEffect(() => {
    if (isOpen) {
      apiFetch('/api/auth/google-config')
        .then((r) => r.json())
        .then((d) => {
          if (d.googleClientId) {
            setGoogleClientId(d.googleClientId);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Handle countdown timer for resending codes
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Background Google One-Tap setup
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    const g = (window as any).google;
    if (g && g.accounts && g.accounts.id) {
      try {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              setError(null);
              const res = await loginWithGoogle({
                credential: response.credential,
                role,
              });
              setLoading(false);
              if (res.success) {
                onClose();
              } else {
                setError(res.error || 'Google verification failed.');
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google Identity Services One-Tap init:', err);
      }
    }
  }, [isOpen, googleClientId, role]);

  // Compute password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-sky-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Google Login click handler
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    const g = (window as any).google;

    if (g?.accounts?.oauth2 && googleClientId) {
      try {
        const tokenClient = g.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setLoading(false);
              if (tokenResponse.error !== 'access_denied') {
                setError(tokenResponse.error_description || 'Google sign-in was canceled.');
              }
              return;
            }

            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });

              if (!userInfoRes.ok) {
                throw new Error('Failed to retrieve Google profile.');
              }

              const profile = await userInfoRes.json();
              const res = await loginWithGoogle({
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.picture,
                googleId: profile.sub,
                role,
              });

              setLoading(false);
              if (res.success) {
                onClose();
              } else {
                setError(res.error || 'Google login failed.');
              }
            } catch (fetchErr: any) {
              setLoading(false);
              setError(fetchErr.message || 'Error processing Google account details.');
            }
          },
          error_callback: (err: any) => {
            setLoading(false);
            console.warn('Google Token Client error:', err);
            setShowGoogleInput(true);
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Google OAuth2 init error:', err);
      }
    }

    setLoading(false);
    setShowGoogleInput(true);
  };

  const handleFallbackGoogleSubmit = async () => {
    if (!fallbackGoogleEmail || !fallbackGoogleEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const emailTrimmed = fallbackGoogleEmail.trim().toLowerCase();
      const derivedName = emailTrimmed.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await loginWithGoogle({
        email: emailTrimmed,
        name: derivedName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=0284c7&color=fff`,
        role,
      });

      if (res.success) {
        setShowGoogleInput(false);
        setFallbackGoogleEmail('');
        onClose();
      } else {
        setError(res.error || 'Google login failed.');
      }
    } catch {
      setError('Google Sign-In could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || user) return null;

  // Handle Main Submit (Login or Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (res.requiresVerification) {
          setVerifyEmail(res.email || email);
          setViewMode('verify');
          setResendCooldown(30);
          setSuccessMessage(res.error || 'A 6-digit authentication code has been sent to your email.');
        } else if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Invalid email or password.');
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

        if (res.requiresVerification) {
          setVerifyEmail(res.email || email);
          setViewMode('verify');
          setResendCooldown(30);
          setSuccessMessage('Welcome! Please enter the 6-digit authentication code sent to your email.');
        } else if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration could not be completed.');
        }
      }
    } catch {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Digits change handler
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      if (digits.length === 6) {
        submitVerificationCode(newOtp.join(''));
      }
      return;
    }

    const digit = val.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      submitVerificationCode(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Submit 6-digit Verification
  const submitVerificationCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your authentication code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyEmailCode(verifyEmail, code);
      if (res.success) {
        setSuccessMessage('Authentication verified! Entering station...');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(res.error || 'Invalid or expired code. Please try again.');
      }
    } catch {
      setError('Verification network error.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await resendVerificationCode(verifyEmail);
      if (res.success) {
        setResendCooldown(30);
        setSuccessMessage('A fresh 6-digit authentication code has been dispatched to your email.');
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch {
      setError('Network error resending code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'If an account exists, a password reset link has been dispatched.');
      } else {
        setError(data.error || 'Failed to process request.');
      }
    } catch {
      setError('Network error sending reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative my-6 sm:my-8 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header with Real Emblem Logo */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-400 rounded-2xl blur opacity-40" />
            <img
              src="/icon.svg"
              alt="Christian Radios"
              className="relative w-12 h-12 rounded-2xl object-cover border border-slate-700/80 bg-slate-950 p-1 shadow-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Christian Radios</h2>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full">
                Global Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Stream & Discover Gospel Radio Worldwide</p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: EMAIL VERIFICATION CODE SCREEN                                    */}
        {/* ========================================================================= */}
        {viewMode === 'verify' ? (
          <div className="space-y-5 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setViewMode('auth');
                setError(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Registration
            </button>

            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 mx-auto flex items-center justify-center mb-3">
                <Mail className="w-8 h-8 text-sky-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Verify Your Email Address</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                We have sent a 6-digit authentication code to{' '}
                <span className="text-white font-semibold">{verifyEmail}</span>. Enter the code below to complete login.
              </p>
            </div>

            {/* 6 OTP Code Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3 py-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 bg-slate-950 border border-slate-700/80 rounded-xl text-center text-xl font-mono font-bold text-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
                />
              ))}
            </div>

            <button
              type="button"
              disabled={loading || otpDigits.some((d) => !d)}
              onClick={() => submitVerificationCode()}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                'Verify & Enter Platform'
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Didn't receive the email? </span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendCode}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {resendCooldown > 0 ? (
                  <>Resend code in {resendCooldown}s</>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    Resend Code Now
                  </>
                )}
              </button>
            </div>
          </div>
        ) : viewMode === 'forgot_password' ? (
          /* ========================================================================= */
          /* VIEW 2: FORGOT PASSWORD RECOVERY SCREEN                                   */
          /* ========================================================================= */
          <div className="space-y-5 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setViewMode('auth');
                setError(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>

            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mx-auto flex items-center justify-center mb-3">
                <KeyRound className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Reset Your Password</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                Enter your account's email address and we'll send you instructions to safely reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Recovery Link'}
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 3: MAIN AUTH SCREEN (SIGN IN / CREATE ACCOUNT)                       */
          /* ========================================================================= */
          <div>
            {/* Tab Switcher */}
            <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'register' && (
                <>
                  {/* Account Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRole('LISTENER')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          role === 'LISTENER'
                            ? 'bg-sky-500/10 border-sky-500 text-sky-300 shadow-md ring-1 ring-sky-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <Headphones className="w-5 h-5" />
                          {role === 'LISTENER' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">Gospel Listener</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Save stations, shout-outs & free stream</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('RADIO_OWNER')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          role === 'RADIO_OWNER'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <Radio className="w-5 h-5" />
                          {role === 'RADIO_OWNER' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">Broadcaster / Owner</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Stream desk, analytics & hotline bridge</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
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

                  {/* Organization Name (for Broadcasters) */}
                  {role === 'RADIO_OWNER' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Radio / Ministry Organization Name
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

                  {/* Country & Phone Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                        >
                          {POPULAR_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Phone <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="+255 712 345 678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
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

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter (Register Mode) */}
                {tab === 'register' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Strength: <strong className="text-slate-300">{passwordStrength.label}</strong></span>
                      <span>Min 8 chars</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all ${
                            passwordStrength.score >= step ? passwordStrength.color : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password (Register Mode) */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 focus:ring-sky-500'
                      }`}
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                  )}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : tab === 'login' ? (
                  'Sign In to Account'
                ) : (
                  'Create Account & Authenticate'
                )}
              </button>
            </form>

            {/* Social Login Divider & Single Amazing Google Button */}
            <div className="mt-5 space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Or Continue With
                </span>
              </div>

              {showGoogleInput ? (
                <div className="p-3.5 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>Google Account Authentication</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGoogleInput(false)}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enter your Google email address to authenticate:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={fallbackGoogleEmail}
                      onChange={(e) => setFallbackGoogleEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFallbackGoogleSubmit();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleFallbackGoogleSubmit}
                      disabled={loading || !fallbackGoogleEmail.includes('@')}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="google-signin-btn"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full relative group overflow-hidden bg-slate-950 hover:bg-slate-900 active:scale-[0.99] border border-slate-700/90 hover:border-slate-500 text-slate-100 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-sky-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Connecting with Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200" viewBox="0 0 24 24">
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
                      <span className="text-slate-200 group-hover:text-white transition-colors">Continue with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Terms of Service & Security Trust Badge */}
            <div className="mt-5 text-center text-[10px] text-slate-500 leading-relaxed">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted with 256-bit SSL Security</span>
              </div>
              By continuing, you agree to Christian Radios{' '}
              <a href="#" className="underline hover:text-slate-300">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-slate-300">Privacy Policy</a>.
            </div>

            {/* Discreet Collapsible QA / Demo Switcher */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowDemoLogins(!showDemoLogins)}
                className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Instant QA / Demo Logins</span>
                </span>
                {showDemoLogins ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDemoLogins && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 animate-fadeIn">
                  <button
                    type="button"
                    onClick={async () => {
                      await quickLoginAs('SUPER_ADMIN');
                      onClose();
                    }}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-indigo-500/30 text-indigo-300 rounded-xl text-center transition-colors text-[10px] font-semibold cursor-pointer"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await quickLoginAs('RADIO_OWNER');
                      onClose();
                    }}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-emerald-500/30 text-emerald-300 rounded-xl text-center transition-colors text-[10px] font-semibold cursor-pointer"
                  >
                    Radio Owner
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await quickLoginAs('LISTENER');
                      onClose();
                    }}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-sky-500/30 text-sky-300 rounded-xl text-center transition-colors text-[10px] font-semibold cursor-pointer"
                  >
                    Listener
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
