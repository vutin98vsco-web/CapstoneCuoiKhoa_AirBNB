import { spawn } from 'node:child_process';
import { mkdtemp, unlink, rmdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import pg from 'pg';
const postgres = process.argv.includes('--postgres');
if (postgres && !process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local');
const databaseUrl = postgres ? process.env.DATABASE_URL || process.env.POSTGRES_URL : '';
if (postgres && !databaseUrl) throw new Error('Set DATABASE_URL before PostgreSQL HTTP checks.');
const testSchema = postgres ? `tnbnb_test_${randomBytes(8).toString('hex')}` : '';
const directory = await mkdtemp(join(tmpdir(),'tnbnb-http-')), filename = join(directory,'test.sqlite');
const port = process.env.TNB_TEST_PORT || '3002', base = `http://127.0.0.1:${port}`;
const env = { ...process.env,NODE_ENV: 'production',DATABASE_URL: databaseUrl,POSTGRES_URL: '',CYBERSOFT_TOKEN: '',TNB_DATABASE_SCHEMA: testSchema,TNB_BOOKINGS_DB_PATH: filename,TEST_BASE_URL: base,NEXT_TELEMETRY_DISABLED: '1' };
let output = '', server;
const run = (file,args = []) => new Promise((resolveRun,reject) => {
  const child = spawn(process.execPath,[file,...args],{ env,stdio: 'inherit',windowsHide: true });
  child.on('error',reject); child.on('exit',code => code === 0 ? resolveRun() : reject(new Error(`${file} failed (${code})`)));
});
try {
  // Never reuse or stop a server owned by the user.
  const available = await import('node:net'); await new Promise((accept,reject) => { const socket = available.createServer(); socket.on('error',reject); socket.listen(Number(port),'127.0.0.1',() => socket.close(accept)); });
  await cp('public','.next/standalone/public',{ recursive: true }); await cp('.next/static','.next/standalone/.next/static',{ recursive: true });
  server = spawn(process.execPath,[resolve('.next/standalone/server.js')],{ env: { ...env,HOSTNAME: '127.0.0.1',PORT: port },stdio: ['ignore','pipe','pipe'],windowsHide: true });
  server.stdout.on('data',chunk => { output = (output+chunk).slice(-10000); }); server.stderr.on('data',chunk => { output = (output+chunk).slice(-10000); });
  const deadline = Date.now()+40000; let ready = false;
  while (Date.now() < deadline && server.exitCode === null) { try { const response = await fetch(`${base}/api/health`,{ signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch {} await setTimeout(150); }
  if (!ready) throw new Error(`Test server did not become ready.\n${output}`);
  const selected = process.argv.slice(2).filter(value => value !== '--postgres'); const wants = name => !selected.length || selected.includes(name);
  if (wants('catalog')) await run('scripts/verify-http.mjs',[base]); if (wants('bookings')) await run('scripts/verify-bookings-http.mjs',[base]); if (wants('accounts')) await run('scripts/verify-accounts-http.mjs'); if (wants('workspace')) await run('scripts/verify-workspace-http.mjs');
  console.log(`${selected.length ? 'Selected' : 'All'} HTTP workflows passed using an isolated test database.`);
} catch (error) { console.error(error.message); if (output) console.error(output); process.exitCode = 1; }
finally {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await Promise.race([new Promise(resolveExit => server.once('exit',resolveExit)),setTimeout(5000,undefined,{ ref: false })]); }
  for (const suffix of ['', '-wal', '-shm']) await unlink(filename+suffix).catch(() => {});
  if (postgres) {
    const connection = new URL(databaseUrl); connection.searchParams.set('sslmode','verify-full');
    const pool = new pg.Pool({ connectionString: connection.toString(),max: 1 });
    try { await pool.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`); }
    finally { await pool.end(); }
  }
  await rmdir(directory).catch(() => {});
}
