import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { decryptBackup } from '../lib/backup-crypto.js';
const args = process.argv.slice(2), get = name => args[args.indexOf(name) + 1];
try {
  if (!args.includes('--input') || !args.includes('--key') || !args.includes('--output')) throw new Error('Use --input encrypted.tnbackup --key private.pem --output restored.dump');
  const output = resolve(get('--output')), inPublic = relative(resolve('public'),output);
  if (!inPublic.startsWith('..') && !isAbsolute(inPublic)) throw new Error('Decrypted backup must stay outside public/.');
  const data = decryptBackup(await readFile(get('--input')), await readFile(get('--key')));
  await writeFile(output, data, { flag: 'wx', mode: 0o600 }); console.log('Backup decrypted. Restore first into an isolated database with pg_restore.');
} catch { console.error('Cannot decrypt backup. Check paths, key and authentication; no existing files were overwritten.'); process.exitCode = 1; }
