import { db } from '../db.js';
import type { Station, PodcastEpisode, PrayerRequest, Category, Country } from '../types.js';

export interface StationQueryResult {
  stations: Station[];
  total: number;
  querySummary: string;
}

export interface ContentQueryResult {
  stations?: Station[];
  sermons?: PodcastEpisode[];
  prayers?: PrayerRequest[];
  verses?: Array<{ reference: string; text: string }>;
  summary: string;
}

/**
 * Searches stations in db.json with filter parameters
 */
export function searchStations(params: {
  query?: string;
  genre?: string;
  category?: string;
  country?: string;
  language?: string;
  denomination?: string;
  streamStatus?: string;
  limit?: number;
}): StationQueryResult {
  const {
    query = '',
    genre = '',
    category = '',
    country = '',
    language = '',
    denomination = '',
    streamStatus = '',
    limit = 12,
  } = params;

  let activeStations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  if (category) {
    const cat = db.categories.findBySlug(category) || db.categories.findById(category);
    if (cat) {
      activeStations = activeStations.filter((s) => s.categoryId === cat.id);
    }
  }

  if (country) {
    activeStations = activeStations.filter(
      (s) =>
        s.countryCode.toUpperCase() === country.toUpperCase() ||
        (db.countries.findByCode(s.countryCode)?.name.toLowerCase() === country.toLowerCase())
    );
  }

  if (language) {
    activeStations = activeStations.filter(
      (s) => (s.language || '').toLowerCase().includes(language.toLowerCase())
    );
  }

  if (genre) {
    activeStations = activeStations.filter(
      (s) =>
        (s.genre || '').toLowerCase().includes(genre.toLowerCase()) ||
        (s.tagline || '').toLowerCase().includes(genre.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(genre.toLowerCase())
    );
  }

  if (denomination) {
    activeStations = activeStations.filter(
      (s) => (s.denomination || '').toLowerCase().includes(denomination.toLowerCase())
    );
  }

  if (streamStatus) {
    activeStations = activeStations.filter(
      (s) => (s.streamStatus || 'ONLINE').toUpperCase() === streamStatus.toUpperCase()
    );
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    activeStations = activeStations.filter((s) => {
      const c = db.countries.findByCode(s.countryCode);
      const cat = db.categories.findById(s.categoryId);
      const searchBlob = [
        s.name,
        s.city,
        s.countryCode,
        s.genre,
        s.language || '',
        s.tagline || '',
        s.denomination || '',
        s.region || '',
        s.description || '',
        c?.name || '',
        cat?.name || '',
      ]
        .join(' ')
        .toLowerCase();
      return searchBlob.includes(q);
    });
  }

  // Sort by playCount desc
  activeStations.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

  const total = activeStations.length;
  const sliced = activeStations.slice(0, limit);

  return {
    stations: sliced,
    total,
    querySummary: `Found ${total} stations matching query criteria`,
  };
}

/**
 * Gets specific station by ID or Slug
 */
export function getStation(identifier: { id?: string; slug?: string }): Station | null {
  if (identifier.id) {
    return db.stations.findById(identifier.id) || null;
  }
  if (identifier.slug) {
    return db.stations.findBySlug(identifier.slug) || null;
  }
  return null;
}

/**
 * Searches podcast episodes / sermons
 */
export function searchSermons(params: {
  query?: string;
  speaker?: string;
  stationId?: string;
  limit?: number;
}): { sermons: PodcastEpisode[]; total: number } {
  const { query = '', speaker = '', stationId = '', limit = 10 } = params;

  let episodes = db.podcastEpisodes.getAll();

  if (stationId) {
    episodes = episodes.filter((ep) => ep.stationId === stationId);
  }

  if (speaker) {
    episodes = episodes.filter((ep) =>
      (ep.preacherName || '').toLowerCase().includes(speaker.toLowerCase())
    );
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    episodes = episodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        (ep.description || '').toLowerCase().includes(q) ||
        (ep.preacherName || '').toLowerCase().includes(q)
    );
  }

  return {
    sermons: episodes.slice(0, limit),
    total: episodes.length,
  };
}

/**
 * Searches public prayer wall requests for relevant topics
 */
export function searchPrayerContent(params: {
  topic?: string;
  limit?: number;
}): { prayers: PrayerRequest[]; total: number } {
  const { topic = '', limit = 6 } = params;

  let prayers = db.prayerRequests.getAll().filter((p) => p.status === 'APPROVED');

  if (topic && topic.trim() !== '') {
    const q = topic.toLowerCase().trim();
    prayers = prayers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.prayerPoints || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }

  return {
    prayers: prayers.slice(0, limit),
    total: prayers.length,
  };
}

/**
 * Contextual recommendation engine based on mood/genre/country
 */
export function getRecommendedStations(params: {
  context?: string;
  countryCode?: string;
  language?: string;
  limit?: number;
}): Station[] {
  const { context = '', countryCode = '', language = '', limit = 8 } = params;

  let all = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  if (countryCode) {
    const countryStations = all.filter(
      (s) => s.countryCode.toUpperCase() === countryCode.toUpperCase()
    );
    if (countryStations.length > 0) {
      all = countryStations;
    }
  } else if (language) {
    const langStations = all.filter((s) =>
      (s.language || '').toLowerCase().includes(language.toLowerCase())
    );
    if (langStations.length > 0) {
      all = langStations;
    }
  } else if (context) {
    const ctx = context.toLowerCase();
    const matches = all.filter(
      (s) =>
        s.genre.toLowerCase().includes(ctx) ||
        (s.tagline || '').toLowerCase().includes(ctx) ||
        (s.description || '').toLowerCase().includes(ctx)
    );
    if (matches.length > 0) {
      all = matches;
    }
  }

  // Sort by play count & isFeatured
  all.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return (b.playCount || 0) - (a.playCount || 0);
  });

  return all.slice(0, limit);
}

/**
 * Gets quick platform stats for AI context awareness
 */
export function getPlatformMetadata() {
  const stations = db.stations.getAll().filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');
  const countries = db.countries.getAll();
  const categories = db.categories.getAll();

  const uniqueLanguages = Array.from(
    new Set(stations.map((s) => s.language).filter(Boolean))
  );

  return {
    totalStations: stations.length,
    countriesCount: countries.length,
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    availableLanguages: uniqueLanguages,
  };
}
