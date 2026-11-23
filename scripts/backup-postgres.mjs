import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { encryptBackup } from '../lib/backup-crypto.js';
const args = process.argv.slice(2), output = args[args.indexOf('--output') + 1];
const docker = args.includes('--docker'), verify = args.includes('--verify-restore');
let container;
const run = (command, argv, options = {}) => { const result = spawnSync(command, argv, { windowsHide: true, timeout: 180000, maxBuffer: 64 * 1024 * 1024, ...options }); if (result.error || result.status !== 0) throw new Error('Backup/restore command failed; check tool versions, TLS and credentials.'); return result.stdout; };
try {
  if (!args.includes('--output') || !output || !process.env.BACKUP_PUBLIC_KEY || !process.env.BACKUP_DATABASE_URL) throw new Error('Set BACKUP_DATABASE_URL/BACKUP_PUBLIC_KEY and --output.');
  const target = resolve(output), inPublic = relative(resolve('public'), target);
  if (!inPublic.startsWith('..') && !isAbsolute(inPublic)) throw new Error('Backup must stay outside public/.');
  const url = new URL(process.env.BACKUP_DATABASE_URL);
  if (!['postgres:','postgresql:'].includes(url.protocol)) throw new Error('Invalid database connection');
  const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGSSLMODE: 'verify-full', PGSSLROOTCERT: 'system', PGCONNECT_TIMEOUT: '20' };
  const dumpArgs = ['--format=custom','--no-owner','--no-acl','--schema=public'];
  const data = docker ? run('docker', ['run','--rm', ...['PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE','PGSSLMODE','PGSSLROOTCERT','PGCONNECT_TIMEOUT'].flatMap(name => ['--env',name]),'postgres:18-bookworm','pg_dump',...dumpArgs], { env }) : run(process.env.PG_DUMP || 'pg_dump', dumpArgs, { env });
  if (data.length < 5 || data.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid PostgreSQL dump');
  if (verify) {
    container = `tnbnb-restore-${process.pid}`;
    run('docker', ['run','-d','--rm','--name',container,'--env',`POSTGRES_PASSWORD=${randomBytes(24).toString('hex')}`,'postgres:18-bookworm']);
    let ready = false;
    for (let i = 0; i < 30; i++) { if (spawnSync('docker',['exec',container,'pg_isready','-U','postgres'],{ windowsHide: true,stdio:'ignore' }).status === 0) { ready = true; break; } await setTimeout(1000); }
    if (!ready) throw new Error('Restore verification database did not start');
    run('docker',['exec','-i',container,'pg_restore','--username=postgres','--dbname=postgres','--no-owner','--no-acl','--exit-on-error'],{ input: data });
    const tables = run('docker',['exec',container,'psql','-U','postgres','-Atc',"SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('accounts','bookings','reviews')"]).toString().trim();
    if (tables !== '3') throw new Error('Restored backup is missing application tables');
  }
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, encryptBackup(data, process.env.BACKUP_PUBLIC_KEY), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ backup: 'encrypted', format: 'PostgreSQL custom', restoreVerified: verify, bytes: data.length }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (container) spawnSync('docker',['rm','-f',container],{ windowsHide: true,stdio:'ignore' }); }
