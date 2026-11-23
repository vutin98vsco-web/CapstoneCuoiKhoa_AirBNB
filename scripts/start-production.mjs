import { cp, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const server = resolve('.next/standalone/server.js');
try { await access(server); } catch { console.error('Run npm run build before npm start.'); process.exit(1); }
await cp('public','.next/standalone/public',{ recursive: true }); await cp('.next/static','.next/standalone/.next/static',{ recursive: true });
const child = spawn(process.execPath,[server],{ env: { ...process.env,NODE_ENV: 'production',HOSTNAME: process.env.TNB_HOST || '127.0.0.1',TNB_BOOKINGS_DB_PATH: resolve(process.env.TNB_BOOKINGS_DB_PATH || '.data/tnbnb-bookings.sqlite') },stdio: 'inherit',windowsHide: true });
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,() => { if (child.exitCode === null) child.kill(signal); });
child.on('error',error => { console.error(error.message); process.exitCode = 1; });
child.on('exit',code => { process.exitCode = code || 0; });
