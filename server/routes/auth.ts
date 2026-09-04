import { Router } from 'express';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  requireAuth,
  sanitizeUser,
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
  type AuthenticatedRequest,
} from '../auth.js';
import { db } from '../db.js';
import type { User, Role } from '../types.js';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['LISTENER', 'RADIO_OWNER']).default('LISTENER'),
  organizationName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  referralCode: z.string().optional(),
});

authRouter.post('/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const existing = db.users.findByEmail(data.email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const genReferralCode = `REF_${userId.substring(4, 10).toUpperCase()}`;

    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase().trim(),
      passwordHash: hashPassword(data.password),
      role: data.role as Role,
      name: data.name.trim(),
      emailVerified: true, // Auto-verified for seamless start
      phone: data.phone,
      referralCode: genReferralCode,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.create(newUser);

    // Referral System Attribution
    if (data.referralCode) {
      const cleanRef = data.referralCode.trim().toUpperCase();
      const referrer = db.users.getAll().find(
        (u) =>
          (u.referralCode && u.referralCode.toUpperCase() === cleanRef) ||
          `REF_${u.id.substring(4, 10).toUpperCase()}` === cleanRef
      );
      if (referrer && referrer.id !== newUser.id) {
        try {
          db.referrals.create({
            id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            referrerId: referrer.id,
            referrerRole: referrer.role === 'RADIO_OWNER' ? 'RADIO_OWNER' : 'LISTENER',
            referredUserId: newUser.id,
            referralCode: cleanRef,
            status: 'QUALIFIED',
            createdAt: new Date().toISOString(),
          });
          console.log(`[Referrals Engine] User ${newUser.id} registered via code ${cleanRef} from referrer ${referrer.id}`);
        } catch (refErr: any) {
          console.warn('[Referrals Engine] Skip duplicate referral creation:', refErr.message);
        }
      }
    }

    if (data.role === 'RADIO_OWNER') {
      db.ownerProfiles.create({
        id: `prof_${Date.now()}`,
        userId: newUser.id,
        organizationName: data.organizationName || `${data.name}'s Radio Network`,
        phone: data.phone,
        country: data.country || 'Tanzania',
        verified: false,
      });

      // Assign default FREE subscription plan
      const freePlan = db.plans.getAll().find((p) => p.tier === 'FREE');
      if (freePlan) {
        db.subscriptions.create({
          id: `sub_${Date.now()}`,
          ownerId: newUser.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
          cancelAtPeriodEnd: false,
          autoRenew: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    db.auditLogs.log({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      details: `New ${newUser.role} account registered.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const token = signSessionToken(newUser);
    res.cookie('cr_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const ownerProfile =
      newUser.role === 'RADIO_OWNER'
        ? db.ownerProfiles.findByUserId(newUser.id)
        : undefined;

    res.status(201).json({
      token,
      user: sanitizeUser(newUser),
      ownerProfile,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = db.users.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signSessionToken(user);
    res.cookie('cr_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    db.auditLogs.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: 'User authenticated successfully.',
      ipAddress: req.ip || '127.0.0.1',
    });

    const ownerProfile =
      user.role === 'RADIO_OWNER' ? db.ownerProfiles.findByUserId(user.id) : undefined;

    res.json({
      token,
      user: sanitizeUser(user),
      ownerProfile,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
      return;
    }
    res.status(500).json({ error: 'Login failed.' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('cr_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

authRouter.get('/me', (req, res) => {
  // @ts-ignore
  const user = req.user;
  if (!user) {
    res.json({ user: null });
    return;
  }
  const ownerProfile =
    user.role === 'RADIO_OWNER' ? db.ownerProfiles.findByUserId(user.id) : undefined;
  const subscription =
    user.role === 'RADIO_OWNER' ? db.subscriptions.findByOwnerId(user.id) : undefined;
  const plan =
    subscription ? db.plans.findById(subscription.planId) : undefined;

  res.json({
    user: sanitizeUser(user),
    ownerProfile,
    subscription,
    plan,
  });
});

authRouter.post('/update-profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, phone, avatarUrl, organizationName, bio, website } = req.body;

  const updatedUser = db.users.update(user.id, {
    name: name || user.name,
    phone: phone ?? user.phone,
    avatarUrl: avatarUrl ?? user.avatarUrl,
  });

  if (user.role === 'RADIO_OWNER') {
    db.ownerProfiles.update(user.id, {
      organizationName: organizationName || undefined,
      phone: phone ?? undefined,
      bio: bio ?? undefined,
      website: website ?? undefined,
    });
  }

  res.json({
    success: true,
    user: sanitizeUser(updatedUser!),
    ownerProfile:
      user.role === 'RADIO_OWNER' ? db.ownerProfiles.findByUserId(user.id) : undefined,
  });
});

// Become Radio Owner Onboarding / Role Upgrade
authRouter.post('/become-owner', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { organizationName, phone, country } = req.body;

  const orgName = organizationName?.trim() || `${user.name}'s Ministry Radio`;

  const updatedUser = db.users.update(user.id, { role: 'RADIO_OWNER' });

  let ownerProfile = db.ownerProfiles.findByUserId(user.id);
  if (!ownerProfile) {
    ownerProfile = db.ownerProfiles.create({
      id: `prof_${Date.now()}`,
      userId: user.id,
      organizationName: orgName,
      phone: phone || user.phone || '',
      country: country || 'Tanzania',
      bio: 'Broadcasting live on Christian Radios.',
      verified: false,
    });
  } else {
    ownerProfile = db.ownerProfiles.update(user.id, {
      organizationName: orgName,
    })!;
  }

  // Ensure an active subscription exists for this new owner
  let sub = db.subscriptions.findByOwnerId(user.id);
  if (!sub) {
    db.subscriptions.create({
      id: `sub_${Date.now()}`,
      ownerId: user.id,
      planId: 'plan_free',
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  db.auditLogs.log({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: 'RADIO_OWNER',
    action: 'UPGRADED_TO_RADIO_OWNER',
    entityType: 'User',
    entityId: user.id,
    details: `User completed onboarding and upgraded role from LISTENER to RADIO_OWNER (${orgName}).`,
  });

  res.json({
    success: true,
    user: sanitizeUser(updatedUser!),
    ownerProfile,
  });
});

authRouter.post('/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  db.users.update(user.id, {
    passwordHash: hashPassword(newPassword),
  });

  db.auditLogs.log({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PASSWORD_CHANGED',
    entityType: 'User',
    entityId: user.id,
    details: 'User successfully changed password.',
  });

  res.json({ success: true, message: 'Password updated successfully.' });
});

authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (email && typeof email === 'string') {
    const user = db.users.findByEmail(email.toLowerCase().trim());
    if (user && user.status !== 'SUSPENDED') {
      const resetToken = createPasswordResetToken(user.email);
      db.auditLogs.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        details: `Password reset token generated (valid for 15m). Token: ${resetToken}`,
        ipAddress: req.ip || '127.0.0.1',
      });
    }
  }

  // Always return consistent success message for security to prevent user enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});

authRouter.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Valid token and new password (minimum 8 characters) are required.' });
    return;
  }

  const email = verifyPasswordResetToken(token);
  if (!email) {
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
    return;
  }

  const user = db.users.findByEmail(email);
  if (!user || user.status === 'SUSPENDED') {
    res.status(400).json({ error: 'Account not eligible for password reset.' });
    return;
  }

  // Consume token so it cannot be reused
  consumePasswordResetToken(token);

  // Update user password
  db.users.update(user.id, {
    passwordHash: hashPassword(newPassword),
  });

  db.auditLogs.log({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'User',
    entityId: user.id,
    details: 'Password reset completed via token authorization.',
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
});


// Google Social OAuth Authentication Endpoint
authRouter.get('/google-config', (req, res) => {
  const settings = db.settings.get();
  res.json({
    googleAuthEnabled: settings.googleAuthEnabled ?? true,
    googleClientId: settings.googleClientId || '891028371900-cradiosoauth.apps.googleusercontent.com',
  });
});

authRouter.post('/google', async (req, res) => {
  try {
    const { email, name, avatarUrl, googleId, credential, role = 'LISTENER' } = req.body;

    // Handle credential payload or decoded user object
    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatarUrl;
    let targetGoogleId = googleId;

    if (credential) {
      try {
        // Parse Google JWT ID Token payload (base64 part 2)
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          targetEmail = payload.email || targetEmail;
          targetName = payload.name || targetName;
          targetAvatar = payload.picture || targetAvatar;
          targetGoogleId = payload.sub || targetGoogleId;
        }
      } catch (err) {
        console.warn('Failed to parse Google JWT credential payload:', err);
      }
    }

    if (!targetEmail) {
      res.status(400).json({ error: 'Google email address is required.' });
      return;
    }

    const cleanEmail = targetEmail.toLowerCase().trim();
    let user = db.users.findByEmail(cleanEmail);

    if (!user) {
      // Create new user account registered via Google OAuth
      const newUser: User = {
        id: `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        passwordHash: hashPassword(`google_oauth_${Date.now()}_${Math.random().toString(36)}`),
        role: (role === 'RADIO_OWNER' ? 'RADIO_OWNER' : 'LISTENER') as Role,
        name: targetName || cleanEmail.split('@')[0] || 'Gospel Listener',
        avatarUrl: targetAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName || cleanEmail)}&background=0284c7&color=fff`,
        emailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.create(newUser);
      user = newUser;

      if (newUser.role === 'RADIO_OWNER') {
        db.ownerProfiles.create({
          id: `prof_${Date.now()}`,
          userId: newUser.id,
          organizationName: `${newUser.name}'s Radio Network`,
          country: 'Tanzania',
          verified: false,
        });

        const freePlan = db.plans.getAll().find((p) => p.tier === 'FREE');
        if (freePlan) {
          db.subscriptions.create({
            id: `sub_${Date.now()}`,
            ownerId: newUser.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            billingInterval: 'MONTHLY',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
            cancelAtPeriodEnd: false,
            autoRenew: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // Update avatar or name if newly provided from Google
      if (targetAvatar && !user.avatarUrl) {
        user = db.users.update(user.id, { avatarUrl: targetAvatar }) || user;
      }
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    const token = signSessionToken(user);
    res.cookie('cr_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    db.auditLogs.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_GOOGLE_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: 'User authenticated via Google Social Login.',
      ipAddress: req.ip || '127.0.0.1',
    });

    const ownerProfile =
      user.role === 'RADIO_OWNER' ? db.ownerProfiles.findByUserId(user.id) : undefined;

    res.json({
      token,
      user: sanitizeUser(user),
      ownerProfile,
    });
  } catch (err: unknown) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
});

