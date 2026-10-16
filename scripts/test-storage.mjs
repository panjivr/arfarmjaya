import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { spawn } from 'node:child_process';
const db = await PGlite.create();
const port = 55439;
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 10 });
await server.start();
const env = { ...process.env, DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?connection_limit=1&pool_timeout=15&pgbouncer=true&statement_cache_size=0`, AUTH_SECRET: 'storage-integration-test-secret-at-least-32-chars', NODE_ENV: 'test', WORKSPACE_RECORDS_ENABLED: 'true' };
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit' });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Test command failed (${code})`)));
  });
}
try {
  await run(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate']);
  if (process.argv.includes('--http')) await run(process.execPath, ['--import', 'tsx', 'tests/storage-http.integration.ts']);
  else await run(process.execPath, ['--import', 'tsx', '--test', 'tests/workspace-server.integration.test.ts']);
} finally { await server.stop(); await db.close(); }
