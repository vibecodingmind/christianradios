import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchJson } from '../safeFetch.js';
import { URL } from 'url';

export class AzuraCastProvider implements RadioImportProvider {
  public name = 'AzuraCast';
  public sourceType = 'AZURACAST' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('azuracast') ||
           lower.includes('/public/') ||
           lower.includes('/api/nowplaying/') ||
           lower.includes('/listen/');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let name = 'AzuraCast Christian Radio';
    let description = 'Live broadcast stream powered by AzuraCast.';
    let logoUrl = '';
    let streamUrl = url;
    let websiteUrl = url;
    let genre = 'Gospel & Praise';
    let nowPlaying: { title?: string; artist?: string } | undefined;
    let bitrateKbps = 128;
    let shortcode = '';

    try {
      const parsed = new URL(url);
      const publicMatch = url.match(/(?:\/public\/|\/listen\/|\/api\/nowplaying\/)([a-zA-Z0-9_-]+)/i);
      if (publicMatch) {
        shortcode = publicMatch[1];
      }

      const apiUrl = shortcode
        ? `${parsed.protocol}//${parsed.host}/api/nowplaying/${shortcode}`
        : `${parsed.protocol}//${parsed.host}/api/nowplaying`;

      try {
        const data = await safeFetchJson<any>(apiUrl, { timeoutMs: 5000 });
        const stationData = Array.isArray(data) ? data[0] : data;
        if (stationData && stationData.station) {
          const s = stationData.station;
          if (s.name) name = s.name;
          if (s.description) description = s.description;
          if (s.genre) genre = s.genre;
          if (s.url) websiteUrl = s.url;
          if (s.listen_url) streamUrl = s.listen_url;

          if (stationData.now_playing?.song) {
            const song = stationData.now_playing.song;
            nowPlaying = {
              title: song.title || undefined,
              artist: song.artist || undefined,
            };
            if (song.art) logoUrl = song.art;
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
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      websiteUrl,
      countryCode: 'TZ',
      city: 'Dar es Salaam',
      language: 'English / Swahili',
      genre,
      categoryId: 'cat_gospel_music',
      streamUrl,
      streamType: 'MP3',
      bitrateKbps,
      sourceType: this.sourceType,
      sourceUrl: url,
      externalId: shortcode || undefined,
      nowPlaying,
      confidenceMap: {
        name: Boolean(name && name !== 'AzuraCast Christian Radio'),
        streamUrl: Boolean(streamUrl),
        logoUrl: Boolean(logoUrl),
        description: Boolean(description && !description.includes('Live broadcast stream powered by AzuraCast')),
        countryCode: false,
        city: false,
        language: false,
        genre: Boolean(genre && genre !== 'Gospel & Praise'),
      },
    };
  }
}
