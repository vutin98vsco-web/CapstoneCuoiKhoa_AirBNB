import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
const args = process.argv.slice(2), outputIndex = args.indexOf('--output');
let database;
try {
  if (outputIndex < 0 || !args[outputIndex+1]) throw new Error('Usage: npm run db:backup -- --output .backups/tnbnb-YYYYMMDD.sqlite');
  const source = resolve(process.env.TNB_BOOKINGS_DB_PATH || '.data/tnbnb-bookings.sqlite'), target = resolve(args[outputIndex+1]), publicRelative = relative(resolve('public'),target);
  if (source === target || !publicRelative.startsWith('..') && !isAbsolute(publicRelative)) throw new Error('Backup must differ from the source and stay outside public/.');
  if (!existsSync(source)) throw new Error('Source database does not exist.');
  if (existsSync(target)) throw new Error('Output already exists. Choose a new backup filename.');
  mkdirSync(dirname(target), { recursive: true }); const descriptor = openSync(target,'wx',0o600); closeSync(descriptor);
  database = new DatabaseSync(source,{ readOnly: true });
  const pages = await backup(database,target); const check = new DatabaseSync(target,{ readOnly: true });
  try { if (check.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Backup integrity check failed.'); } finally { check.close(); }
  console.log(JSON.stringify({ ok: true,pages,output: target }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { database?.close(); }
