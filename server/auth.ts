import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { User, Role } from './types.js';
import { db } from './db.js';

const AUTH_SECRET = process.env.AUTH_SECRET || 'christian_radios_prod_secret_2026_salt_hash_min32';

export interface AuthSessionPayload {
  userId: string;
  email: string;
  role: Role;
  exp: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function signSessionToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: AuthSessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): AuthSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: AuthSessionPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function getSessionFromRequest(req: Request): User | null {
  // Check Authorization header or Cookie
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map((c) => {
        const [k, v] = c.trim().split('=');
        return [k, v];
      })
    );
    token = cookies.cr_session;
  }

  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = db.users.findById(payload.userId);
  if (!user || user.status === 'SUSPENDED') return null;
  return user;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = getSessionFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = getSessionFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges for this action.' });
      return;
    }
    req.user = user;
    next();
  };
}

export function extractUserFromCookie(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = getSessionFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
}

export interface ResetTokenEntry {
  email: string;
  tokenHash: string;
  expiresAt: number;
}

const resetTokensStore = new Map<string, ResetTokenEntry>();

export function createPasswordResetToken(email: string): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes TTL

  resetTokensStore.set(tokenHash, {
    email: email.toLowerCase().trim(),
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export function verifyPasswordResetToken(rawToken: string): string | null {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const entry = resetTokensStore.get(tokenHash);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokensStore.delete(tokenHash);
    return null;
  }

  return entry.email;
}

export function consumePasswordResetToken(rawToken: string): boolean {
  if (!rawToken || typeof rawToken !== 'string') return false;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return resetTokensStore.delete(tokenHash);
}

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

