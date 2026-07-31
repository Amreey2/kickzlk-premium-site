import app from './app.js';
import { closeDatabase, testDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    await testDatabaseConnection();
    console.log('Database connection established.');
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    if (env.database.required) process.exit(1);
    console.warn('Starting because DB_REQUIRED=false; database-backed routes will fail until configured.');
  }

  const server = app.listen(env.port, () => console.log(`KICKZ API listening on http://localhost:${env.port}`));
  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing services.`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
