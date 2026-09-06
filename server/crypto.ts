import crypto from 'crypto';

const MASTER_KEY_SOURCE =
  process.env.INTEGRATION_ENCRYPTION_KEY ||
  process.env.MASTER_ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  'christian_radios_prod_master_key_2026_aes256gcm_vault';

// Derive 32-byte encryption key using SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(MASTER_KEY_SOURCE).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const PREFIX = 'enc:v1:';

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') return '';
  if (plaintext.startsWith(PREFIX)) return plaintext; // Already encrypted

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
export function decryptSecret(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') return '';
  if (!ciphertext.startsWith(PREFIX)) {
    // Unencrypted legacy fallback
    return ciphertext;
  }

  try {
    const payload = ciphertext.slice(PREFIX.length);
    const [ivHex, authTagHex, encryptedData] = payload.split(':');
    
    if (!ivHex || !authTagHex || !encryptedData) {
      return ciphertext;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Decryption error:', err instanceof Error ? err.message : err);
    return '';
  }
}

/**
 * Encrypt arbitrary JSON object
 */
export function encryptJSON(data: unknown): string {
  if (data === undefined || data === null) return '';
  return encryptSecret(JSON.stringify(data));
}

/**
 * Decrypt JSON object
 */
export function decryptJSON<T = any>(ciphertext: string): T | null {
  if (!ciphertext) return null;
  const decrypted = decryptSecret(ciphertext);
  if (!decrypted) return null;
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Mask sensitive credentials for UI presentation
 */
export function maskSecret(secret?: string): string {
  if (!secret || typeof secret !== 'string') return '';
  const clean = secret.startsWith(PREFIX) ? decryptSecret(secret) : secret;
  if (!clean) return '';
  if (clean.length <= 6) return '••••••';
  return '••••••••••••••••' + clean.slice(-4);
}
