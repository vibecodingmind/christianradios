import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchText } from '../safeFetch.js';

export class ZenoProvider implements RadioImportProvider {
  public name = 'Zeno Media / Zeno FM';
  public sourceType = 'ZENO' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('zeno.fm/radio/') ||
           lower.includes('stream.zeno.fm/') ||
           lower.includes('zeno.fm/');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let slug = '';
    const match = url.match(/zeno\.fm\/(?:radio\/)?([a-zA-Z0-9_-]+)/i);
    if (match) {
      slug = match[1];
    } else {
      const streamMatch = url.match(/stream\.zeno\.fm\/([a-zA-Z0-9_-]+)/i);
      if (streamMatch) {
        slug = streamMatch[1];
      }
    }

    let streamUrl = url.includes('stream.zeno.fm') ? url : (slug ? `https://stream.zeno.fm/${slug}` : url);
    let name = slug ? slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Zeno Christian Radio';
    let description = 'Live Christian broadcasting powered by Zeno Media.';
    let logoUrl = '';
    let countryCode = 'TZ';
    let city = 'Dar es Salaam';
    let language = 'Swahili';
    let genre = 'Gospel & Praise';

    try {
      const html = await safeFetchText(url, { timeoutMs: 7000 });

      // OpenGraph tags
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      if (ogTitle && ogTitle[1]) {
        name = ogTitle[1].replace(/ - Zeno\.FM/i, '').replace(/ \| Zeno Radio/i, '').trim();
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
      }

      // Check stream URL in HTML if available
      const streamMatchInHtml = html.match(/https?:\/\/stream\.zeno\.fm\/[a-zA-Z0-9_-]+/i);
      if (streamMatchInHtml) {
        streamUrl = streamMatchInHtml[0];
      }
    } catch {
      // Fall back
    }

    return {
      name,
      description,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80',
      websiteUrl: url,
      countryCode,
      city,
      language,
      genre,
      categoryId: 'cat_gospel_music',
      streamUrl,
      streamType: 'MP3',
      bitrateKbps: 128,
      sourceType: this.sourceType,
      sourceUrl: url,
      externalId: slug || undefined,
      confidenceMap: {
        name: Boolean(name && name !== 'Zeno Christian Radio'),
        streamUrl: Boolean(streamUrl),
        logoUrl: Boolean(logoUrl),
        description: Boolean(description && !description.includes('Live Christian broadcasting powered by')),
        countryCode: false,
        city: false,
        language: false,
        genre: false,
      },
    };
  }
}
