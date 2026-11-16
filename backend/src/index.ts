import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { providerRoutes } from './routes/providers';
import { syncRoutes } from './routes/sync';

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

app.get('/health', async () => ({ ok: true, service: 'ritika-api' }));
app.register(providerRoutes, { prefix: '/api/providers' });
app.register(syncRoutes, { prefix: '/api/sync' });

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
