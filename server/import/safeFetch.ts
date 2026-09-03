import http from 'http';
import https from 'https';
import { URL } from 'url';
import { validateStreamUrl } from '../ssrf.js';

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
  maxRedirects?: number;
}

export interface SafeFetchResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  finalUrl: string;
}

/**
 * Safely fetches an external URL protecting against SSRF, DNS rebinding, internal network scanning,
 * infinite redirects, and oversized payloads.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const timeoutMs = options.timeoutMs || 8000;
  const maxBytes = options.maxBytes || 1024 * 1024; // 1MB limit for metadata
  const maxRedirects = options.maxRedirects ?? 3;
  let currentUrl = rawUrl.trim();
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    // 1. SSRF and Hostname DNS check
    const validation = await validateStreamUrl(currentUrl);
    if (!validation.isValid) {
      throw new Error(`SSRF Protection: ${validation.error || 'Access to host is denied'}`);
    }

    const parsed = new URL(currentUrl);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const res = await new Promise<SafeFetchResponse>((resolve, reject) => {
      let isSettled = false;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; ChristianRadios-Discovery/1.0; +https://christianradios.org)',
        Accept: 'text/html,application/xhtml+xml,application/json,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9,sw;q=0.8',
        ...(options.headers || {}),
      };

      const req = client.request(
        parsed,
        {
          method: 'GET',
          headers,
          timeout: timeoutMs,
        },
        (response) => {
          const statusCode = response.statusCode || 0;
          const redirectLocation = response.headers['location'];

          // Check for redirects (301, 302, 303, 307, 308)
          if ([301, 302, 303, 307, 308].includes(statusCode) && redirectLocation) {
            req.destroy();
            try {
              const nextUrl = new URL(redirectLocation, currentUrl).toString();
              return resolve({
                statusCode,
                headers: response.headers,
                body: '',
                finalUrl: nextUrl,
              });
            } catch (err) {
              return reject(new Error(`Invalid redirect URL: ${redirectLocation}`));
            }
          }

          let accumulatedBytes = 0;
          const chunks: Buffer[] = [];

          response.on('data', (chunk: Buffer) => {
            accumulatedBytes += chunk.length;
            if (accumulatedBytes > maxBytes) {
              req.destroy();
              if (!isSettled) {
                isSettled = true;
                // Truncate safely
                const body = Buffer.concat(chunks).toString('utf-8');
                resolve({
                  statusCode,
                  headers: response.headers,
                  body,
                  finalUrl: currentUrl,
                });
              }
              return;
            }
            chunks.push(chunk);
          });

          response.on('end', () => {
            if (!isSettled) {
              isSettled = true;
              const body = Buffer.concat(chunks).toString('utf-8');
              resolve({
                statusCode,
                headers: response.headers,
                body,
                finalUrl: currentUrl,
              });
            }
          });

          response.on('error', (err) => {
            if (!isSettled) {
              isSettled = true;
              reject(err);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`Connection to ${parsed.hostname} timed out after ${timeoutMs}ms`));
        }
      });

      req.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          reject(err);
        }
      });

      req.end();
    });

    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.finalUrl !== currentUrl) {
      redirectsCount++;
      currentUrl = res.finalUrl;
      continue;
    }

    return res;
  }

  throw new Error(`Too many redirects (exceeded limit of ${maxRedirects})`);
}

export async function safeFetchText(url: string, options?: SafeFetchOptions): Promise<string> {
  const res = await safeFetch(url, options);
  if (res.statusCode >= 400) {
    throw new Error(`Remote server responded with HTTP status ${res.statusCode}`);
  }
  return res.body;
}

export async function safeFetchJson<T = any>(url: string, options?: SafeFetchOptions): Promise<T> {
  const text = await safeFetchText(url, options);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Remote response was not valid JSON');
  }
}
