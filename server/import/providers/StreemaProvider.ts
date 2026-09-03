import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchText } from '../safeFetch.js';

export class StreemaProvider implements RadioImportProvider {
  public name = 'Streema';
  public sourceType = 'STREEMA' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('streema.com/radios/') || lower.includes('streema.com/');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let name = 'Streema Radio Station';
    let description = 'Online Christian radio broadcaster listed on Streema.';
    let logoUrl = '';
    let streamUrl = '';
    let websiteUrl = url;
    let city = 'Dar es Salaam';
    let countryCode = 'TZ';
    let language = 'English';
    let genre = 'Christian Contemporary';

    try {
      const html = await safeFetchText(url, { timeoutMs: 8000 });

      // Extract Name
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      if (ogTitle && ogTitle[1]) {
        name = ogTitle[1].replace(/,.*$/i, '').replace(/ - .*$/i, '').trim();
      }

      // Extract Description
      const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                     html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      if (ogDesc && ogDesc[1]) {
        description = ogDesc[1].trim();
      }

      // Extract Image
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
      if (ogImage && ogImage[1]) {
        logoUrl = ogImage[1].trim();
      }

      // Find stream link inside JSON-LD or audio tags or script variables
      const streamMatch = html.match(/https?:\/\/[^\s"']+\.(?:mp3|aac|m3u8|pls|asx)/i) ||
                          html.match(/https?:\/\/[a-zA-Z0-9.-]+:\d+\/[a-zA-Z0-9._-]+/i);
      if (streamMatch) {
        streamUrl = streamMatch[0];
      }
    } catch {
      // Fall back
    }

    return {
      name,
      description,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
      websiteUrl,
      countryCode,
      city,
      language,
      genre,
      categoryId: 'cat_christian_teaching',
      streamUrl: streamUrl || url,
      streamType: 'MP3',
      bitrateKbps: 128,
      sourceType: this.sourceType,
      sourceUrl: url,
      confidenceMap: {
        name: Boolean(name && name !== 'Streema Radio Station'),
        streamUrl: Boolean(streamUrl),
        logoUrl: Boolean(logoUrl),
        description: Boolean(description && !description.includes('Online Christian radio broadcaster listed on')),
        countryCode: false,
        city: false,
        language: false,
        genre: false,
      },
    };
  }
}
