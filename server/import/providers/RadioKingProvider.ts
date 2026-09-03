import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchText, safeFetchJson } from '../safeFetch.js';

export class RadioKingProvider implements RadioImportProvider {
  public name = 'RadioKing';
  public sourceType = 'RADIOKING' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('radioking.com/radio/') ||
           lower.includes('radioking.com/play/') ||
           lower.includes('listen.radioking.com/radio/');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let slug = '';
    const match = url.match(/radioking\.com\/(?:radio|play)\/([a-zA-Z0-9_-]+)/i);
    if (match) {
      slug = match[1];
    } else {
      const streamMatch = url.match(/listen\.radioking\.com\/radio\/([a-zA-Z0-9_-]+)/i);
      if (streamMatch) {
        slug = streamMatch[1];
      }
    }

    // Default stream URL for RadioKing
    let streamUrl = slug ? `https://listen.radioking.com/radio/${slug}/listen.mp3` : url;
    let name = slug ? slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'RadioKing Station';
    let description = 'Live Christian broadcasting hosted on RadioKing.';
    let logoUrl = '';
    let coverUrl = '';
    let websiteUrl = url;
    let nowPlaying: { title?: string; artist?: string } | undefined;

    try {
      const html = await safeFetchText(url, { timeoutMs: 7000 });
      
      // Extract title from og:title or <title>
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      if (ogTitle && ogTitle[1]) {
        name = ogTitle[1].replace(/ - RadioKing/i, '').trim();
      }

      // Extract description
      const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                     html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      if (ogDesc && ogDesc[1]) {
        description = ogDesc[1].trim();
      }

      // Extract image
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
      if (ogImage && ogImage[1]) {
        logoUrl = ogImage[1].trim();
      }

      // Try widget API for live track metadata
      if (slug) {
        try {
          const trackData = await safeFetchJson<{ title?: string; artist?: string; cover?: string }>(
            `https://api.radioking.com/widget/radio/${slug}/track/current`,
            { timeoutMs: 4000 }
          );
          if (trackData && (trackData.title || trackData.artist)) {
            nowPlaying = {
              title: trackData.title || undefined,
              artist: trackData.artist || undefined,
            };
          }
        } catch {
          // Non-blocking
        }
      }
    } catch {
      // Fall back to defaults
    }

    return {
      name,
      description,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      coverUrl: coverUrl || undefined,
      websiteUrl,
      countryCode: 'TZ',
      city: 'Dar es Salaam',
      language: 'English / Swahili',
      genre: 'Gospel & Praise',
      categoryId: 'cat_gospel_music',
      streamUrl,
      streamType: 'MP3',
      bitrateKbps: 128,
      sourceType: this.sourceType,
      sourceUrl: url,
      externalId: slug || undefined,
      nowPlaying,
      confidenceMap: {
        name: Boolean(name && name !== 'RadioKing Station'),
        streamUrl: Boolean(streamUrl),
        logoUrl: Boolean(logoUrl),
        description: Boolean(description && !description.includes('Live Christian broadcasting hosted on')),
        countryCode: false,
        city: false,
        language: false,
        genre: false,
      },
    };
  }
}
