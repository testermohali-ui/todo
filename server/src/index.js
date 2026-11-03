import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo_app';

const app = createApp();
let server;

async function start() {
  try {
    await connectDB(MONGO_URI);
  } catch (error) {
    console.error(`[db] could not connect to ${MONGO_URI}`);
    console.error(`[db] ${error.message}`);
    console.error('[db] Is MongoDB running? Start it with: npm run mongo');
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[api] port ${PORT} is already in use`);
      process.exit(1);
    }
    throw error;
  });
}

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[api] unhandled rejection:', reason);
});

start();
