import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchText } from '../safeFetch.js';
import { URL } from 'url';

export class GenericRadioProvider implements RadioImportProvider {
  public name = 'Generic Web / Radio Directory';
  public sourceType = 'IMPORTED_OTHER' as const;

  canHandle(url: string): boolean {
    return true; // Fallback provider
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let name = 'Christian Online Radio';
    let description = 'Online Christian radio broadcast and gospel ministry.';
    let logoUrl = '';
    let coverUrl = '';
    let websiteUrl = url;
    let streamUrl = '';
    let countryCode = 'TZ';
    let city = 'Dar es Salaam';
    let language = 'Swahili / English';
    let genre = 'Gospel & Praise';
    let streamType: 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST' = 'MP3';

    try {
      const parsed = new URL(url);
      const html = await safeFetchText(url, { timeoutMs: 8000 });

      // 1. JSON-LD parsing
      const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
      for (const match of jsonLdMatches) {
        try {
          const parsedLd = JSON.parse(match[1]);
          const item = Array.isArray(parsedLd) ? parsedLd[0] : parsedLd;
          if (item) {
            if (item.name) name = item.name;
            if (item.description) description = item.description;
            if (item.image) {
              logoUrl = typeof item.image === 'string' ? item.image : item.image.url || '';
            }
            if (item.contentUrl || item.embedUrl) {
              streamUrl = item.contentUrl || item.embedUrl;
            }
          }
        } catch {
          // Ignore json parse error
        }
      }

      // 2. OpenGraph Meta Tags
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      if (ogTitle && ogTitle[1] && (!name || name === 'Christian Online Radio')) {
        name = ogTitle[1].replace(/ - Listen Live.*$/i, '').replace(/ \| Christian Radio.*$/i, '').trim();
      }

      if (!name || name === 'Christian Online Radio') {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          name = titleMatch[1].replace(/ - Listen Live.*$/i, '').replace(/ \| .*$/i, '').trim();
        }
      }

      const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                     html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      if (ogDesc && ogDesc[1]) {
        description = ogDesc[1].trim();
      }

      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
      if (ogImage && ogImage[1]) {
        logoUrl = ogImage[1].trim();
        if (logoUrl.startsWith('/')) {
          logoUrl = `${parsed.protocol}//${parsed.host}${logoUrl}`;
        }
      }

      // 3. Audio stream detection in HTML
      if (!streamUrl) {
        // Look for audio tags or source tags
        const audioSrcMatch = html.match(/<audio[^>]+src=["']([^"']+)["']/i) ||
                              html.match(/<source[^>]+src=["']([^"']+)["']/i);
        if (audioSrcMatch && audioSrcMatch[1]) {
          streamUrl = audioSrcMatch[1];
        }
      }

      if (!streamUrl) {
        // Look for direct stream links inside JS or markup
        const streamRegexMatch = html.match(/https?:\/\/[a-zA-Z0-9_.~:/?#[\]@!$&'()*+,;=-]+\.(?:mp3|aac|m3u8)/i) ||
                                 html.match(/https?:\/\/[a-zA-Z0-9.-]+:\d{2,5}\/[a-zA-Z0-9._~-]+/i);
        if (streamRegexMatch && streamRegexMatch[0] && !streamRegexMatch[0].endsWith('.js') && !streamRegexMatch[0].endsWith('.css')) {
          streamUrl = streamRegexMatch[0];
        }
      }

      if (streamUrl && streamUrl.startsWith('/')) {
        streamUrl = `${parsed.protocol}//${parsed.host}${streamUrl}`;
      }

      if (streamUrl.includes('.m3u8')) {
        streamType = 'HLS';
      } else if (streamUrl.includes('.aac')) {
        streamType = 'AAC';
      }
    } catch {
      // Fallback
    }

    return {
      name,
      description,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      websiteUrl,
      countryCode,
      city,
      language,
      genre,
      categoryId: 'cat_gospel_music',
      streamUrl: streamUrl || url,
      streamType,
      bitrateKbps: 128,
      sourceType: this.sourceType,
      sourceUrl: url,
      confidenceMap: {
        name: Boolean(name && name !== 'Christian Online Radio'),
        streamUrl: Boolean(streamUrl),
        logoUrl: Boolean(logoUrl),
        description: Boolean(description && !description.includes('Online Christian radio broadcast')),
        countryCode: false,
        city: false,
        language: false,
        genre: false,
      },
    };
  }
}
