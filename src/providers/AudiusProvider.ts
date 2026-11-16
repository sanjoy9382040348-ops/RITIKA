import { apiClient } from '@api/client';
import {
  BrowseSection,
  Playlist,
  SearchFilters,
  SearchResult,
  StreamDescriptor,
  Track,
} from '../types/music';
import { MusicProvider } from './types';

interface AudiusApiTrack {
  id: string;
  title: string;
  user: { name: string };
  artwork?: { '480x480'?: string; '150x150'?: string };
  duration: number;
  genre?: string;
  mood?: string;
  release_date?: string;
  is_downloadable?: boolean;
}

export class AudiusProvider implements MusicProvider {
  readonly id = 'audius' as const;
  readonly displayName = 'Audius';
  readonly capabilities = {
    supportsBackgroundPlayback: true,
    supportsOfflineDownload: false,
    supportsDirectAudioStream: true,
  };

  private mapTrack(raw: AudiusApiTrack): Track {
    const year = raw.release_date ? Number(raw.release_date.slice(0, 4)) : undefined;
    return {
      id: `audius:${raw.id}`,
      nativeId: raw.id,
      providerId: 'audius',
      title: raw.title,
      artist: raw.user.name,
      artworkUrl: raw.artwork?.['480x480'] || raw.artwork?.['150x150'] || '',
      durationSec: raw.duration,
      language: 'en',
      genre: raw.genre,
      mood: raw.mood,
      releaseYear: year,
      isClassic: Boolean(year && year <= 1999),
      supportsBackgroundPlay: true,
      license: {
        name: 'Audius Creator License',
        requiresAttribution: true,
        attributionText: `${raw.title} — ${raw.user.name} on Audius`,
        allowOfflineDownload: Boolean(raw.is_downloadable),
      },
    };
  }

  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const data = await apiClient.get<{ data: AudiusApiTrack[] }>('/providers/audius/search', {
      params: { q: query, genre: filters.genre, limit: filters.limit ?? 20 },
    });
    const tracks = data.data.map((t) => this.mapTrack(t));
    return { tracks, hasMore: false };
  }

  async getTrack(id: string): Promise<Track | null> {
    const nativeId = id.replace(/^audius:/, '');
    const data = await apiClient.get<{ data: AudiusApiTrack }>(`/providers/audius/tracks/${nativeId}`);
    return data.data ? this.mapTrack(data.data) : null;
  }

  async getStreamUrl(id: string): Promise<StreamDescriptor | null> {
    const nativeId = id.replace(/^audius:/, '');
    const data = await apiClient.get<{ streamUrl: string }>(`/providers/audius/tracks/${nativeId}/stream`);
    return data.streamUrl ? { type: 'audio', url: data.streamUrl, mimeType: 'audio/mpeg' } : null;
  }

  async getPlaylists(): Promise<Playlist[]> {
    const data = await apiClient.get<{ data: any[] }>('/providers/audius/playlists/trending');
    return data.data.map((p) => ({
      id: `audius:pl:${p.id}`,
      providerId: 'audius',
      title: p.playlist_name,
      artworkUrl: p.artwork?.['480x480'] || '',
      trackCount: p.track_count ?? 0,
    }));
  }

  async getBrowseSections(): Promise<BrowseSection[]> {
    const data = await apiClient.get<{ data: AudiusApiTrack[] }>('/providers/audius/trending');
    return [
      {
        id: 'audius-trending',
        title: 'Fresh on Audius',
        kind: 'trending',
        items: data.data.map((t) => this.mapTrack(t)),
      },
    ];
  }
}
