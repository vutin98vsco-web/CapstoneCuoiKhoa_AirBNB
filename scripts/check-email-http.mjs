import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import pg from 'pg';
import { referenceRooms } from '../lib/reference-catalog.js';
import { findBookingOffer } from '../lib/bookings/offers.server.js';
import { todayInVietnam, nextDay } from '../lib/trip.js';
const postgres = process.argv.includes('--postgres');
if (postgres && !process.env.DATABASE_URL) process.loadEnvFile('.env.local');
const database = postgres ? process.env.DATABASE_URL : '',
  schema = postgres ? `tnbnb_test_${randomBytes(8).toString('hex')}` : '';
const directory = await mkdtemp(join(tmpdir(), 'tnbnb-mail-test-')),
  port = Number(process.env.TNB_TEST_PORT || 3005),
  base = `http://127.0.0.1:${port}`,
  key = `synthetic-resend-${randomUUID()}`,
  cron = randomUUID(),
  mails = [];
let server,
  logs = '';
const provider = createServer(async (req, res) => {
  let text = '';
  for await (const data of req) text += data;
  if (req.headers.authorization !== `Bearer ${key}`) {
    res.writeHead(403);
    res.end();
    return;
  }
  mails.push(JSON.parse(text));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ id: randomUUID() }));
});
let cookie = '';
const jar = new Map();
async function api(path, { method = 'GET', body, origin = base, form, redirect = 'follow' } = {}) {
  const headers = { Cookie: cookie };
  if (method !== 'GET') headers.Origin = origin;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(base + path, {
    method,
    headers,
    redirect,
    body: body ? JSON.stringify(body) : form,
    signal: AbortSignal.timeout(30000),
  });
  for (const value of r.headers.getSetCookie()) {
    const pair = value.split(';')[0],
      at = pair.indexOf('=');
    jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
  cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    status: r.status,
    headers: r.headers,
    data: r.headers.get('content-type')?.includes('application/json')
      ? await r.json()
      : await r.text(),
  };
}
async function waitMail(count) {
  for (let i = 0; i < 100 && mails.length < count; i++) await setTimeout(100);
  assert.equal(mails.length, count);
  return mails[count - 1];
}
const token = (mail) => new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
try {
  const socket = createServer();
  await new Promise((yes, no) => {
    socket.once('error', no);
    socket.listen(port, '127.0.0.1', () => socket.close(yes));
  });
  await new Promise((yes) => provider.listen(0, '127.0.0.1', yes));
  await cp('public', '.next/standalone/public', { recursive: true });
  await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: database || '',
    POSTGRES_URL: '',
    TNB_DATABASE_SCHEMA: schema,
    TNB_BOOKINGS_DB_PATH: join(directory, 'test.sqlite'),
    CYBERSOFT_TOKEN: '',
    SITE_URL: base,
    RESEND_API_KEY: key,
    EMAIL_FROM: 'TNbnb <synthetic@example.test>',
    CRON_SECRET: cron,
    TNB_EMAIL_FIXTURE_URL: `http://127.0.0.1:${provider.address().port}`,
    HOSTNAME: '127.0.0.1',
    PORT: String(port),
  };
  server = spawn(
    process.execPath,
    [
      '--import',
      pathToFileURL(resolve('tests/fixtures/email-fetch.mjs')).href,
      resolve('.next/standalone/server.js'),
    ],
    { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (d) => {
    logs = (logs + d).slice(-8000);
  });
  server.stderr.on('data', (d) => {
    logs = (logs + d).slice(-8000);
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(100);
  }
  assert.ok(ready, 'Email test server did not start');
  const email = `mail-${randomUUID()}@example.test`,
    password = 'Synthetic-email-password-123';
  assert.equal(
    (
      await api('/api/auth/register', {
        method: 'POST',
        body: { email, name: 'Email HTTP Test', password },
      })
    ).status,
    200,
  );
  assert.deepEqual((await api('/api/account/email')).data, { configured: true, verified: false });
  assert.equal(
    (await api('/api/account/email', { method: 'POST', origin: 'https://foreign.example' })).status,
    403,
  );
  assert.equal((await api('/api/account/email', { method: 'POST' })).status, 200);
  const verification = token(await waitMail(1));
  assert.equal((await api('/xac-minh-email?token=' + verification)).status, 200);
  assert.equal((await api('/api/account/email')).data.verified, false);
  const verified = await api('/api/auth/email-verification', {
    method: 'POST',
    form: new URLSearchParams({ token: verification }),
    redirect: 'manual',
  });
  assert.equal(verified.status, 303);
  assert.ok(verified.headers.get('location').endsWith('status=ok'));
  assert.equal((await api('/api/account/email')).data.verified, true);
  assert.ok(
    (
      await api('/api/auth/email-verification', {
        method: 'POST',
        form: new URLSearchParams({ token: verification }),
        redirect: 'manual',
      })
    ).headers
      .get('location')
      .endsWith('status=invalid'),
  );
  const property = referenceRooms.find((p) => p.roomTypes.some((r) => r.price)),
    room = property.roomTypes.find((r) => r.price),
    offer = findBookingOffer(property.id, room.id),
    checkin = nextDay(todayInVietnam()),
    checkout = nextDay(checkin),
    bookingKey = randomUUID();
  await api('/api/bookings/session');
  const body = {
    propertyId: property.id,
    roomTypeId: room.id,
    checkin,
    checkout,
    rooms: 1,
    guests: 1,
    fullName: 'Email HTTP Test',
    email,
    phone: '0901234567',
    message: '',
    accepted: true,
    quoteVersion: offer.quoteVersion,
  };
  const book = async () => {
    const r = await fetch(base + '/api/bookings', {
      method: 'POST',
      headers: {
        Origin: base,
        Cookie: cookie,
        'Content-Type': 'application/json',
        'Idempotency-Key': bookingKey,
      },
      body: JSON.stringify(body),
    });
    return r.status;
  };
  assert.equal(await book(), 201);
  await waitMail(2);
  assert.equal(await book(), 200);
  await setTimeout(250);
  assert.equal(mails.length, 2);
  assert.equal(
    (
      await api('/api/auth/email-reset', {
        method: 'POST',
        body: { email: 'unknown@example.test' },
      })
    ).status,
    200,
  );
  assert.equal(mails.length, 2);
  assert.equal(
    (await api('/api/auth/email-reset', { method: 'POST', body: { email } })).status,
    200,
  );
  const reset = token(await waitMail(3));
  const changed = await api('/api/auth/email-reset', {
    method: 'POST',
    body: { token: reset, password: 'New-synthetic-password-123' },
  });
  assert.equal(changed.status, 200);
  assert.ok(changed.data.recoveryCode);
  assert.equal((await api('/api/auth/session')).data.user, null);
  assert.equal(
    (
      await api('/api/auth/email-reset', {
        method: 'POST',
        body: { token: reset, password: 'Another-password-123' },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api('/api/auth/login', { method: 'POST', body: { email, password } })).status,
    401,
  );
  assert.equal(
    (
      await api('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'New-synthetic-password-123' },
      })
    ).status,
    200,
  );
  assert.equal((await api('/api/cron/email')).status, 401);
  assert.equal(
    (await fetch(base + '/api/cron/email', { headers: { Authorization: `Bearer ${cron}` } }))
      .status,
    200,
  );
  console.log(
    JSON.stringify({
      database: postgres ? 'PostgreSQL test schema' : 'SQLite test database',
      emailVerification: 'single-use passed',
      passwordReset: 'single-use and session revocation passed',
      bookingEmail: 'idempotent after verified email passed',
      csrf: 'passed',
      cronAuth: 'passed',
      realEmailsSent: 0,
    }),
  );
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise((yes) => server.once('exit', yes)), setTimeout(5000)]);
  }
  provider.closeAllConnections();
  await new Promise((yes) => provider.close(yes));
  if (postgres && /^tnbnb_test_[a-f0-9]+$/.test(schema)) {
    const url = new URL(database);
    url.searchParams.set('sslmode', 'verify-full');
    const pool = new pg.Pool({ connectionString: url.toString() });
    try {
      await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await pool.end();
    }
  }
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('tnbnb-mail-test-')
  )
    throw Error('Invalid cleanup directory');
  await rm(directory, { recursive: true, force: true });
}
