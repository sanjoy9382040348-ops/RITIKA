import type { Filters, Permissions, ProviderId, Track } from './contracts.ts';

export type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'UNSUPPORTED_FILTER' | 'PLAYBACK_DENIED';
export class ProviderError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, message: string) { super(message); this.code = code; }
}
export type Http = (url: string, init?: RequestInit) => Promise<Response>;
export const DENIED: Permissions = { stream: false, background: false, offline: false, appAds: false };
export type RightsResolver = (id: string) => Partial<Permissions>;
export function permissions(id: string, rights: RightsResolver, available: boolean, downloadAllowed = false): Permissions {
  const grant = rights(id);
  const stream = available && grant.stream === true;
  return { stream, background: stream && grant.background === true,
    offline: stream && downloadAllowed && grant.offline === true, appAds: stream && grant.appAds === true };
}
export function rawId(id: string, provider: ProviderId): string {
  const prefix = `${provider}:`;
  const raw = id.startsWith(prefix) ? id.slice(prefix.length) : '';
  const pattern = provider === 'youtube' ? /^[A-Za-z0-9_-]{11}$/ : /^[A-Za-z0-9_-]{1,100}$/;
  if (!pattern.test(raw)) throw new ProviderError('INVALID_INPUT', 'Invalid provider track ID');
  return raw;
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProviderError('UPSTREAM_ERROR', 'Invalid upstream object');
  return value as Record<string, unknown>;
}
export function optionalObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? object(value) : {};
}
export function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new ProviderError('UPSTREAM_ERROR', 'Invalid upstream list');
  return value.map(object);
}
export function string(value: unknown): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).length === 0)
    throw new ProviderError('UPSTREAM_ERROR', 'Missing upstream field');
  return String(value);
}
export function optionalString(value: unknown): string | undefined { return typeof value === 'string' && value ? value : undefined; }
export function https(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
export function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []; }
export async function json(url: URL, http: Http = fetch): Promise<Record<string, unknown>> {
  try {
    const response = await http(url.href, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new ProviderError(response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR', 'Music service request failed');
    return object(await response.json());
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    // Never return upstream URLs/errors: query parameters may contain credentials.
    throw new ProviderError('UPSTREAM_ERROR', 'Music service is unavailable');
  }
}
export function page(filters: Filters = {}): { limit: number; offset: number } {
  const limit = filters.limit ?? 20;
  const cursor = filters.cursor ?? '0';
  if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !/^\d{1,6}$/.test(cursor))
    throw new ProviderError('INVALID_INPUT', 'Invalid pagination');
  return { limit, offset: Number(cursor) };
}
export function nextCursor(length: number, limit: number, offset: number): string | undefined {
  return length === limit && offset + limit <= 999999 ? String(offset + limit) : undefined;
}
export function rejectEntityFilters(filters: Filters): void {
  if ((filters.kind ?? 'track') !== 'track' && (filters.language || filters.era || filters.genre || filters.mood))
    throw new ProviderError('UNSUPPORTED_FILTER', 'Track filters apply only to songs');
}
export function matches(track: Track, filters: Filters, now = new Date()): boolean {
  if (filters.language && track.language !== filters.language) return false;
  if (filters.genre && !track.genres.some((v) => v.toLowerCase() === filters.genre!.toLowerCase())) return false;
  if (filters.mood && !track.moods.some((v) => v.toLowerCase() === filters.mood!.toLowerCase())) return false;
  if (filters.era) {
    const date = track.releaseDate ? new Date(track.releaseDate) : undefined;
    if (!date || Number.isNaN(date.getTime())) return false;
    const year = date.getUTCFullYear();
    if (filters.era === 'classic' && (year < 1960 || year > 1999)) return false;
    if (filters.era === 'new' && (date > now || now.getTime() - date.getTime() > 365 * 86400000)) return false;
  }
  return true;
}
export function requirePlayback(track: Track): void {
  if (!track.permissions.stream) throw new ProviderError('PLAYBACK_DENIED', 'Playback is unavailable or rights have not been approved');
}
