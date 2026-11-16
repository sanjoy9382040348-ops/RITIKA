import { FastifyReply, FastifyRequest } from 'fastify';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
  });
}

export interface AuthedRequest extends FastifyRequest {
  uid?: string;
}

export async function verifyFirebaseToken(req: AuthedRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing Bearer token' });
  }

  try {
    const token = header.slice(7);
    const decoded = await getAuth().verifyIdToken(token);
    req.uid = decoded.uid;
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
