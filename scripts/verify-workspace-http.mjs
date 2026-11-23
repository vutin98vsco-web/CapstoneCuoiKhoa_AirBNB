import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openBookingStore } from '../lib/bookings/store.server.js';
import { referenceRooms } from '../lib/reference-catalog.js';
import { findBookingOffer } from '../lib/bookings/offers.server.js';
import { nextDay, todayInVietnam } from '../lib/trip.js';
import { adminCopy } from '../lib/admin-copy.js';
import { reviewCopy } from '../lib/review-copy.js';
const base = process.env.TEST_BASE_URL || 'http://localhost:3001';
if (!process.env.TNB_BOOKINGS_DB_PATH || !process.env.TNB_BOOKINGS_DB_PATH.includes('test')) throw new Error('Run only with TNB_BOOKINGS_DB_PATH pointing to a disposable test database.');
class Client {
  cookies = new Map();
  async api(path,{ method = 'GET',body,origin = base,headers = {},redirect = 'follow' } = {}) {
    headers = { Cookie: [...this.cookies].map(([key,value]) => `${key}=${value}`).join('; '),...headers }; if (method !== 'GET') headers.Origin = origin;
    if (body) headers['Content-Type'] = 'application/json'; const response = await fetch(base+path,{ method,headers,redirect,body: body ? JSON.stringify(body) : undefined });
    for (const cookie of response.headers.getSetCookie()) { const [pair] = cookie.split(';'), at = pair.indexOf('='); this.cookies.set(pair.slice(0,at),pair.slice(at+1)); }
    return { response,status: response.status,data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text() };
  }
  auth(action,body) { return this.api(`/api/auth/${action}`,{ method: 'POST',body }); }
}
const password = 'Synthetic-admin-test-123', suffix = randomUUID(), anonymous = new Client(), admin = new Client(), a = new Client(), b = new Client();
const make = async (client,name) => { const result = await client.auth('register',{ email: `${name}-${suffix}@example.test`,name,password }); assert.equal(result.status,200); return result.data.user; };
const administrator = await make(admin,'Manager'), author = await make(a,'Author'), other = await make(b,'Other');
assert.equal(administrator.role,'user'); assert.equal((await admin.api('/api/admin/overview')).status,403); assert.equal((await anonymous.api('/api/admin/users')).status,401);
const db = openBookingStore(process.env.TNB_BOOKINGS_DB_PATH);
try { db.workspace.bootstrapRole(administrator.id,'admin'); } finally { db.close(); }
assert.equal((await admin.auth('login',{ email: administrator.email,password })).status,200);
const property = referenceRooms[0], room = property.roomTypes[0], review = { propertyId: property.id,rating: 5,body: 'Helpful synthetic review for automated tests only.' };
assert.equal((await anonymous.api('/api/reviews',{ method: 'POST',body: review })).status,401);
assert.equal((await a.api('/api/reviews',{ method: 'POST',body: review,origin: 'https://foreign.example' })).status,403);
assert.equal((await a.api('/api/reviews',{ method: 'POST',body: { ...review,rating: 6 } })).status,400);
const first = await a.api('/api/reviews',{ method: 'POST',body: review }); assert.equal(first.status,201); assert.ok(first.data.mine.id);
assert.equal((await a.api('/api/reviews',{ method: 'POST',body: review })).status,400);
assert.equal((await b.api('/api/reviews',{ method: 'PUT',body: { ...review,body: 'A stranger must not overwrite a review.' } })).status,404);
assert.equal((await a.api('/api/reviews',{ method: 'PUT',body: { ...review,rating: 4,body: 'Updated synthetic review, with safe <script>markup</script>.' } })).status,200);
let listed = (await anonymous.api(`/api/reviews?propertyId=${property.id}`)).data; assert.equal(listed.count,1); assert.equal(listed.summary.average,4); assert.equal(listed.items[0].email,undefined); assert.equal(listed.mine,null);
assert.equal((await b.api('/api/reviews',{ method: 'POST',body: { ...review,rating: 2 } })).status,201); assert.equal((await anonymous.api(`/api/reviews?propertyId=${property.id}`)).data.summary.average,3);
assert.equal((await a.api('/api/admin/reviews')).status,403);
assert.equal((await admin.api('/api/admin/reviews',{ method: 'POST',body: { id: first.data.mine.id,status: 'hidden',reason: 'Synthetic moderation test' } })).status,200);
assert.equal((await anonymous.api(`/api/reviews?propertyId=${property.id}`)).data.count,1);
assert.equal((await a.api(`/api/reviews?propertyId=${property.id}`)).data.mine.status,'hidden');
assert.equal((await a.api('/api/reviews',{ method: 'PUT',body: review })).data.mine.status,'hidden');
assert.equal((await admin.api('/api/admin/reviews',{ method: 'POST',body: { id: first.data.mine.id,status: 'published',reason: '' } })).status,200);
for (const locale of ['vi','en']) {
  const page = await admin.api('/quan-tri',{ headers: { Cookie: [...admin.cookies].map(([key,value]) => `${key}=${value}`).join('; ')+`; tnbnb-language=${locale}` } }); assert.equal(page.status,200); assert.ok(page.data.includes(adminCopy[locale].title)); assert.ok(page.data.includes('noindex'));
  const detail = await anonymous.api(`/phong/${property.id}`,{ headers: { Cookie: `tnbnb-language=${locale}` } }); assert.equal(detail.status,200); assert.ok(detail.data.includes(reviewCopy[locale].title)); assert.ok(!detail.data.includes('<script>markup</script>'));
}
assert.equal((await admin.api('/api/admin/users',{ method: 'POST',body: { id: administrator.id,role: 'user',disabled: false,currentPassword: password } })).data.error,'self_change');
assert.equal((await admin.api('/api/admin/users',{ method: 'POST',body: { id: other.id,role: 'admin',disabled: false,currentPassword: 'incorrect' } })).status,403);
assert.equal((await admin.api('/api/admin/users',{ method: 'POST',body: { id: other.id,role: 'user',disabled: true,currentPassword: password } })).status,200);
assert.equal((await b.api('/api/auth/session')).data.user,null); assert.equal((await b.auth('login',{ email: other.email,password })).status,401);
assert.equal((await admin.api('/api/admin/users',{ method: 'POST',body: { id: other.id,role: 'user',disabled: false,currentPassword: password } })).status,200);
const cityId = `test-${suffix.slice(0,8)}`; assert.equal((await admin.api('/api/admin/cities',{ method: 'POST',body: { id: cityId,name: { vi: 'Thành phố kiểm thử',en: 'Test City' } } })).status,200);
const propertyBody = { name: 'Synthetic Administration Hotel',cityId,description: { vi: 'Cơ sở tổng hợp dành riêng cho kiểm thử.',en: 'Synthetic property for automated tests only.' },address: { vi: 'Địa chỉ kiểm thử',en: 'Synthetic address' },sourceUrl: property.sourceUrl,officialWebsite: property.officialWebsite || '',cover: property.hinhAnh };
const created = await admin.api('/api/admin/properties',{ method: 'POST',body: propertyBody }); assert.equal(created.status,200); const id = created.data.id; assert.ok(id);
assert.equal((await admin.api('/api/admin/cities',{ method: 'POST',body: { id: cityId,action: 'archive' } })).data.error,'location_in_use');
const roomBody = { propertyId: id,name: { vi: 'Phòng kiểm thử',en: 'Synthetic room' },description: { vi: 'Hạng phòng dành riêng cho kiểm thử.',en: 'Room type for automated tests only.' },category: 'room',capacity: '2',areaM2: '30',beds: { vi: 'Một giường đôi',en: 'One double bed' },occupancyNote: { vi: 'Hai người lớn',en: 'Two adults' },sourceUrl: room.sourceUrl,images: [room.images[0].path],priceAmount: '1500000',priceCurrency: 'VND',priceSource: room.sourceUrl,priceContext: { vi: 'Giá tổng hợp kiểm thử, không phải báo giá thật.',en: 'Synthetic test rate, not a real quote.' } };
assert.equal((await a.api('/api/admin/rooms',{ method: 'POST',body: roomBody })).status,403);
assert.equal((await admin.api('/api/admin/rooms',{ method: 'POST',body: { ...roomBody,priceContext: { vi: '',en: '' } } })).status,400);
const category = await admin.api('/api/admin/rooms',{ method: 'POST',body: roomBody }); assert.equal(category.status,200);
const publicPage = await anonymous.api(`/phong/${id}`); assert.equal(publicPage.status,200); assert.ok(publicPage.data.includes(propertyBody.name));
const checkin = nextDay(nextDay(todayInVietnam())), checkout = nextDay(checkin), query = new URLSearchParams({ property: id,roomType: category.data.id,checkin,checkout,guests: '2',rooms: '1' });
const checkoutPage = await a.api(`/dat-phong?${query}`); assert.equal(checkoutPage.status,200); assert.ok(checkoutPage.data.includes('1.500.000'));
// The authoritative quote includes exactly the same grade price object saved by the administrator.
const effective = (await admin.api(`/api/admin/properties?q=${encodeURIComponent(propertyBody.name)}`)).data.items[0];
const quote = findBookingOffer(id,category.data.id,[effective]);
await a.api('/api/bookings/session');
const booking = await a.api('/api/bookings',{ method: 'POST',headers: { 'Idempotency-Key': randomUUID() },body: { propertyId: id,roomTypeId: category.data.id,quoteVersion: quote.quoteVersion,checkin,checkout,guests: 2,rooms: 1,fullName: 'Synthetic Guest',email: author.email,phone: '+84901234567',message: '',accepted: true } }); assert.equal(booking.status,201);
assert.equal((await admin.api('/api/admin/bookings',{ method: 'POST',body: { id: booking.data.id,stage: 'contacted',note: 'Private administrative note',cancel: false } })).status,200);
assert.ok(!(await a.api(`/dat-phong/${booking.data.id}`)).data.includes('Private administrative note'));
assert.equal((await admin.api('/api/admin/properties',{ method: 'POST',body: { id,action: 'archive' } })).status,200);
assert.equal((await anonymous.api(`/phong/${id}`)).status,404); assert.equal((await a.api(`/dat-phong/${booking.data.id}`)).status,200);
assert.equal((await admin.api('/api/admin/bookings',{ method: 'POST',body: { id: booking.data.id,stage: 'closed',note: 'Cancelled by manager',cancel: true } })).status,200);
assert.equal((await a.api('/api/bookings')).data.bookings.find(value => value.id === booking.data.id).status,'cancelled');
assert.equal((await admin.api('/api/admin/properties',{ method: 'POST',body: { id,action: 'restore' } })).status,200); assert.equal((await anonymous.api(`/phong/${id}`)).status,200);
assert.equal((await admin.api('/api/admin/rooms',{ method: 'POST',body: { propertyId: id,id: category.data.id,action: 'archive' } })).status,200); assert.equal((await anonymous.api(`/dat-phong?${query}`)).data.includes('1.500.000'),false);
assert.equal((await a.api('/api/reviews',{ method: 'DELETE',body: { propertyId: property.id } })).status,200); assert.equal((await a.api(`/api/reviews?propertyId=${property.id}`)).data.mine,null);
const logs = (await admin.api('/api/admin/audit')).data; assert.ok(logs.count >= 10); assert.ok(!JSON.stringify(logs).includes(password));
assert.match((await admin.api('/api/admin/overview')).response.headers.get('cache-control'),/no-store/);
assert.equal((await admin.api('/api/admin/overview',{ method: 'POST',body: {},origin: 'https://foreign.example' })).status,403);
console.log(JSON.stringify({ reviews: 'create/edit/delete/score/moderation passed',permissions: 'anonymous/member/admin isolation passed',catalog: 'city/property/room editing and archive passed',bookingOperations: 'internal notes, cancellation and snapshot retention passed',roles: 'password confirmation, lockout and session revocation passed',locales: 2,audit: 'passed' }));
