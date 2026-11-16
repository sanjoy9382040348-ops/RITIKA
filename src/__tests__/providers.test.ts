import { MockProvider } from '@providers/MockProvider';

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('filters tracks by language', async () => {
    const bn = await provider.search('', { language: 'bn' });
    expect(bn.tracks.length).toBeGreaterThan(0);
    expect(bn.tracks.every((t) => t.language === 'bn')).toBe(true);
  });

  it('filters classic (60s-90s) vs new releases', async () => {
    const classics = await provider.search('', { era: 'classic' });
    expect(classics.tracks.every((t) => t.isClassic)).toBe(true);

    const fresh = await provider.search('', { era: 'new' });
    expect(fresh.tracks.every((t) => !t.isClassic)).toBe(true);
  });

  it('returns stream descriptor with attribution metadata', async () => {
    const track = await provider.getTrack('mock:en-1');
    expect(track?.license.requiresAttribution).toBe(true);
    const stream = await provider.getStreamUrl('mock:en-1');
    expect(stream?.type).toBe('audio');
    expect(stream?.url).toBeTruthy();
  });
});
