import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
const directory = await mkdtemp(join(tmpdir(), 'tnbnb-cybersoft-test-'));
const port = Number(process.env.TNB_TEST_PORT || 3003), base = `http://127.0.0.1:${port}`;
const locations = [{ id: 9101, tenViTri: 'Quận Hoàn Kiếm', tinhThanh: 'Hà Nội', quocGia: 'Việt Nam' }, { id: 9102, tenViTri: 'Quận 1', tinhThanh: 'Hồ Chí Minh', quocGia: 'Việt Nam' }];
const rooms = [{ id: 990001, maViTri: 9101, tenPhong: 'Chỗ ở thử Hoàn Kiếm', moTa: 'Mô tả trong danh sách thử.', khach: 4, phongNgu: 2, phongTam: 1, giaTien: 75, wifi: true }, { id: 990002, maViTri: 9102, tenPhong: 'Chỗ ở thử Quận 1', moTa: 'Dữ liệu thử, không phải chỗ ở có thật.', khach: 2, phongNgu: 1, phongTam: 1, giaTien: 50, wifi: false }];
let token, mode = 'ready', methods = new Set(), server, logs = '';
const upstream = createServer((request, response) => {
  methods.add(request.method);
  const url = new URL(request.url, 'http://fixture.test');
  const send = (content, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ statusCode: status, content })); };
  if (request.headers.tokencybersoft !== token || mode === 'unauthorized') return send('No credentials in error details.', 403);
  if (url.pathname === '/api/phong-thue') return send([...rooms, { ...rooms[0] }, { id: 'invalid' }]);
  if (url.pathname === '/api/vi-tri') return send(locations);
  if (url.pathname === '/api/phong-thue/lay-phong-theo-vi-tri') {
    if (url.searchParams.get('maViTri') === '9109') return send(null, 503);
    return send(rooms.filter(room => room.maViTri === Number(url.searchParams.get('maViTri'))));
  }
  if (url.pathname === '/api/phong-thue/990003') return send(null, 503);
  const room = rooms.find(room => url.pathname === `/api/phong-thue/${room.id}`);
  if (room) return send({ ...room, moTa: 'Nội dung lấy trực tiếp từ API chi tiết.', privateField: 'fixture-internal-field' });
  const location = locations.find(location => url.pathname === `/api/vi-tri/${location.id}`);
  if (location) return send(location);
  if (url.pathname.endsWith('/phan-trang-tim-kiem')) return send({ data: url.pathname.includes('/vi-tri/') ? locations : rooms, totalRow: 2 });
  send(null, 404);
});
async function stop() { if (server && server.exitCode === null) { server.kill(); await Promise.race([once(server, 'exit'), setTimeout(5000)]); } }
async function start() {
  token = `synthetic-cybersoft-${randomUUID()}`;
  const env = { ...process.env, NODE_ENV: 'production', DATABASE_URL: '', POSTGRES_URL: '', TNB_BOOKINGS_DB_PATH: join(directory, 'test.sqlite'), HOSTNAME: '127.0.0.1', PORT: String(port), CYBERSOFT_TOKEN: token, TNB_CYBERSOFT_FIXTURE_URL: `http://127.0.0.1:${upstream.address().port}` };
  server = spawn(process.execPath, ['--import', pathToFileURL(resolve('tests/fixtures/cybersoft-fetch.mjs')).href, resolve('.next/standalone/server.js')], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { logs = (logs + data).slice(-10000); }); server.stderr.on('data', data => { logs = (logs + data).slice(-10000); });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/api/health')).ok) return; } catch {} if (server.exitCode !== null) break; await setTimeout(100); }
  throw Error(`Isolated CyberSoft HTTP server failed to start. ${logs.replaceAll(token, '[redacted]')}`);
}
async function page(path, locale = 'vi') { const response = await fetch(base + path, { headers: { Cookie: `tnbnb-language=${locale}` } }); return { status: response.status, html: await response.text() }; }
try {
  // Do not reuse or stop the user's application server.
  const socket = createServer(); await new Promise((yes, no) => { socket.once('error', no); socket.listen(port, '127.0.0.1', () => socket.close(yes)); });
  await new Promise(yes => upstream.listen(0, '127.0.0.1', yes));
  await cp('public', '.next/standalone/public', { recursive: true }); await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
  await start();
  for (const locale of ['vi', 'en']) {
    const api = await page('/rooms?source=cybersoft', locale); assert.equal(api.status, 200); assert.equal((api.html.match(/<article class="room-card"/g) || []).length, 2);
    const prices = api.html.replaceAll('\u00a0', ' '); assert.ok(prices.includes('75 USD') || prices.includes('USD 75')); assert.ok(api.html.includes('VND')); assert.ok(!api.html.includes('/phong/hanoi-'));
    const local = await page('/rooms?source=tnbnb', locale); assert.equal((local.html.match(/<article class="room-card"/g) || []).length, 80); assert.ok(!local.html.includes('/phong/api-990001'));
    const mixed = await page('/rooms', locale); assert.equal((mixed.html.match(/<article class="room-card"/g) || []).length, 82);
    const atLocation = await page('/rooms?source=cybersoft&location=9101', locale); assert.equal((atLocation.html.match(/<article class="room-card"/g) || []).length, 1); assert.ok(atLocation.html.includes('/phong/api-990001'));
    const search = await page('/rooms?source=cybersoft&q=hoan%20kiem&amenity=wifi', locale); assert.equal((search.html.match(/<article class="room-card"/g) || []).length, 1);
    const detail = await page('/phong/api-990001', locale); assert.equal(detail.status, 200); assert.ok(detail.html.includes('CyberSoft')); assert.ok(!detail.html.includes('fixture-internal-field')); assert.ok(!detail.html.includes('href="#room-types"')); assert.ok(detail.html.includes('name="checkin"'));
    if (locale === 'vi') assert.ok(detail.html.includes('Nội dung lấy trực tiếp từ API chi tiết.'));
    const unavailable = await page('/rooms?source=cybersoft&location=9109', locale); assert.equal((unavailable.html.match(/<article class="room-card"/g) || []).length, 0); assert.ok(!unavailable.html.includes(token));
  }
  assert.equal((await page('/phong/api-990004')).status, 404);
  // Transport errors are handled by the property's error boundary, not a fake 404.
  const unavailableDetail = await page('/phong/api-990003'); assert.notEqual(unavailableDetail.status, 404); assert.ok(!unavailableDetail.html.includes(token));
  const register = await fetch(base + '/api/auth/register', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Synthetic API User', email: `cybersoft-${randomUUID()}@example.test`, password: 'Synthetic-HTTP-password-123', favoriteIds: ['api-990001'] }) });
  assert.equal(register.status, 200);
  const cookie = register.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ');
  const favorite = async (propertyId, saved) => fetch(base + '/api/account/favorites', { method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId, saved }) });
  let favorites = await (await fetch(base + '/api/account/favorites', { headers: { Cookie: cookie } })).json(); assert.ok(favorites.favorites.includes('api-990001'));
  assert.equal((await favorite('api-990002', true)).status, 200); assert.equal((await favorite('api-990004', true)).status, 400); assert.equal((await favorite('api-990003', true)).status, 503);
  assert.equal((await favorite('api-990003', false)).status, 200); assert.equal((await favorite('api-990002', false)).status, 200);
  assert.deepEqual([...methods], ['GET'], 'No writes may be sent to the shared CyberSoft test service.');
  await stop(); mode = 'unauthorized'; await start();
  const failedMixed = await page('/rooms'); assert.equal((failedMixed.html.match(/<article class="room-card"/g) || []).length, 80); assert.ok(failedMixed.html.includes('chưa xác thực được'));
  const failedOnly = await page('/rooms?source=cybersoft'); assert.equal((failedOnly.html.match(/<article class="room-card"/g) || []).length, 0);
  const offlineImport = await fetch(base + '/api/auth/register', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Synthetic Offline User', email: `offline-${randomUUID()}@example.test`, password: 'Synthetic-HTTP-password-123', favoriteIds: ['api-990001'] }) });
  assert.equal(offlineImport.status, 200); assert.deepEqual((await offlineImport.json()).deferredFavoriteIds, ['api-990001'], 'An upstream outage must not break sign-in or discard guest favorites.');
  console.log(JSON.stringify({ provider: 'CyberSoft fixture', sources: 'TNbnb/CyberSoft/combined passed', locationsAndSearch: 'passed', detailAnd404: 'passed', favorites: 'saves/imports/missing IDs/upstream failures passed', failureFallback: 'passed', locales: 2, remoteWrites: 0 }));
} finally {
  await stop(); upstream.closeAllConnections(); await new Promise(yes => upstream.close(yes));
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('tnbnb-cybersoft-test-')) throw Error('Refusing to remove a directory outside the test temp folder.');
  await rm(directory, { recursive: true, force: true });
}
