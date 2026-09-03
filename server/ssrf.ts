import dns from 'dns';
import { URL } from 'url';

// Check if an IP string is in a private/internal range
export function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  if (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.')
  ) {
    return true;
  }

  // 172.16.0.0 – 172.31.255.255
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  // IPv6 loopback and private
  if (
    ip === '::1' ||
    ip === '::' ||
    ip.toLowerCase().startsWith('fe80:') ||
    ip.toLowerCase().startsWith('fc00:') ||
    ip.toLowerCase().startsWith('fd00:')
  ) {
    return true;
  }

  return false;
}

export interface StreamValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  detectedType?: 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST';
  contentType?: string;
}

/**
 * Validates a stream URL against SSRF attacks and verifies safe HTTP/HTTPS format.
 */
export async function validateStreamUrl(rawUrl: string): Promise<StreamValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Stream URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { isValid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Stream URL must use HTTP or HTTPS protocol.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, internal keywords, and metadata services
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === 'metadata.google.internal' ||
    hostname === '169.254.169.254' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { isValid: false, error: 'Access to internal or local network hosts is strictly prohibited.' };
  }

  // Direct IP in URL check
  if (isPrivateIp(hostname)) {
    return { isValid: false, error: 'Private IP addresses are not permitted.' };
  }

  // Resolve hostname via DNS to prevent DNS rebinding to private IPs
  try {
    const lookupPromise = new Promise<string[]>((resolve, reject) => {
      dns.resolve(hostname, (err, addresses) => {
        if (err) {
          // If resolve fails, try lookup as fallback
          dns.lookup(hostname, { all: true }, (lookupErr, lookupAddresses) => {
            if (lookupErr) {
              return reject(lookupErr);
            }
            resolve(lookupAddresses.map((a) => a.address));
          });
        } else {
          resolve(addresses);
        }
      });
    });

    const addresses = await Promise.race([
      lookupPromise,
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS lookup timed out')), 4000)
      ),
    ]);

    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        return {
          isValid: false,
          error: 'Hostname resolves to a prohibited internal IP address.',
        };
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DNS resolution failed';
    return {
      isValid: false,
      error: `Could not resolve stream host: ${message}`,
    };
  }

  // Determine probable stream type
  const pathname = parsed.pathname.toLowerCase();
  let detectedType: 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST' = 'MP3';
  if (pathname.endsWith('.m3u8') || rawUrl.includes('/hls/')) {
    detectedType = 'HLS';
  } else if (pathname.endsWith('.aac')) {
    detectedType = 'AAC';
  } else if (pathname.endsWith('.mp3')) {
    detectedType = 'MP3';
  } else if (rawUrl.includes(':8000') || rawUrl.includes(':8002') || rawUrl.includes('icecast')) {
    detectedType = 'ICECAST';
  }

  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
    detectedType,
  };
}
