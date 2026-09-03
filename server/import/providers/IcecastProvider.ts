import type { RadioImportProvider, ExtractedStationMetadata } from '../types.js';
import { safeFetchJson, safeFetchText } from '../safeFetch.js';
import { URL } from 'url';

export class IcecastProvider implements RadioImportProvider {
  public name = 'Icecast Server';
  public sourceType = 'ICECAST' as const;

  canHandle(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('icecast') ||
           lower.includes('/status-json.xsl') ||
           lower.includes('/status.xsl') ||
           lower.includes(':8000') ||
           lower.includes(':8002');
  }

  async extract(url: string): Promise<ExtractedStationMetadata> {
    let name = 'Icecast Christian Broadcast';
    let description = 'Live online audio stream powered by Icecast broadcast server.';
    let streamUrl = url;
    let genre = 'Gospel & Praise';
    let bitrateKbps = 128;
    let nowPlaying: { title?: string; artist?: string } | undefined;
    let streamType: 'MP3' | 'AAC' | 'ICECAST' = 'MP3';

    try {
      const parsed = new URL(url);
      const statusJsonUrl = `${parsed.protocol}//${parsed.host}/status-json.xsl`;

      try {
        const stats = await safeFetchJson<any>(statusJsonUrl, { timeoutMs: 5000 });
        if (stats && stats.icestats) {
          const sources = stats.icestats.source;
          const source = Array.isArray(sources) ? sources[0] : sources;
          if (source) {
            if (source.server_name) name = String(source.server_name);
            if (source.server_description) description = String(source.server_description);
            if (source.genre) genre = String(source.genre);
            if (source.bitrate) bitrateKbps = parseInt(source.bitrate, 10) || 128;
            if (source.listenurl) streamUrl = source.listenurl;
            if (source.server_type && source.server_type.includes('aac')) {
              streamType = 'AAC';
            }
            if (source.yp_currently_playing || source.title) {
              const track = source.yp_currently_playing || source.title;
              const parts = String(track).split(' - ');
              if (parts.length >= 2) {
                nowPlaying = { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
              } else {
                nowPlaying = { title: String(track).trim() };
              }
            }
          }
        }
      } catch {
        // Status JSON failed, try parsing regular stream or status.xsl
      }
    } catch {
      // General error
    }

    return {
      name,
      description,
      logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      websiteUrl: url,
      countryCode: 'TZ',
      city: 'Dar es Salaam',
      language: 'Swahili / English',
      genre,
      categoryId: 'cat_gospel_music',
      streamUrl,
      streamType,
      bitrateKbps,
      sourceType: this.sourceType,
      sourceUrl: url,
      nowPlaying,
      confidenceMap: {
        name: Boolean(name && name !== 'Icecast Christian Broadcast'),
        streamUrl: true,
        logoUrl: false,
        description: Boolean(description && !description.includes('Live online audio stream powered by Icecast')),
        countryCode: false,
        city: false,
        language: false,
        genre: Boolean(genre && genre !== 'Gospel & Praise'),
      },
    };
  }
}
