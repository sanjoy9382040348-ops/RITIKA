import { readFileSync } from 'node:fs';
import type { MusicProvider } from './providers/contracts.ts';
import { ProviderError } from './providers/core.ts';
/** offlineUntil is a separately authorized retention lease, not an inferred download right. */
export async function offlineGrant(provider: MusicProvider, id: string, file = process.env.RIGHTS_FILE, now = Date.now()) {
  if (provider.id === 'youtube') throw new ProviderError('PLAYBACK_DENIED', 'Offline playback is unavailable');
  const track = await provider.getTrack(id); const source = await provider.getStreamUrl(id);
  if (source.kind !== 'native' || !track.permissions.stream || !track.permissions.offline || !source.permissions.stream || !source.permissions.offline)
    throw new ProviderError('PLAYBACK_DENIED', 'Offline playback is unavailable');
  let expiresAt = now + 30 * 86400_000;
  if (provider.id !== 'mock') {
    let grant;
    try { grant = JSON.parse(readFileSync(file ?? '', 'utf8'))[id]; } catch { /* Fail closed. */ }
    const end = Math.min(Date.parse(grant?.offlineUntil), Date.parse(grant?.validUntil), now + 7 * 86400_000);
    if (!Number.isFinite(end) || end <= now || typeof grant?.evidence !== 'string' || !grant.evidence.trim()
      || grant.permissions?.stream !== true || grant.permissions?.offline !== true) throw new ProviderError('PLAYBACK_DENIED', 'No offline retention lease');
    track.permissions.background = track.permissions.background && grant.permissions.background === true;
    source.permissions.background = source.permissions.background && grant.permissions.background === true;
    expiresAt = end;
  }
  return { track, source, issuedAt: now, expiresAt };
}
