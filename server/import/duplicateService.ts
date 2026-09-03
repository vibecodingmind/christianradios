import { db } from '../db.js';
import type { DuplicateMatch, ExtractedStationMetadata } from './types.js';
import { URL } from 'url';

function normalizeUrlString(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

function normalizeDomain(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Levenshtein distance based score
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

export function detectDuplicates(
  metadata: ExtractedStationMetadata,
  excludeStationId?: string
): DuplicateMatch[] {
  const allStations = db.stations.getAll();
  const matches: DuplicateMatch[] = [];
  const seenIds = new Set<string>();

  const normStream = normalizeUrlString(metadata.streamUrl);
  const normSource = normalizeUrlString(metadata.sourceUrl);
  const targetDomain = normalizeDomain(metadata.websiteUrl || metadata.sourceUrl);

  for (const stn of allStations) {
    if (excludeStationId && stn.id === excludeStationId) continue;
    if (seenIds.has(stn.id)) continue;

    // 1. Exact Stream URL match
    const existingNormStream = normalizeUrlString(stn.streamUrl);
    if (normStream && existingNormStream && normStream === existingNormStream) {
      matches.push({
        stationId: stn.id,
        stationName: stn.name,
        stationSlug: stn.slug,
        logoUrl: stn.logoUrl,
        countryCode: stn.countryCode,
        city: stn.city,
        ownerId: stn.ownerId,
        matchReason: 'STREAM_URL_EXACT',
        similarityScore: 1.0,
      });
      seenIds.add(stn.id);
      continue;
    }

    // 2. Exact Source URL match
    if (stn.sourceUrl && normSource) {
      const existingNormSource = normalizeUrlString(stn.sourceUrl);
      if (existingNormSource === normSource) {
        matches.push({
          stationId: stn.id,
          stationName: stn.name,
          stationSlug: stn.slug,
          logoUrl: stn.logoUrl,
          countryCode: stn.countryCode,
          city: stn.city,
          ownerId: stn.ownerId,
          matchReason: 'SOURCE_URL_EXACT',
          similarityScore: 1.0,
        });
        seenIds.add(stn.id);
        continue;
      }
    }

    // 3. Exact Website Domain match
    if (targetDomain && stn.websiteUrl) {
      const existingDomain = normalizeDomain(stn.websiteUrl);
      if (existingDomain && existingDomain === targetDomain) {
        matches.push({
          stationId: stn.id,
          stationName: stn.name,
          stationSlug: stn.slug,
          logoUrl: stn.logoUrl,
          countryCode: stn.countryCode,
          city: stn.city,
          ownerId: stn.ownerId,
          matchReason: 'WEBSITE_EXACT',
          similarityScore: 0.9,
        });
        seenIds.add(stn.id);
        continue;
      }
    }

    // 4. Name similarity (>= 85%)
    if (metadata.name && stn.name) {
      const score = stringSimilarity(metadata.name, stn.name);
      if (score >= 0.85) {
        matches.push({
          stationId: stn.id,
          stationName: stn.name,
          stationSlug: stn.slug,
          logoUrl: stn.logoUrl,
          countryCode: stn.countryCode,
          city: stn.city,
          ownerId: stn.ownerId,
          matchReason: 'NAME_SIMILAR',
          similarityScore: Math.round(score * 100) / 100,
        });
        seenIds.add(stn.id);
      }
    }
  }

  return matches;
}
