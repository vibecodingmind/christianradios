import dns from 'dns';
import { URL } from 'url';

// Check if an IP string is in a private/internal range
export function isPrivateIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();

  // ::ffff:127.0.0.1 and friends are IPv4 addresses wearing an IPv6 hat.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);

  const octets = normalized.split('.');
  if (octets.length === 4 && octets.every((o) => /^\d{1,3}$/.test(o))) {
    const [a, b] = octets.map((o) => parseInt(o, 10));
    if (a === 0 || a === 127) return true; // this-host, loopback
    if (a === 10) return true; // RFC1918
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // RFC6598 CGNAT
    if (a === 192 && b === 0) return true; // IETF protocol assignments
    if (a >= 224) return true; // multicast and reserved
    return false;
  }

  // IPv6 loopback, unspecified, link-local (fe80::/10) and unique local (fc00::/7)
  if (normalized === '::1' || normalized === '::') return true;
  if (/^fe[89ab][0-9a-f]?:/.test(normalized)) return true;
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true;

  return false;
}

/**
 * Hostnames that are not dotted-quad but still resolve to an address literal —
 * `http://2130706433/` and `http://0177.0.0.1/` both reach localhost.
 */
function hostnameIsNumericAddress(hostname: string): string | null {
  if (/^\d+$/.test(hostname)) {
    const asInt = Number(hostname);
    if (!Number.isSafeInteger(asInt) || asInt < 0 || asInt > 0xffffffff) return null;
    return [(asInt >>> 24) & 255, (asInt >>> 16) & 255, (asInt >>> 8) & 255, asInt & 255].join('.');
  }

  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => /^0[0-7]*$/.test(p) && p.length > 1)) {
    return parts.map((p) => parseInt(p, 8)).join('.');
  }

  return null;
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

  // Direct IP in URL check, including decimal and octal encodings
  const numericHost = hostnameIsNumericAddress(hostname);
  if (isPrivateIp(numericHost || hostname)) {
    return { isValid: false, error: 'Private IP addresses are not permitted.' };
  }

  // IPv6 literals arrive bracketed from the URL parser
  if (hostname.startsWith('[') && hostname.endsWith(']') && isPrivateIp(hostname.slice(1, -1))) {
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
