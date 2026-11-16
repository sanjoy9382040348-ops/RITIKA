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

export class YouTubeProvider implements MusicProvider {
  readonly id = 'youtube' as const;
  readonly displayName = 'YouTube (Official Embed)';
  readonly capabilities = {
    supportsBackgroundPlayback: false,
    supportsOfflineDownload: false,
    supportsDirectAudioStream: false,
  };

  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const data = await apiClient.get<{ items: any[] }>('/providers/youtube/search', {
      params: {
        q: query,
        lang: filters.language !== 'all' ? filters.language : undefined,
        era: filters.era,
        limit: filters.limit ?? 15,
      },
    });

    const tracks: Track[] = data.items.map((item) => ({
      id: `youtube:${item.videoId}`,
      nativeId: item.videoId,
      providerId: 'youtube',
      title: item.title,
      artist: item.channelTitle,
      artworkUrl: item.thumbnailUrl,
      durationSec: item.durationSec ?? 0,
      language: (item.language as LanguageCode) ?? 'hi',
      releaseYear: item.releaseYear,
      isClassic: filters.era === 'classic',
      supportsBackgroundPlay: false,
      license: {
        name: 'YouTube Standard License',
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        requiresAttribution: true,
        attributionText: `${item.title} — ${item.channelTitle} (via YouTube)`,
        allowOfflineDownload: false,
      },
    }));

    return { tracks, hasMore: false };
  }

  async getTrack(id: string): Promise<Track | null> {
    const videoId = id.replace(/^youtube:/, '');
    const res = await this.search(videoId, { limit: 1 });
    return res.tracks[0] ?? null;
  }

  async getStreamUrl(id: string): Promise<StreamDescriptor | null> {
    const videoId = id.replace(/^youtube:/, '');
    return { type: 'youtube_embed', url: videoId };
  }

  async getPlaylists(): Promise<Playlist[]> {
    return [];
  }

  async getBrowseSections(): Promise<BrowseSection[]> {
    return [];
  }
}
