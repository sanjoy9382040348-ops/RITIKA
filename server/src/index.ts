import { buildApp } from './app.ts';
import { runtimeConfig } from './runtimeConfig.ts';

try {
  const listen = runtimeConfig();
  const app = await buildApp(undefined, true);
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    try { await app.close(); } catch { process.exitCode = 1; }
    finally { clearTimeout(deadline); }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  try { await app.listen(listen); }
  catch { await app.close(); throw new Error('Listen failed'); }
} catch {
  // Do not echo secret configuration or upstream error URLs into startup logs.
  console.error('Ritika API startup failed. Check port, host, providers, credentials and rights manifest configuration.');
  process.exitCode = 1;
}
