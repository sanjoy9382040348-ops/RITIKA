import type { Album, Artist, Attribution, BrowseSection, Filters, MusicProvider, PlaybackSource, Playlist, SearchEntity, SearchPage, Track } from './contracts.ts';
import { https, json, matches, nextCursor, object, optionalObject, optionalString, page, permissions, ProviderError, rawId, rejectEntityFilters, requirePlayback, rows, string, strings } from './core.ts';
import type { Http, RightsResolver } from './core.ts';

export class JamendoProvider implements MusicProvider {
  readonly id = 'jamendo' as const;
  private readonly clientId: string;
  private readonly http: Http;
  private readonly rights: RightsResolver;
  constructor(options: { clientId: string; http?: Http; rights?: RightsResolver }) {
    if (!options.clientId) throw new Error('JAMENDO_CLIENT_ID is required');
    this.clientId = options.clientId; this.http = options.http ?? fetch; this.rights = options.rights ?? (() => ({}));
  }
  private async request(method: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.jamendo.com/v3.0/${method}/`);
    url.search = new URLSearchParams({ client_id: this.clientId, format: 'json', ...params }).toString();
    const result = await json(url, this.http);
    if (object(result.headers).status !== 'success') throw new ProviderError('UPSTREAM_ERROR', 'Jamendo rejected the request');
    return rows(result.results);
  }
  private attribution(row: Record<string, unknown>, kind: string): Attribution {
    const id = string(row.id);
    return { provider: this.id, sourceUrl: `https://www.jamendo.com/${kind}/${encodeURIComponent(id)}`,
      text: `${optionalString(row.name) ?? 'Music'} — ${optionalString(row.artist_name) ?? 'Jamendo'} · Jamendo`,
      licenseName: 'See source licence; additional usage rights may be required',
      licenseUrl: https(typeof row.license_ccurl === 'string' ? row.license_ccurl.replace(/^http:/, 'https:') : undefined) };
  }
  private track(row: Record<string, unknown>): Track {
    const id = `jamendo:${string(row.id)}`;
    const info = optionalObject(row.musicinfo); const tags = optionalObject(info.tags);
    const language = info.lang === 'en' || info.lang === 'hi' || info.lang === 'bn' ? info.lang : undefined;
    return { kind: 'track', id, provider: this.id, title: string(row.name), artistName: string(row.artist_name),
      albumTitle: optionalString(row.album_name), artworkUrl: https(row.image),
      durationSeconds: typeof row.duration === 'number' ? row.duration : undefined,
      releaseDate: optionalString(row.releasedate), language, genres: strings(tags.genres), moods: strings(tags.vartags), isDemo: false,
      permissions: permissions(id, this.rights, !!https(row.audio), row.audiodownload_allowed === true && !!https(row.audiodownload)),
      attribution: this.attribution(row, 'track') };
  }
  async search(query: string, filters: Filters = {}): Promise<SearchPage> {
    rejectEntityFilters(filters);
    const { limit, offset } = page(filters); const kind = filters.kind ?? 'track';
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
    let method: string;
    if (kind === 'track') {
      method = 'tracks'; Object.assign(params, { search: query, type: 'single albumtrack', include: 'musicinfo', audioformat: 'mp31' });
      if (filters.language) params.lang = filters.language;
      if (filters.genre || filters.mood) params.tags = [filters.genre, filters.mood].filter(Boolean).join('+');
      if (filters.era === 'classic') params.datebetween = '1960-01-01_1999-12-31';
      if (filters.era === 'new') {
        if (!query.trim()) params.order = 'releasedate_desc';
        const now = new Date(); const start = new Date(now.getTime() - 365 * 86400000);
        params.datebetween = `${start.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}`;
      }
    } else { method = kind === 'artist' ? 'artists' : 'albums'; params.namesearch = query; }
    const result = await this.request(method, params);
    const items: SearchEntity[] = kind === 'track' ? result.map((r) => this.track(r)).filter((t) => matches(t, filters)) : result.map((r) => {
      const base = { id: `jamendo:${string(r.id)}`, provider: this.id, artworkUrl: https(r.image), attribution: this.attribution(r, kind) };
      return kind === 'artist' ? { ...base, kind: 'artist', name: string(r.name) } as Artist
        : { ...base, kind: 'album', title: string(r.name), artistName: string(r.artist_name) } as Album;
    });
    return { items, nextCursor: nextCursor(result.length, limit, offset), notices: ['Only provider metadata is used for language and original release date; coverage may be limited.'] };
  }
  private async row(id: string) {
    const raw = rawId(id, this.id);
    if (!/^\d+$/.test(raw)) throw new ProviderError('INVALID_INPUT', 'Invalid Jamendo ID');
    const result = await this.request('tracks', { id: raw, include: 'musicinfo', type: 'single albumtrack', audioformat: 'mp31' });
    const row = result[0];
    if (!row || String(row.id) !== raw) throw new ProviderError('NOT_FOUND', 'Track not found');
    return row;
  }
  async getTrack(id: string): Promise<Track> { return this.track(await this.row(id)); }
  async getStreamUrl(id: string): Promise<PlaybackSource> {
    const row = await this.row(id); const track = this.track(row); requirePlayback(track);
    const url = https(row.audio);
    if (!url) throw new ProviderError('PLAYBACK_DENIED', 'No secure stream available');
    return { kind: 'native', url, permissions: track.permissions, attribution: track.attribution };
  }
  async getPlaylists(): Promise<Playlist[]> {
    // Public provider playlists; guest-created Ritika playlists are a separate feature.
    const result = await this.request('playlists/tracks', { limit: '10', track_type: 'single albumtrack' });
    return result.map((r) => ({ id: `jamendo:${string(r.id)}`, provider: this.id, title: string(r.name),
      artworkUrl: https(r.image), trackIds: rows(r.tracks).map((t) => `jamendo:${string(t.id)}`), attribution: this.attribution(r, 'playlist') }));
  }
  async getBrowseSections(filters: Filters = {}): Promise<BrowseSection[]> {
    const base = { ...filters, kind: 'track' as const, cursor: undefined };
    const [trending, recent, classics] = await Promise.all([
      this.request('tracks', { order: 'popularity_week', limit: '20', type: 'single albumtrack', include: 'musicinfo', ...(filters.language ? { lang: filters.language } : {}) }),
      this.search('', { ...base, era: 'new' }), this.search('', { ...base, era: 'classic' }),
    ]);
    return [
      { id: 'trending', titleKey: 'home.trending', tracks: trending.map((r) => this.track(r)).filter((t) => matches(t, base)), notices: [] },
      { id: 'new-releases', titleKey: 'home.newReleases', tracks: recent.items.filter((t): t is Track => t.kind === 'track'), notices: recent.notices },
      { id: 'classics', titleKey: 'home.classics', tracks: classics.items.filter((t): t is Track => t.kind === 'track'), notices: classics.notices },
    ];
  }
}
