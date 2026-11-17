import Fastify from 'fastify';
import { safeLoggerOptions } from './logging.ts';
import { offlineGrant } from './offlineGrant.ts';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import type { Filters } from './providers/contracts.ts';
import { ProviderError } from './providers/core.ts';
import { createMockAudio } from './providers/mockAudio.ts';
import { createProviders, getProvider } from './providers/registry.ts';
import type { ProviderRegistry } from './providers/registry.ts';

const filterProperties = {
  language: { type: 'string', enum: ['en', 'hi', 'bn'] },
  era: { type: 'string', enum: ['classic', 'new'] },
  genre: { type: 'string', minLength: 1, maxLength: 80 },
  mood: { type: 'string', minLength: 1, maxLength: 80 },
  kind: { type: 'string', enum: ['track', 'artist', 'album'] },
  limit: { type: 'integer', minimum: 1, maximum: 50 },
  cursor: { type: 'string', maxLength: 256 },
};
type ProviderParams = { provider: string };
type TrackParams = ProviderParams & { id: string };

export async function buildApp(
  registry: ProviderRegistry = createProviders(),
  logging = false,
  allowedOrigins: string[] = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
) {
  // Browser previews opt in to exact origins. Native clients do not require CORS.
  const origins = allowedOrigins.map((origin) => {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password)
      throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins without paths');
    return url.origin;
  });
  const app = Fastify({ logger: logging ? safeLoggerOptions : false,
    ajv: { customOptions: { removeAdditional: false } } });
  await app.register(cors, { origin: origins.length ? origins : false, methods: ['GET', 'HEAD'], credentials: false });
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ProviderError) {
      const status = { INVALID_INPUT: 400, NOT_FOUND: 404, UPSTREAM_ERROR: 502, RATE_LIMITED: 429, UNSUPPORTED_FILTER: 422, PLAYBACK_DENIED: 403 }[error.code];
      return reply.code(status).send({ error: { code: error.code, message: error.message } });
    }
    const candidate = error as { validation?: unknown; statusCode?: number };
    if (candidate.validation) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'Invalid request parameters' } });
    if (candidate.statusCode === 429) return reply.code(429).send({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Request could not be completed' } });
  });
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store'); return payload;
  });
  app.get('/health', { config: { rateLimit: false } }, async () => ({ status: 'ok', service: 'ritika-api' }));
  app.get('/v1/providers', async () => ({ providers: [...registry.keys()] }));
  app.get<{ Params: ProviderParams; Querystring: Filters & { q?: string } }>('/v1/providers/:provider/search', {
    schema: { querystring: { type: 'object', additionalProperties: false, properties: { ...filterProperties, q: { type: 'string', maxLength: 200 } } } },
  }, async (request) => {
    const { q = '', ...filters } = request.query;
    return getProvider(registry, request.params.provider).search(q.trim(), filters);
  });
  app.get<{ Params: ProviderParams; Querystring: Filters }>('/v1/providers/:provider/browse', {
    schema: { querystring: { type: 'object', additionalProperties: false, properties: filterProperties } },
  }, async (request) => getProvider(registry, request.params.provider).getBrowseSections(request.query));
  app.get<{ Params: ProviderParams }>('/v1/providers/:provider/playlists', async (request) => getProvider(registry, request.params.provider).getPlaylists());
  app.get<{ Params: TrackParams }>('/v1/providers/:provider/tracks/:id', async (request) => getProvider(registry, request.params.provider).getTrack(request.params.id));
  app.get<{ Params: TrackParams }>('/v1/providers/:provider/tracks/:id/playback', async (request) => getProvider(registry, request.params.provider).getStreamUrl(request.params.id));
  const audio = createMockAudio();
  app.get<{ Params: TrackParams }>('/v1/providers/:provider/tracks/:id/offline-grant', async (request) =>
    offlineGrant(getProvider(registry, request.params.provider), request.params.id));
  app.get('/v1/mock-audio.wav', async (request, reply) => {
    getProvider(registry, 'mock');
    reply.type('audio/wav').header('Accept-Ranges', 'bytes');
    const range = request.headers.range;
    if (!range) return reply.header('Content-Length', audio.length).send(audio);
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return reply.code(416).header('Content-Range', `bytes */${audio.length}`).send();
    const start = match[1] ? Number(match[1]) : Math.max(0, audio.length - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), audio.length - 1) : audio.length - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= audio.length)
      return reply.code(416).header('Content-Range', `bytes */${audio.length}`).send();
    return reply.code(206).header('Content-Range', `bytes ${start}-${end}/${audio.length}`).header('Content-Length', end - start + 1).send(audio.subarray(start, end + 1));
  });
  return app;
}
