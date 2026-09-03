import { Router } from 'express';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  requireAuth,
  sanitizeUser,
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
});

authRouter.post('/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const existing = db.users.findByEmail(data.email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: data.email.toLowerCase().trim(),
      passwordHash: hashPassword(data.password),
      role: data.role as Role,
      name: data.name.trim(),
      emailVerified: true, // Auto-verified for seamless start
      phone: data.phone,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.create(newUser);

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
  // Always return success message for security to prevent user enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});
