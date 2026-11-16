import { BrowseSection, ProviderId, SearchFilters, StreamDescriptor, Track } from '../types/music';
import { AudiusProvider } from './AudiusProvider';
import { JamendoProvider } from './JamendoProvider';
import { MockProvider } from './MockProvider';
import { MusicProvider } from './types';
import { YouTubeProvider } from './YouTubeProvider';

class ProviderRegistry {
  private providers = new Map<ProviderId, MusicProvider>();

  constructor(initial: MusicProvider[]) {
    initial.forEach((p) => this.providers.set(p.id, p));
  }

  get(id: ProviderId): MusicProvider | undefined {
    return this.providers.get(id);
  }

  async searchAll(query: string, filters?: SearchFilters): Promise<Track[]> {
    const results = await Promise.allSettled(
      Array.from(this.providers.values()).map((p) => p.search(query, filters))
    );
    return results.flatMap((r) => (r.status === 'fulfilled' ? r.value.tracks : []));
  }

  async getBrowseSections(language?: string): Promise<BrowseSection[]> {
    const results = await Promise.allSettled(
      Array.from(this.providers.values()).map((p) => p.getBrowseSections(language))
    );
    return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  }

  async getStreamUrl(track: Track): Promise<StreamDescriptor | null> {
    const provider = this.providers.get(track.providerId);
    return provider ? provider.getStreamUrl(track.id) : null;
  }
}

export const providerRegistry = new ProviderRegistry(
  __DEV__
    ? [new MockProvider(), new JamendoProvider(), new AudiusProvider(), new YouTubeProvider()]
    : [new JamendoProvider(), new AudiusProvider(), new YouTubeProvider()]
);
