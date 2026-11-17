import type { BrowseSection, Filters, MusicProvider, PlaybackSource, Playlist, SearchEntity, SearchPage, Track } from './contracts.ts';
import { matches, nextCursor, page, ProviderError, rawId, rejectEntityFilters } from './core.ts';

export class MockProvider implements MusicProvider {
  readonly id = 'mock' as const;
  private tracks(): Track[] {
    return [
      { slug: 'en', title: 'English UI demo · original test tone', language: 'en' as const },
      { slug: 'hi', title: 'हिन्दी UI डेमो · टेस्ट टोन', language: 'hi' as const },
      { slug: 'bn', title: 'বাংলা UI ডেমো · টেস্ট টোন', language: 'bn' as const },
    ].map((demo) => ({ kind: 'track', id: `mock:${demo.slug}`, provider: this.id, title: demo.title,
      artistName: 'Ritika development fixtures', albumTitle: 'Original test tones', language: demo.language,
      durationSeconds: 8, genres: ['ambient'], moods: ['calm'], isDemo: true,
      // Language labels exercise UI filtering; tones contain no sung lyrics or historic release date.
      permissions: { stream: true, background: true, offline: true, appAds: false },
      attribution: { provider: this.id, sourceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        text: 'Generated original test tones · Ritika development fixture', licenseName: 'CC0 test audio', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' } }));
  }
  async search(query: string, filters: Filters = {}): Promise<SearchPage> {
    rejectEntityFilters(filters);
    const { limit, offset } = page(filters);
    const catalogue = this.tracks();
    const term = query.trim().toLowerCase();
    const kind = filters.kind ?? 'track';
    let all: SearchEntity[];
    if (kind === 'artist') {
      const artists = [...new Map(catalogue.map((track) => [track.artistName, track])).values()];
      all = artists.map((track, index) => ({ kind: 'artist' as const, id: index === 0 ? 'mock:artist' : `mock:artist-${index}`, provider: this.id,
        name: track.artistName, attribution: track.attribution })).filter((artist) => artist.name.toLowerCase().includes(term));
    } else if (kind === 'album') {
      const albums = [...new Map(catalogue.filter((track) => track.albumTitle).map((track) => [`${track.artistName}\u0000${track.albumTitle}`, track])).values()];
      all = albums.map((track, index) => ({ kind: 'album' as const, id: index === 0 ? 'mock:album' : `mock:album-${index}`, provider: this.id,
        title: track.albumTitle!, artistName: track.artistName, attribution: track.attribution }))
        .filter((album) => `${album.title} ${album.artistName}`.toLowerCase().includes(term));
    } else {
      all = catalogue.filter((track) => matches(track, filters) && `${track.title} ${track.artistName} ${track.albumTitle ?? ''}`.toLowerCase().includes(term));
    }
    const items = all.slice(offset, offset + limit);
    return { items, nextCursor: offset + limit < all.length ? nextCursor(items.length, limit, offset) : undefined, notices: ['Development fixtures only. Audio is a generated tone, not commercial music.'] };
  }
  async getTrack(id: string): Promise<Track> {
    rawId(id, this.id); const track = this.tracks().find((t) => t.id === id);
    if (!track) throw new ProviderError('NOT_FOUND', 'Demo track not found'); return track;
  }
  async getStreamUrl(id: string): Promise<PlaybackSource> {
    const track = await this.getTrack(id);
    return { kind: 'native', url: '/v1/mock-audio.wav', permissions: track.permissions, attribution: track.attribution };
  }
  async getPlaylists(): Promise<Playlist[]> {
    const tracks = this.tracks(); return [{ id: 'mock:demo', provider: this.id, title: 'Development test tones',
      trackIds: tracks.map((t) => t.id), attribution: tracks[0]!.attribution }];
  }
  async getBrowseSections(filters: Filters = {}): Promise<BrowseSection[]> {
    return [
      { id: 'trending', titleKey: 'home.trending', tracks: this.tracks().filter((t) => matches(t, filters)), notices: ['Demo section; these tracks are not real chart entries.'] },
      { id: 'new-releases', titleKey: 'home.newReleases', tracks: [], notices: ['No real releases in the development catalogue.'] },
      { id: 'classics', titleKey: 'home.classics', tracks: [], notices: ['No historic recordings in the development catalogue.'] },
    ];
  }
}
