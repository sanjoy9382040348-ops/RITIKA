/** Canonical public wire contract. sync-contract.mjs copies this to the mobile starter. */
export type ProviderId = 'mock' | 'jamendo' | 'audius' | 'youtube';
export type Language = 'en' | 'hi' | 'bn';
export type EntityKind = 'track' | 'artist' | 'album';
export type Era = 'classic' | 'new'; // classic: 1960–1999; new: released in the last 365 days
export interface Filters {
  language?: Language;
  era?: Era;
  genre?: string;
  mood?: string;
  kind?: EntityKind;
  limit?: number;
  cursor?: string;
}
export interface Attribution {
  provider: ProviderId;
  sourceUrl: string;
  text: string;
  licenseName: string;
  licenseUrl?: string;
}
export interface Permissions {
  stream: boolean;
  background: boolean;
  offline: boolean;
  appAds: boolean;
}
export interface Artist {
  kind: 'artist'; id: string; provider: ProviderId; name: string;
  artworkUrl?: string; attribution: Attribution;
}
export interface Album {
  kind: 'album'; id: string; provider: ProviderId; title: string;
  artistName: string; artworkUrl?: string; attribution: Attribution;
}
export interface Track {
  kind: 'track'; id: string; provider: ProviderId; title: string;
  artistName: string; albumTitle?: string; artworkUrl?: string;
  durationSeconds?: number; releaseDate?: string; language?: Language;
  genres: string[]; moods: string[]; isDemo: boolean;
  permissions: Permissions; attribution: Attribution;
  youtube?: { madeForKids: boolean };
}
export type SearchEntity = Track | Artist | Album;
export interface SearchPage {
  items: SearchEntity[];
  nextCursor?: string;
  notices: string[];
}
export interface Playlist {
  id: string; provider: ProviderId; title: string; artworkUrl?: string;
  trackIds: string[]; attribution: Attribution;
}
export interface BrowseSection {
  id: 'trending' | 'new-releases' | 'classics' | 'mood' | 'genre';
  titleKey: string; tracks: Track[]; notices: string[];
}
export type PlaybackSource =
  | { kind: 'native'; url: string; permissions: Permissions; attribution: Attribution }
  | { kind: 'youtube-embed'; videoId: string; embedUrl: string;
      autoplay: false; madeForKids: boolean; permissions: Permissions; attribution: Attribution };

export interface MusicProvider {
  readonly id: ProviderId;
  search(query: string, filters?: Filters): Promise<SearchPage>;
  getTrack(id: string): Promise<Track>;
  /** Historical name; embeds deliberately return metadata, never an extracted URL. */
  getStreamUrl(id: string): Promise<PlaybackSource>;
  getPlaylists(): Promise<Playlist[]>;
  getBrowseSections(filters?: Filters): Promise<BrowseSection[]>;
}
