import { apiClient } from '@api/client';
import {
  BrowseSection,
  LanguageCode,
  Playlist,
  SearchFilters,
  SearchResult,
  StreamDescriptor,
  Track,
} from '../types/music';
import { MusicProvider } from './types';

interface JamendoApiTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name?: string;
  image: string;
  duration: number;
  audio: string;
  audiodownload_allowed: boolean;
  license_ccurl: string;
  releasedate?: string;
  musicinfo?: { tags?: { genres?: string[] }; lang?: string };
}

export class JamendoProvider implements MusicProvider {
  readonly id = 'jamendo' as const;
  readonly displayName = 'Jamendo (Creative Commons)';
  readonly capabilities = {
    supportsBackgroundPlayback: true,
    supportsOfflineDownload: true,
    supportsDirectAudioStream: true,
  };

  private mapTrack(raw: JamendoApiTrack): Track {
    const year = raw.releasedate ? Number(raw.releasedate.slice(0, 4)) : undefined;
    const lang = (raw.musicinfo?.lang as LanguageCode) || 'en';
    const genre = raw.musicinfo?.tags?.genres?.[0];

    return {
      id: `jamendo:${raw.id}`,
      nativeId: raw.id,
      providerId: 'jamendo',
      title: raw.name,
      artist: raw.artist_name,
      album: raw.album_name,
      artworkUrl: raw.image,
      durationSec: raw.duration,
      language: ['en', 'hi', 'bn'].includes(lang) ? lang : 'en',
      genre,
      releaseYear: year,
      isClassic: Boolean(year && year <= 1999),
      supportsBackgroundPlay: true,
      license: {
        name: 'Creative Commons',
        url: raw.license_ccurl,
        requiresAttribution: true,
        attributionText: `"${raw.name}" by ${raw.artist_name} (via Jamendo, CC License)`,
        allowOfflineDownload: raw.audiodownload_allowed,
      },
    };
  }

  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const data = await apiClient.get<{ results: JamendoApiTrack[] }>('/providers/jamendo/search', {
      params: {
        q: query,
        lang: filters.language !== 'all' ? filters.language : undefined,
        genre: filters.genre,
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      },
    });
    const tracks = data.results.map((t) => this.mapTrack(t));
    return { tracks, hasMore: tracks.length === (filters.limit ?? 20) };
  }

  async getTrack(id: string): Promise<Track | null> {
    const nativeId = id.replace(/^jamendo:/, '');
    const data = await apiClient.get<{ results: JamendoApiTrack[] }>(`/providers/jamendo/tracks/${nativeId}`);
    return data.results[0] ? this.mapTrack(data.results[0]) : null;
  }

  async getStreamUrl(id: string): Promise<StreamDescriptor | null> {
    const nativeId = id.replace(/^jamendo:/, '');
    const data = await apiClient.get<{ results: JamendoApiTrack[] }>(`/providers/jamendo/tracks/${nativeId}`);
    const url = data.results[0]?.audio;
    return url ? { type: 'audio', url, mimeType: 'audio/mpeg' } : null;
  }

  async getPlaylists(): Promise<Playlist[]> {
    const data = await apiClient.get<{ results: any[] }>('/providers/jamendo/playlists');
    return data.results.map((p) => ({
      id: `jamendo:pl:${p.id}`,
      providerId: 'jamendo',
      title: p.name,
      artworkUrl: p.image || 'https://via.placeholder.com/300',
      trackCount: p.track_count ?? 0,
    }));
  }

  async getBrowseSections(): Promise<BrowseSection[]> {
    const data = await apiClient.get<{ results: JamendoApiTrack[] }>('/providers/jamendo/trending');
    return [
      {
        id: 'jamendo-trending',
        title: 'Indie & Creative Commons Trending',
        kind: 'trending',
        items: data.results.map((t) => this.mapTrack(t)),
      },
    ];
  }
}
