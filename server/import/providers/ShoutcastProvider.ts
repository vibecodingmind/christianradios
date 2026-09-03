import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchJson, safeFetchText } from '../safeFetch.js';
import { URL } from 'url';

export class ShoutcastProvider implements RadioImportProvider {
  public name = 'SHOUTcast Server';
  public sourceType = 'SHOUTCAST' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('shoutcast') ||
           lower.includes('/stats?sid=') ||
           lower.includes('/7.html') ||
           lower.includes(':8000') ||
           lower.includes(':8080');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let name = 'SHOUTcast Christian Station';
    let description = 'Online Christian broadcast streamed via SHOUTcast server.';
    let streamUrl = url;
    let genre = 'Gospel & Praise';
    let bitrateKbps = 128;
    let nowPlaying: { title?: string; artist?: string } | undefined;

    try {
      const parsed = new URL(url);
      const statsJsonUrl = `${parsed.protocol}//${parsed.host}/stats?sid=1&json=1`;

      try {
        const stats = await safeFetchJson<any>(statsJsonUrl, { timeoutMs: 5000 });
        if (stats) {
          if (stats.servertitle) name = String(stats.servertitle);
          if (stats.servergenre) genre = String(stats.servergenre);
          if (stats.bitrate) bitrateKbps = parseInt(stats.bitrate, 10) || 128;
          if (stats.songtitle) {
            const parts = String(stats.songtitle).split(' - ');
            if (parts.length >= 2) {
              nowPlaying = { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
            } else {
              nowPlaying = { title: String(stats.songtitle).trim() };
            }
          }
        }
      } catch {
        // Fallback
      }
    } catch {
      // Fallback
    }

    return {
      name,
      description,
      logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      websiteUrl: url,
      countryCode: 'TZ',
      city: 'Dar es Salaam',
      language: 'English / Swahili',
      genre,
      categoryId: 'cat_gospel_music',
      streamUrl,
      streamType: 'SHOUTCAST',
      bitrateKbps,
      sourceType: this.sourceType,
      sourceUrl: url,
      nowPlaying,
      confidenceMap: {
        name: Boolean(name && name !== 'SHOUTcast Christian Station'),
        streamUrl: true,
        logoUrl: false,
        description: false,
        countryCode: false,
        city: false,
        language: false,
        genre: Boolean(genre && genre !== 'Gospel & Praise'),
      },
    };
  }
}
