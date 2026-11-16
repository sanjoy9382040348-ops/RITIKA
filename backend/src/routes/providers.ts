import { FastifyPluginAsync } from 'fastify';

let cachedAudiusHost: { url: string; expiresAt: number } | null = null;

async function getAudiusHost(): Promise<string> {
  if (cachedAudiusHost && Date.now() < cachedAudiusHost.expiresAt) {
    return cachedAudiusHost.url;
  }
  const res = await fetch('https://api.audius.co');
  const json = (await res.json()) as { data: string[] };
  const host = json.data?.[0] ?? 'https://discoveryprovider.audius.co';
  cachedAudiusHost = { url: host, expiresAt: Date.now() + 1000 * 60 * 30 };
  return host;
}

export const providerRoutes: FastifyPluginAsync = async (app) => {
  const jamendoKey = process.env.JAMENDO_CLIENT_ID ?? '';
  const youtubeKey = process.env.YOUTUBE_API_KEY ?? '';
  const audiusApp = process.env.AUDIUS_APP_NAME ?? 'Ritika';

  app.get('/jamendo/search', async (req) => {
    const { q = '', lang, genre, limit = '20', offset = '0' } = req.query as Record<string, string>;
    const params = new URLSearchParams({
      client_id: jamendoKey,
      format: 'json',
      limit,
      offset,
      include: 'musicinfo',
      ...(q ? { search: q } : {}),
      ...(lang ? { lang } : {}),
      ...(genre ? { tags: genre } : {}),
    });
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    return res.json();
  });

  app.get('/jamendo/trending', async () => {
    const params = new URLSearchParams({
      client_id: jamendoKey,
      format: 'json',
      order: 'popularity_week',
      limit: '15',
      include: 'musicinfo',
    });
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    return res.json();
  });

  app.get('/jamendo/tracks/:id', async (req) => {
    const { id } = req.params as { id: string };
    const params = new URLSearchParams({ client_id: jamendoKey, format: 'json', id, include: 'musicinfo' });
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    return res.json();
  });

  app.get('/jamendo/playlists', async () => {
    const params = new URLSearchParams({ client_id: jamendoKey, format: 'json', limit: '10' });
    const res = await fetch(`https://api.jamendo.com/v3.0/playlists/?${params}`);
    return res.json();
  });

  app.get('/audius/search', async (req) => {
    const { q = '', genre, limit = '20' } = req.query as Record<string, string>;
    const host = await getAudiusHost();
    const params = new URLSearchParams({ query: q, app_name: audiusApp, limit, ...(genre ? { genre } : {}) });
    const res = await fetch(`${host}/v1/tracks/search?${params}`);
    return res.json();
  });

  app.get('/audius/trending', async () => {
    const host = await getAudiusHost();
    const res = await fetch(`${host}/v1/tracks/trending?app_name=${audiusApp}&limit=15`);
    return res.json();
  });

  app.get('/audius/tracks/:id', async (req) => {
    const { id } = req.params as { id: string };
    const host = await getAudiusHost();
    const res = await fetch(`${host}/v1/tracks/${id}?app_name=${audiusApp}`);
    return res.json();
  });

  app.get('/audius/tracks/:id/stream', async (req) => {
    const { id } = req.params as { id: string };
    const host = await getAudiusHost();
    return { streamUrl: `${host}/v1/tracks/${id}/stream?app_name=${audiusApp}` };
  });

  app.get('/audius/playlists/trending', async () => {
    const host = await getAudiusHost();
    const res = await fetch(`${host}/v1/playlists/trending?app_name=${audiusApp}&limit=10`);
    return res.json();
  });

  app.get('/youtube/search', async (req) => {
    const { q = '', lang, era, limit = '15' } = req.query as Record<string, string>;
    const langHint = lang === 'hi' ? 'Hindi' : lang === 'bn' ? 'Bengali' : '';
    const eraHint = era === 'classic' ? 'old classic 70s 80s 90s' : '';
    const fullQuery = `${q} ${langHint} ${eraHint} official audio`.trim();

    const params = new URLSearchParams({
      key: youtubeKey,
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      videoEmbeddable: 'true',
      maxResults: limit,
      q: fullQuery,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = (await res.json()) as { items?: any[] };

    return {
      items: (data.items ?? []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
        language: lang || 'en',
      })),
    };
  });
};
