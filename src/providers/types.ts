import {
  BrowseSection,
  Playlist,
  ProviderId,
  SearchFilters,
  SearchResult,
  StreamDescriptor,
  Track,
} from '../types/music';

export interface MusicProviderCapabilities {
  supportsBackgroundPlayback: boolean;
  supportsOfflineDownload: boolean;
  supportsDirectAudioStream: boolean;
}

export interface MusicProvider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly capabilities: MusicProviderCapabilities;

  search(query: string, filters?: SearchFilters): Promise<SearchResult>;
  getTrack(id: string): Promise<Track | null>;
  getStreamUrl(id: string): Promise<StreamDescriptor | null>;
  getPlaylists(language?: string): Promise<Playlist[]>;
  getBrowseSections(language?: string): Promise<BrowseSection[]>;
}
