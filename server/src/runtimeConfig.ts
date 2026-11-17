export function runtimeConfig(env: NodeJS.ProcessEnv = process.env) {
  const rawPort = env.PORT ?? '3000';
  if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) throw new Error('PORT must be an integer from 1 to 65535');
  const host = env.HOST ?? '0.0.0.0';
  if (!host || host.trim() !== host || /[\s/?#]/.test(host)) throw new Error('HOST must be a listen address');
  if (env.NODE_ENV === 'production') {
    if (!env.MUSIC_PROVIDERS?.trim()) throw new Error('Set MUSIC_PROVIDERS explicitly for production');
    const providers = env.MUSIC_PROVIDERS.split(',').map(value => value.trim());
    if (providers.some(id => !['mock', 'jamendo', 'audius', 'youtube'].includes(id))) throw new Error('Invalid MUSIC_PROVIDERS entry');
    if (providers.includes('jamendo') && !env.JAMENDO_CLIENT_ID?.trim()) throw new Error('JAMENDO_CLIENT_ID is required');
    if (providers.includes('youtube') && !env.YOUTUBE_DATA_API_KEY?.trim()) throw new Error('YOUTUBE_DATA_API_KEY is required');
  }
  return { host, port: Number(rawPort) };
}
