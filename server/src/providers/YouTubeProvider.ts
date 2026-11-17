import type { Attribution, BrowseSection, Filters, MusicProvider, PlaybackSource, Playlist, SearchPage, Track } from './contracts.ts';
import { DENIED, https, json, matches, optionalObject, optionalString, page, ProviderError, rawId, rows, string } from './core.ts';
import type { Http } from './core.ts';

export class YouTubeProvider implements MusicProvider {
  readonly id = 'youtube' as const;
  private readonly apiKey: string;
  private readonly http: Http;
  private readonly playlistIds: string[];
  constructor(options: { apiKey: string; http?: Http; playlistIds?: string[] }) {
    if (!options.apiKey) throw new Error('YOUTUBE_DATA_API_KEY is required');
    this.apiKey = options.apiKey; this.http = options.http ?? fetch; this.playlistIds = options.playlistIds ?? [];
  }
  private request(path: string, params: Record<string, string>) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    url.search = new URLSearchParams({ key: this.apiKey, ...params }).toString();
    return json(url, this.http);
  }
  private attribution(id: string, title: string, channel: string): Attribution {
    return { provider: this.id, sourceUrl: `https://www.youtube.com/watch?v=${id}`, text: `${title} — ${channel} · YouTube`,
      licenseName: 'YouTube embedded playback only', licenseUrl: 'https://www.youtube.com/static?template=terms' };
  }
  private track(row: Record<string, unknown>): Track {
    const id = string(row.id); rawId(`youtube:${id}`, this.id);
    const snippet = optionalObject(row.snippet); const status = optionalObject(row.status);
    const title = string(snippet.title); const artistName = string(snippet.channelTitle);
    const lang = optionalString(snippet.defaultAudioLanguage)?.split('-')[0];
    const madeForKids = typeof status.madeForKids === 'boolean' ? status.madeForKids : undefined;
    const thumbnails = optionalObject(snippet.thumbnails);
    const duration = optionalString(optionalObject(row.contentDetails).duration);
    const parts = duration?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    return { kind: 'track', id: `youtube:${id}`, provider: this.id, title, artistName,
      artworkUrl: https(optionalObject(thumbnails.high).url) ?? https(optionalObject(thumbnails.default).url),
      durationSeconds: parts ? Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60 + Number(parts[3] ?? 0) : undefined,
      language: lang === 'en' || lang === 'hi' || lang === 'bn' ? lang : undefined,
      // publishedAt is the upload date, not the song's original release date.
      genres: [], moods: [], isDemo: false,
      permissions: { ...DENIED, stream: status.embeddable === true && status.privacyStatus === 'public' && madeForKids !== undefined },
      youtube: madeForKids === undefined ? undefined : { madeForKids },
      attribution: this.attribution(id, title, artistName) };
  }
  async search(query: string, filters: Filters = {}): Promise<SearchPage> {
    const limit = filters.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50 || (filters.cursor && !/^[A-Za-z0-9_=-]{1,256}$/.test(filters.cursor)))
      throw new ProviderError('INVALID_INPUT', 'Invalid YouTube pagination');
    if (filters.kind && filters.kind !== 'track') throw new ProviderError('UNSUPPORTED_FILTER', 'YouTube videos are not verified artists or albums');
    if (filters.era || filters.genre || filters.mood) return { items: [], notices: ['Original song era, genres and moods are unavailable from YouTube metadata.'] };
    const result = await this.request('search', { part: 'snippet', type: 'video', videoCategoryId: '10', videoEmbeddable: 'true',
      q: query, maxResults: String(limit), ...(filters.language ? { relevanceLanguage: filters.language } : {}), ...(filters.cursor ? { pageToken: filters.cursor } : {}) });
    const ids = rows(result.items).map((r) => string(optionalObject(r.id).videoId));
    const details = ids.length ? rows((await this.request('videos', { part: 'snippet,status,contentDetails', id: ids.join(',') })).items) : [];
    return { items: details.map((r) => this.track(r)).filter((t) => matches(t, filters)), nextCursor: optionalString(result.nextPageToken),
      notices: ['YouTube source branding and a visible, unmodified player are required. Language matching uses declared audio language only.'] };
  }
  async getTrack(id: string): Promise<Track> {
    const raw = rawId(id, this.id);
    const row = rows((await this.request('videos', { part: 'snippet,status,contentDetails', id: raw })).items)[0];
    if (!row || row.id !== raw) throw new ProviderError('NOT_FOUND', 'Video not found');
    return this.track(row);
  }
  async getStreamUrl(id: string): Promise<PlaybackSource> {
    const track = await this.getTrack(id);
    if (!track.permissions.stream || !track.youtube) throw new ProviderError('PLAYBACK_DENIED', 'Video cannot be embedded or required status is unavailable');
    const videoId = rawId(id, this.id);
    return { kind: 'youtube-embed', videoId, embedUrl: `https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=0`, autoplay: false,
      madeForKids: track.youtube.madeForKids, permissions: track.permissions, attribution: track.attribution };
  }
  async getPlaylists(): Promise<Playlist[]> {
    if (!this.playlistIds.length) return [];
    if (this.playlistIds.length > 10 || this.playlistIds.some((id) => !/^[A-Za-z0-9_-]{1,100}$/.test(id))) throw new ProviderError('INVALID_INPUT', 'Invalid curated YouTube playlists');
    const playlists = rows((await this.request('playlists', { part: 'snippet', id: this.playlistIds.join(',') })).items);
    return Promise.all(playlists.map(async (r) => {
      const id = string(r.id); const snippet = optionalObject(r.snippet);
      const entries: Record<string, unknown>[] = [];
      let cursor: string | undefined;
      do {
        const response = await this.request('playlistItems', { part: 'contentDetails', playlistId: id, maxResults: '50', ...(cursor ? { pageToken: cursor } : {}) });
        entries.push(...rows(response.items)); cursor = optionalString(response.nextPageToken);
        // Curated lists are bounded; reject rather than silently return a truncated playlist.
        if (cursor && entries.length >= 500) throw new ProviderError('UNSUPPORTED_FILTER', 'Curated playlist exceeds 500 tracks');
      } while (cursor);
      return { id: `youtube:${id}`, provider: this.id, title: string(snippet.title),
        trackIds: entries.map((entry) => `youtube:${string(optionalObject(entry.contentDetails).videoId)}`),
        attribution: { provider: this.id, sourceUrl: `https://www.youtube.com/playlist?list=${id}`, text: `${string(snippet.title)} · YouTube`, licenseName: 'YouTube embedded playback only' } };
    }));
  }
  async getBrowseSections(filters: Filters = {}): Promise<BrowseSection[]> {
    // Search is user-triggered; do not burn expensive search quota for speculative home sections.
    page({ limit: filters.limit });
    return ['trending', 'new-releases', 'classics'].map((id) => ({ id: id as BrowseSection['id'], titleKey: `home.${id === 'new-releases' ? 'newReleases' : id}`,
      tracks: [], notices: ['YouTube discovery is available through search and configured curated playlists.'] }));
  }
}
