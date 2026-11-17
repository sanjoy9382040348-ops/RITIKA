import { readFileSync } from 'node:fs';
import type { MusicProvider, Permissions, ProviderId } from './contracts.ts';
import { AudiusProvider } from './AudiusProvider.ts';
import { JamendoProvider } from './JamendoProvider.ts';
import { MockProvider } from './MockProvider.ts';
import { YouTubeProvider } from './YouTubeProvider.ts';
import { object, ProviderError } from './core.ts';
import type { RightsResolver } from './core.ts';

export type ProviderRegistry = Map<ProviderId, MusicProvider>;
export function loadRights(file?: string): RightsResolver {
  if (!file) return () => ({});
  const document = object(JSON.parse(readFileSync(file, 'utf8')));
  const grants = new Map<string, { validUntil: number; permissions: Partial<Permissions> }>();
  for (const [id, value] of Object.entries(document)) {
    if (!/^(jamendo|audius):[A-Za-z0-9_-]+$/.test(id)) throw new Error('Invalid rights manifest ID');
    const row = object(value); const flags = object(row.permissions);
    const validUntil = typeof row.validUntil === 'string' ? Date.parse(row.validUntil) : NaN;
    if (!Number.isFinite(validUntil) || typeof row.evidence !== 'string' || !row.evidence.trim()) throw new Error('Rights grants require expiry and evidence');
    if (Object.keys(flags).some((key) => !['stream', 'background', 'offline', 'appAds'].includes(key) || typeof flags[key] !== 'boolean')) throw new Error('Invalid rights permissions');
    grants.set(id, { validUntil, permissions: flags as Partial<Permissions> });
  }
  return (id) => { const grant = grants.get(id); return grant && grant.validUntil > Date.now() ? grant.permissions : {}; };
}
export function createProviders(env: NodeJS.ProcessEnv = process.env): ProviderRegistry {
  const enabled = (env.MUSIC_PROVIDERS ?? env.MUSIC_PROVIDER ?? 'mock').split(',').map((s) => s.trim()).filter(Boolean);
  const rights = loadRights(env.RIGHTS_FILE);
  const providers: ProviderRegistry = new Map();
  for (const id of enabled) {
    switch (id) {
      case 'mock': providers.set(id, new MockProvider()); break;
      case 'jamendo': providers.set(id, new JamendoProvider({ clientId: env.JAMENDO_CLIENT_ID ?? '', rights })); break;
      case 'audius': providers.set(id, new AudiusProvider({ rights })); break;
      case 'youtube': providers.set(id, new YouTubeProvider({ apiKey: env.YOUTUBE_DATA_API_KEY ?? '', playlistIds: (env.YOUTUBE_PLAYLIST_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean) })); break;
      default: throw new Error('Unknown MUSIC_PROVIDERS entry');
    }
  }
  if (!providers.size) throw new Error('Enable at least one music provider');
  return providers;
}
export function getProvider(registry: ProviderRegistry, id: string): MusicProvider {
  const provider = registry.get(id as ProviderId);
  if (!provider) throw new ProviderError('NOT_FOUND', 'Provider is not enabled'); return provider;
}
