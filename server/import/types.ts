import type { SourceType, StreamType } from '../types.js';

export interface ExtractedStationMetadata {
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  websiteUrl?: string;
  countryCode: string;
  region?: string;
  city: string;
  language: string;
  genre: string;
  categoryId?: string;
  denomination?: string;
  streamUrl: string;
  backupStreamUrl?: string;
  streamType: StreamType;
  bitrateKbps?: number;
  timezone?: string;
  sourceType: SourceType;
  sourceUrl: string;
  externalId?: string;
  nowPlaying?: {
    title?: string;
    artist?: string;
    album?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
  };
  rawMetadata?: Record<string, any>;
  confidenceMap: {
    name: boolean;
    streamUrl: boolean;
    logoUrl: boolean;
    description: boolean;
    countryCode: boolean;
    city: boolean;
    language: boolean;
    genre: boolean;
  };
}

export interface DuplicateMatch {
  stationId: string;
  stationName: string;
  stationSlug: string;
  logoUrl?: string;
  countryCode: string;
  city: string;
  ownerId: string;
  matchReason: 'STREAM_URL_EXACT' | 'SOURCE_URL_EXACT' | 'WEBSITE_EXACT' | 'NAME_SIMILAR';
  similarityScore?: number;
}

export interface RadioImportPreviewResult {
  sourceType: SourceType;
  sourceUrl: string;
  externalId?: string;
  metadata: ExtractedStationMetadata;
  streamValidation: {
    isValid: boolean;
    statusCode?: number;
    detectedType?: StreamType;
    bitrateKbps?: number;
    latencyMs?: number;
    contentType?: string;
    error?: string;
  };
  duplicates: DuplicateMatch[];
  warnings: string[];
}

export interface RadioImportProvider {
  name: string;
  sourceType: SourceType;
  canHandle(url: string): boolean;
  extract(url: string): Promise<ExtractedStationMetadata>;
}
