import type { Album, Artist, Attribution, BrowseSection, Filters, MusicProvider, PlaybackSource, Playlist, SearchEntity, SearchPage, Track } from './contracts.ts';
import { https, json, matches, nextCursor, object, optionalObject, optionalString, page, permissions, ProviderError, rawId, rejectEntityFilters, requirePlayback, rows, string } from './core.ts';
import type { Http, RightsResolver } from './core.ts';

export class AudiusProvider implements MusicProvider {
  readonly id = 'audius' as const;
  private readonly http: Http;
  private readonly rights: RightsResolver;
  constructor(options: { http?: Http; rights?: RightsResolver } = {}) {
    this.http = options.http ?? fetch; this.rights = options.rights ?? (() => ({}));
  }
  private async request(path: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.audius.co/v1/${path}`);
    url.search = new URLSearchParams({ app_name: 'Ritika', ...params }).toString();
    return json(url, this.http);
  }
  private artwork(value: unknown): string | undefined { const r = optionalObject(value); return https(r['480x480']) ?? https(r['150x150']); }
  private attribution(row: Record<string, unknown>): Attribution {
    const user = optionalObject(row.user);
    return { provider: this.id, sourceUrl: https(row.permalink) ?? 'https://audius.co',
      text: `${optionalString(row.title) ?? optionalString(row.playlist_name) ?? optionalString(row.name) ?? 'Music'} — ${optionalString(user.name) ?? 'Audius'} · Audius`,
      licenseName: optionalString(row.license) ?? 'Audius terms; no blanket download or advertising licence' };
  }
  private track(row: Record<string, unknown>): Track {
    const id = `audius:${string(row.id)}`; const user = optionalObject(row.user);
    // Upload/release timestamps are not evidence of the original song's era.
    return { kind: 'track', id, provider: this.id, title: string(row.title), artistName: string(user.name),
      artworkUrl: this.artwork(row.artwork), durationSeconds: typeof row.duration === 'number' ? row.duration : undefined,
      genres: optionalString(row.genre) ? [String(row.genre)] : [], moods: optionalString(row.mood) ? [String(row.mood)] : [],
      isDemo: false,
      permissions: permissions(id, this.rights, row.is_streamable === true && row.is_stream_gated === false && row.is_available !== false && row.is_delete !== true && row.is_unlisted !== true),
      attribution: this.attribution(row) };
  }
  async search(query: string, filters: Filters = {}): Promise<SearchPage> {
    rejectEntityFilters(filters); const { limit, offset } = page(filters); const kind = filters.kind ?? 'track';
    if (filters.language || filters.era) return { items: [], notices: ['Audius does not supply verified song language/original release year in this adapter.'] };
    const path = kind === 'artist' ? 'users/search' : kind === 'album' ? 'playlists/search' : 'tracks/search';
    const result = rows((await this.request(path, { query, limit: String(limit), offset: String(offset) })).data);
    const items: SearchEntity[] = kind === 'track' ? result.map((r) => this.track(r)).filter((t) => matches(t, filters)) : result.filter((r) => kind !== 'album' || r.is_album === true).map((r) => {
      const base = { id: `audius:${string(r.id)}`, provider: this.id, attribution: this.attribution(r) };
      return kind === 'artist' ? { ...base, kind: 'artist', name: string(r.name), artworkUrl: this.artwork(r.profile_picture) } as Artist
        : { ...base, kind: 'album', title: string(r.playlist_name), artistName: string(optionalObject(r.user).name), artworkUrl: this.artwork(r.artwork) } as Album;
    });
    return { items, nextCursor: nextCursor(result.length, limit, offset), notices: ['Genre and mood filters apply to each provider page.'] };
  }
  async getTrack(id: string): Promise<Track> {
    const raw = rawId(id, this.id); const result = await this.request(`tracks/${raw}`);
    if (result.data === null) throw new ProviderError('NOT_FOUND', 'Track not found');
    const row = object(result.data);
    if (String(row.id) !== raw) throw new ProviderError('NOT_FOUND', 'Track not found');
    return this.track(row);
  }
  async getStreamUrl(id: string): Promise<PlaybackSource> {
    const track = await this.getTrack(id); requirePlayback(track);
    // Public streaming endpoint, no server credential is returned or proxied to the device.
    return { kind: 'native', url: `https://api.audius.co/v1/tracks/${rawId(id, this.id)}/stream?app_name=Ritika`, permissions: track.permissions, attribution: track.attribution };
  }
  async getPlaylists(): Promise<Playlist[]> {
    return rows((await this.request('playlists/trending', { limit: '10' })).data).map((r) => ({
      id: `audius:${string(r.id)}`, provider: this.id, title: string(r.playlist_name), artworkUrl: this.artwork(r.artwork),
      trackIds: rows(r.playlist_contents ?? []).map((t) => `audius:${string(t.track_id)}`), attribution: this.attribution(r),
    }));
  }
  async getBrowseSections(filters: Filters = {}): Promise<BrowseSection[]> {
    const notices = ['Original release dates and song languages are unavailable; filtered sections may be empty.'];
    const result = filters.language || filters.era ? [] : rows((await this.request('tracks/trending', { limit: '20' })).data).map((r) => this.track(r)).filter((t) => matches(t, filters));
    return [
      { id: 'trending', titleKey: 'home.trending', tracks: result, notices },
      { id: 'new-releases', titleKey: 'home.newReleases', tracks: [], notices },
      { id: 'classics', titleKey: 'home.classics', tracks: [], notices },
    ];
  }
}
