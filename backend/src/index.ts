import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = createPool(config);
  const app = createApp({ pool, config });

  const server = app.listen(config.port, config.host, () => {
    // eslint-disable-next-line no-console
    console.log(`Genesis backend listening on http://${config.host}:${config.port}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}; shutting down`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : 'Failed to start backend');
  process.exit(1);
});
