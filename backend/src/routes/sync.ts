import { FastifyPluginAsync } from 'fastify';
import { AuthedRequest, verifyFirebaseToken } from '../middleware/auth';

const userLibraries = new Map<string, { likedTracks: any[]; playlists: any[]; updatedAt: number }>();

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', verifyFirebaseToken);

  app.get('/', async (req: AuthedRequest) => {
    return userLibraries.get(req.uid!) ?? { likedTracks: [], playlists: [], updatedAt: 0 };
  });

  app.post('/', async (req: AuthedRequest) => {
    const body = req.body as { likedTracks: any[]; playlists: any[] };
    const payload = {
      likedTracks: body.likedTracks ?? [],
      playlists: body.playlists ?? [],
      updatedAt: Date.now(),
    };
    userLibraries.set(req.uid!, payload);
    return { ok: true, updatedAt: payload.updatedAt };
  });
};
