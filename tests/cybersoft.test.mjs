import test from 'node:test';
import assert from 'node:assert/strict';
import { createCyberSoftClient, cyberSoftId, CyberSoftError } from '../lib/cybersoft/client.js';
import { normalizeCyberSoftRoom, normalizeLocation } from '../lib/cybersoft/normalize.js';
import { priceAmounts } from '../lib/currency.js';
import { cyberSoftCopy } from '../lib/cybersoft-copy.js';
import { findRooms } from '../lib/rooms.js';
const location = { id: 42, tenViTri: 'Quận Hoàn Kiếm', tinhThanh: 'Hà Nội', quocGia: 'Việt Nam', hinhAnh: 'https://example.test/location.webp' };
const room = { id: 91, maViTri: 42, tenPhong: 'Căn hộ thử nghiệm', moTa: 'Thông tin từ nguồn thử.', giaTien: 75, khach: 4, phongNgu: 2, giuong: 2, phongTam: 1, wifi: true, bep: false, banUi: true, hinhAnh: 'https://example.test/hotel.webp' };
test('CyberSoft read endpoints follow Swagger, escape queries and keep credentials in headers', async () => {
  const calls = [];
  const api = createCyberSoftClient({ token: 'synthetic-test-only', fetchImpl: async (url, options) => {
    calls.push({ url: new URL(url), options });
    const path = new URL(url).pathname;
    const content = path.endsWith('/phan-trang-tim-kiem') ? { data: path.includes('/vi-tri') ? [location] : [room], totalRow: 1 } : path.endsWith('/42') ? location : path.endsWith('/91') ? room : path === '/api/vi-tri' ? [location] : [room];
    return Response.json({ statusCode: 200, content });
  } });
  assert.equal((await api.rooms())[0].id, 91); assert.equal((await api.room(91)).id, 91);
  assert.equal((await api.locations())[0].id, 42); assert.equal((await api.location(42)).id, 42);
  assert.equal((await api.roomsAtLocation(42))[0].id, 91);
  assert.equal((await api.searchRooms({ keyword: 'Hà Nội & a=1', pageSize: 12, pageIndex: 2 })).total, 1);
  assert.equal((await api.searchLocations({ keyword: 'Đà Nẵng' })).items[0].id, 42);
  assert.equal(calls[4].url.searchParams.get('maViTri'), '42');
  assert.equal(calls[5].url.searchParams.get('keyword'), 'Hà Nội & a=1'); assert.equal(calls[5].url.searchParams.has('a'), false);
  for (const { url, options } of calls) {
    assert.equal(url.origin, 'https://airbnbnew.cybersoft.edu.vn'); assert.ok(!url.href.includes('synthetic-test-only'));
    assert.equal(options.headers.TokenCybersoft, 'synthetic-test-only'); assert.equal(options.redirect, 'error'); assert.equal(options.next.revalidate, 60); assert.ok(options.signal);
  }
});
test('CyberSoft rejects missing credentials, unsafe IDs, malformed responses and upstream failures without leaking response bodies', async () => {
  let called = 0;
  const api = createCyberSoftClient({ token: 'synthetic-test-only', fetchImpl: async () => { called++; return Response.json({ content: [] }); } });
  for (const id of ['0','-1','../auth/signin','1?token=x', '2147483648', '1.0', '01']) { assert.equal(cyberSoftId(id), null); await assert.rejects(api.room(id), e => e.code === 'invalid_id'); }
  assert.equal(called, 0);
  await assert.rejects(createCyberSoftClient().rooms(), e => e.code === 'not_configured');
  await assert.rejects(api.searchRooms({ pageSize: 1000 }), e => e.code === 'invalid_query');
  for (const [response, code] of [[Response.json({ message: 'sensitive upstream detail' }, { status: 403 }), 'unauthorized'], [new Response('', { status: 429 }), 'rate_limited'], [new Response('', { status: 404 }), 'not_found'], [new Response('not JSON'), 'invalid_response'], [Response.json({ content: {} }), 'invalid_response'], [Response.json({ statusCode: 500, content: [] }), 'invalid_response']]) {
    await assert.rejects(createCyberSoftClient({ token: 'synthetic-test-only', fetchImpl: async () => response }).rooms(), error => error instanceof CyberSoftError && error.code === code && !error.message.includes('sensitive'));
  }
  await assert.rejects(createCyberSoftClient({ token: 'synthetic-test-only', fetchImpl: async () => { throw Error('transport secret'); } }).rooms(), e => e.code === 'unavailable' && !e.message.includes('secret'));
  await assert.rejects(createCyberSoftClient({ token: 'synthetic-test-only', fetchImpl: async () => Response.json({ content: { ...room, id: 92 } }) }).room(91), e => e.code === 'invalid_response');
});
test('CyberSoft normalization keeps real IDs, location identity, USD prices and unknown values', () => {
  const normalized = normalizeCyberSoftRoom(room, [normalizeLocation(location)], '2026-11-23');
  assert.equal(normalized.id, 'api-91'); assert.equal(normalized.cityId, 'hanoi'); assert.equal(normalized.apiLocationId, 42);
  assert.equal(normalized.referencePrice.currency, 'USD'); assert.deepEqual(priceAmounts(normalized), { USD: 75, VND: 1942500 });
  assert.equal(normalized.wifi, true); assert.equal(normalized.banLa, true); assert.equal(normalized.bep, false);
  assert.deepEqual(normalized.roomTypes, []); assert.equal(normalized.category, '');
  assert.equal(findRooms('hoan kiem', 2, '', [normalized]).length, 1); assert.equal(findRooms('Hanoi', 2, '', [normalized]).length, 1);
  const unknown = normalizeCyberSoftRoom({ id: 92, hinhAnh: 'javascript:alert(1)', wifi: 'false', giaTien: -1, khach: 999 });
  assert.equal(unknown.hinhAnh, ''); assert.equal(unknown.khach, null); assert.equal(unknown.giaTien, null); assert.equal(unknown.referencePrice, null); assert.equal(unknown.wifi, false);
  assert.equal(normalizeCyberSoftRoom({ id: 'bad' }), null);
});
test('CyberSoft interface messages have matching Vietnamese and English keys', () => {
  assert.deepEqual(Object.keys(cyberSoftCopy.vi).sort(), Object.keys(cyberSoftCopy.en).sort());
});
