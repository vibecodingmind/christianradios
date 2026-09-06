import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, OwnerProfile, Subscription, SubscriptionPlan, Role } from '../types';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  ownerProfile?: OwnerProfile;
  subscription?: Subscription;
  plan?: SubscriptionPlan;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: Role;
    organizationName?: string;
    phone?: string;
    country?: string;
  }) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailToken: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLoginAs: (role: 'SUPER_ADMIN' | 'RADIO_OWNER' | 'LISTENER') => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    organizationName?: string;
    bio?: string;
    website?: string;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (data: {
    credential?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    role?: Role;
  }) => Promise<{ success: boolean; error?: string }>;
  becomeOwner: (data: {
    organizationName?: string;
    phone?: string;
    country?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | undefined>(undefined);
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);
  const [plan, setPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setOwnerProfile(data.ownerProfile);
          setSubscription(data.subscription);
          setPlan(data.plan);
          return;
        }
      }
      if (!getAuthToken()) {
        setUser(null);
        setOwnerProfile(undefined);
        setSubscription(undefined);
        setPlan(undefined);
      }
    } catch (err) {
      console.error('refreshUser error:', err);
      if (!getAuthToken()) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: data.email,
          error: data.message,
        };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.ownerProfile) {
        setOwnerProfile(data.ownerProfile);
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (formData: {
    email: string;
    password: string;
    name: string;
    role: Role;
    organizationName?: string;
    phone?: string;
    country?: string;
    referralCode?: string;
  }) => {
    try {
      const storedRef = localStorage.getItem('cr_referral_code') || undefined;
      const payload = {
        ...formData,
        referralCode: formData.referralCode || storedRef,
      };

      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.removeItem('cr_referral_code');

      if (data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: data.email,
        };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.ownerProfile) {
        setOwnerProfile(data.ownerProfile);
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    try {
      const res = await apiFetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed.' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.ownerProfile) {
        setOwnerProfile(data.ownerProfile);
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during verification.' };
    }
  };

  const verifyEmailToken = async (email: string, token: string) => {
    try {
      const res = await apiFetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Verification link is invalid or expired.' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.ownerProfile) {
        setOwnerProfile(data.ownerProfile);
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during link verification.' };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const res = await apiFetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to resend code.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error resending verification code.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      removeAuthToken();
      setUser(null);
      setOwnerProfile(undefined);
      setSubscription(undefined);
      setPlan(undefined);
    }
  };

  const quickLoginAs = async (role: 'SUPER_ADMIN' | 'RADIO_OWNER' | 'LISTENER') => {
    const credentials = {
      SUPER_ADMIN: { email: 'admin@christianradios.org', password: 'Admin@2026!' },
      RADIO_OWNER: { email: 'owner@radiomaria.tz', password: 'Owner@2026!' },
      LISTENER: { email: 'listener@christianradios.org', password: 'Listener@2026!' },
    };
    const cred = credentials[role];
    if (cred) {
      await login(cred.email, cred.password);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    phone?: string;
    organizationName?: string;
    bio?: string;
    website?: string;
    avatarUrl?: string;
  }) => {
    try {
      const res = await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to update profile' };
      }
      setUser(json.user);
      if (json.ownerProfile) setOwnerProfile(json.ownerProfile);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  const loginWithGoogle = async (googlePayload: {
    credential?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    role?: Role;
    referralCode?: string;
  }) => {
    try {
      const storedRef = localStorage.getItem('cr_referral_code') || undefined;
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...googlePayload,
          referralCode: googlePayload.referralCode || storedRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed' };
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.ownerProfile) {
        setOwnerProfile(data.ownerProfile);
      }
      localStorage.removeItem('cr_referral_code');
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during Google login.' };
    }
  };

  const becomeOwner = async (data: {
    organizationName?: string;
    phone?: string;
    country?: string;
  }) => {
    try {
      const res = await apiFetch('/api/auth/become-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to convert account to Radio Owner.' };
      }
      setUser(json.user);
      if (json.ownerProfile) setOwnerProfile(json.ownerProfile);
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error completing owner onboarding.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ownerProfile,
        subscription,
        plan,
        loading,
        login,
        register,
        logout,
        refreshUser,
        quickLoginAs,
        updateProfile,
        loginWithGoogle,
        becomeOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
