import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { validateStreamUrl } from '../../ssrf.js';
import { URL } from 'url';

export class DirectStreamProvider implements RadioImportProvider {
  public name = 'Direct Audio Stream';
  public sourceType = 'DIRECT_STREAM' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith('.mp3') ||
           lower.endsWith('.aac') ||
           lower.endsWith('.m3u8') ||
           lower.includes('/stream') ||
           lower.includes('/live') ||
           lower.includes('/listen') ||
           lower.includes(':8000') ||
           lower.includes(':8002');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    const validation = await validateStreamUrl(url);
    const streamType = validation.detectedType || 'MP3';
    
    let domainName = 'Christian Live Stream';
    try {
      const parsed = new URL(url);
      domainName = parsed.hostname.replace(/^www\./, '').replace(/\.[a-z]{2,6}$/i, '');
      domainName = domainName.replace(/[-_.]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' Radio';
    } catch {
      // Fallback
    }

    return {
      name: domainName,
      description: 'Live Christian radio stream connected via direct broadcast URL.',
      logoUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
      websiteUrl: url,
      countryCode: 'TZ',
      city: 'Dar es Salaam',
      language: 'Swahili / English',
      genre: 'Gospel & Praise',
      categoryId: 'cat_gospel_music',
      streamUrl: url,
      streamType,
      bitrateKbps: 128,
      sourceType: this.sourceType,
      sourceUrl: url,
      confidenceMap: {
        name: true,
        streamUrl: true,
        logoUrl: false,
        description: false,
        countryCode: false,
        city: false,
        language: false,
        genre: false,
      },
    };
  }
}
