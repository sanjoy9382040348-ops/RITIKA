import {
  BrowseSection,
  Playlist,
  SearchFilters,
  SearchResult,
  StreamDescriptor,
  Track,
} from '../types/music';
import { MusicProvider } from './types';

const MOCK_TRACKS: Track[] = [
  {
    id: 'mock:en-1',
    nativeId: 'en-1',
    providerId: 'mock',
    title: 'Midnight Neon Drive',
    artist: 'Aria Vance',
    album: 'City Lights',
    artworkUrl: 'https://picsum.photos/seed/ritika1/400/400',
    durationSec: 214,
    language: 'en',
    genre: 'Synthpop',
    mood: 'Chill',
    releaseYear: 2025,
    isClassic: false,
    supportsBackgroundPlay: true,
    license: {
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      requiresAttribution: true,
      attributionText: '"Midnight Neon Drive" by Aria Vance (CC BY 4.0)',
      allowOfflineDownload: true,
    },
  },
  {
    id: 'mock:bn-1',
    nativeId: 'bn-1',
    providerId: 'mock',
    title: 'শহরের বৃষ্টি (Monsoon Echoes)',
    artist: 'Kabir Sen',
    album: 'Monsoon Acoustic',
    artworkUrl: 'https://picsum.photos/seed/ritika2/400/400',
    durationSec: 242,
    language: 'bn',
    genre: 'Indie Acoustic',
    mood: 'Romantic',
    releaseYear: 2026,
    isClassic: false,
    supportsBackgroundPlay: true,
    license: {
      name: 'CC BY-NC 4.0',
      requiresAttribution: true,
      attributionText: 'Monsoon Echoes — Kabir Sen (CC BY-NC 4.0)',
      allowOfflineDownload: true,
    },
  },
  {
    id: 'mock:hi-classic-1',
    nativeId: 'hi-classic-1',
    providerId: 'mock',
    title: 'चाँदनी रातें (Golden Era Tribute)',
    artist: 'Raghav & Ensemble',
    album: '1970s Retro Sessions',
    artworkUrl: 'https://picsum.photos/seed/ritika3/400/400',
    durationSec: 268,
    language: 'hi',
    genre: 'Classic Melody',
    mood: 'Nostalgic',
    releaseYear: 1978,
    isClassic: true,
    supportsBackgroundPlay: true,
    license: {
      name: 'CC BY 4.0',
      requiresAttribution: true,
      attributionText: 'Golden Era Tribute — Raghav & Ensemble (CC BY 4.0)',
      allowOfflineDownload: false,
    },
  },
];

export class MockProvider implements MusicProvider {
  readonly id = 'mock' as const;
  readonly displayName = 'Ritika Dev Catalog';
  readonly capabilities = {
    supportsBackgroundPlayback: true,
    supportsOfflineDownload: true,
    supportsDirectAudioStream: true,
  };

  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    const filtered = MOCK_TRACKS.filter((t) => {
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre?.toLowerCase().includes(q) ?? false);
      const matchesLang = !filters.language || filters.language === 'all' || t.language === filters.language;
      const matchesEra =
        !filters.era ||
        filters.era === 'all' ||
        (filters.era === 'classic' ? t.isClassic : !t.isClassic);
      const matchesGenre = !filters.genre || t.genre?.toLowerCase() === filters.genre.toLowerCase();
      return matchesQuery && matchesLang && matchesEra && matchesGenre;
    });
    return { tracks: filtered, hasMore: false };
  }

  async getTrack(id: string): Promise<Track | null> {
    return MOCK_TRACKS.find((t) => t.id === id) ?? null;
  }

  async getStreamUrl(id: string): Promise<StreamDescriptor | null> {
    const track = await this.getTrack(id);
    if (!track) return null;
    return {
      type: 'audio',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      mimeType: 'audio/mpeg',
    };
  }

  async getPlaylists(): Promise<Playlist[]> {
    return [
      {
        id: 'mock:pl:classics',
        providerId: 'mock',
        title: '60s–90s Evergreen Classics',
        artworkUrl: 'https://picsum.photos/seed/ritika-pl/400/400',
        trackCount: 1,
        tracks: MOCK_TRACKS.filter((t) => t.isClassic),
      },
    ];
  }

  async getBrowseSections(language?: string): Promise<BrowseSection[]> {
    const scoped = language && language !== 'all'
      ? MOCK_TRACKS.filter((t) => t.language === language)
      : MOCK_TRACKS;

    return [
      { id: 'mock-trending', title: 'Trending Now', kind: 'trending', items: scoped },
      { id: 'mock-new', title: 'New Releases', kind: 'new_releases', items: scoped.filter((t) => !t.isClassic) },
      { id: 'mock-classics', title: 'Classics (60s–90s)', kind: 'classics', items: scoped.filter((t) => t.isClassic) },
    ];
  }
}
