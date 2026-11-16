export type LanguageCode = 'en' | 'hi' | 'bn';
export type EraFilter = 'all' | 'new' | 'classic';
export type ProviderId = 'jamendo' | 'audius' | 'youtube' | 'mock';

export interface LicenseInfo {
  name: string;
  url?: string;
  requiresAttribution: boolean;
  attributionText?: string;
  allowOfflineDownload: boolean;
}

export interface StreamDescriptor {
  type: 'audio' | 'youtube_embed';
  url: string;
  expiresAt?: number;
  mimeType?: string;
}

export interface Track {
  id: string;
  nativeId: string;
  providerId: ProviderId;
  title: string;
  artist: string;
  album?: string;
  artworkUrl: string;
  durationSec: number;
  language: LanguageCode;
  genre?: string;
  mood?: string;
  releaseYear?: number;
  isClassic: boolean;
  license: LicenseInfo;
  supportsBackgroundPlay: boolean;
}

export interface Playlist {
  id: string;
  providerId: ProviderId;
  title: string;
  description?: string;
  artworkUrl: string;
  trackCount: number;
  tracks?: Track[];
  language?: LanguageCode;
}

export interface BrowseSection {
  id: string;
  title: string;
  kind: 'trending' | 'new_releases' | 'classics' | 'mood' | 'genre';
  language?: LanguageCode;
  items: Track[];
}

export interface SearchFilters {
  language?: LanguageCode | 'all';
  era?: EraFilter;
  genre?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  tracks: Track[];
  hasMore: boolean;
}
