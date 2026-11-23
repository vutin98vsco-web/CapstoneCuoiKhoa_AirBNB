import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { referenceRooms } from '../lib/reference-catalog.js';
import { findBookingOffer } from '../lib/bookings/offers.server.js';
import { todayInVietnam, nextDay } from '../lib/trip.js';
import { accountCopy } from '../lib/account-copy.js';

const base = process.env.TEST_BASE_URL || 'http://localhost:3001';
class Browser {
  cookies = new Map();
  get cookie() { return [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '); }
  clone() { const next = new Browser(); next.cookies = new Map(this.cookies); return next; }
  async request(path, { method = 'GET', body, headers = {}, origin = base, redirect = 'follow' } = {}) {
    headers = { Cookie: this.cookie, ...headers }; if (method !== 'GET') headers.Origin = origin;
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(base + path, { method, headers, body, redirect });
    for (const item of response.headers.getSetCookie()) { const [pair] = item.split(';'); const equals = pair.indexOf('='); this.cookies.set(pair.slice(0, equals), pair.slice(equals + 1)); }
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    return { response, status: response.status, data };
  }
  auth(action, body = {}, options = {}) { return this.request(`/api/auth/${action}`, { method: 'POST', body, ...options }); }
}
const guest = new Browser(), other = new Browser();
const property = referenceRooms.find(room => room.roomTypes.some(type => type.price)); const type = property.roomTypes.find(type => type.price);
const offer = findBookingOffer(property.id, type.id); const checkin = nextDay(nextDay(todayInVietnam())); const checkout = nextDay(checkin);
const email = `account-${randomUUID()}@example.test`, password = 'Synthetic-password-123';
const contact = { propertyId: property.id, roomTypeId: type.id, checkin, checkout, rooms: 1, guests: 1, fullName: 'Account HTTP Test', email, phone: '+84901234567', message: '', accepted: true, quoteVersion: offer.quoteVersion };
assert.equal((await guest.request('/api/bookings/session')).status, 200);
const oldGuest = guest.clone();
const booking = await guest.request('/api/bookings', { method: 'POST', body: contact, headers: { 'Idempotency-Key': randomUUID() } }); assert.equal(booking.status, 201);
assert.equal((await guest.auth('register', { email, name: 'Account Test', password }, { origin: 'https://foreign.example' })).status, 403);
const invalid = await guest.auth('register', { email: 'bad', name: 'X', password: 'short' }); assert.equal(invalid.status, 400); assert.equal(invalid.data.fields.password, 'password_invalid');
const registered = await guest.auth('register', { email: email.toUpperCase(), name: 'Account Test', phone: contact.phone, password, remember: true, favoriteIds: [property.id, property.id, 'fake-id'] });
assert.equal(registered.status, 200); assert.equal(registered.data.user.email, email); assert.match(registered.data.recoveryCode, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){9}$/);
const originalCode = registered.data.recoveryCode; assert.equal(registered.data.user.password_hash, undefined);
const authCookie = registered.response.headers.getSetCookie().find(value => value.startsWith('tnbnb-account-session=')); assert.match(authCookie, /HttpOnly/i); assert.match(authCookie, /SameSite=lax/i); assert.match(authCookie, /Max-Age=2592000/); assert.match(authCookie, /Secure/i);
assert.equal((await guest.auth('register', { email, name: 'Duplicate', password })).status, 409);
assert.equal((await guest.request('/api/auth/session')).data.user.id, registered.data.user.id);
assert.equal((await guest.request('/api/bookings')).data.bookings.length, 1);
assert.equal((await oldGuest.request('/api/bookings')).data.bookings.length, 0);
assert.equal((await oldGuest.request(`/dat-phong/${booking.data.id}`)).status, 404);
assert.equal((await oldGuest.request(`/api/bookings/${booking.data.id}/cancel`, { method: 'POST' })).status, 404);
assert.equal((await oldGuest.request('/api/bookings', { method: 'POST', body: contact, headers: { 'Idempotency-Key': randomUUID() } })).status, 409);
assert.equal((await other.auth('login', { email, password: 'incorrect-password' })).status, 401);
assert.equal((await other.auth('login', { email, password })).status, 200);
assert.equal((await other.request('/api/bookings')).data.bookings[0].id, booking.data.id);
assert.deepEqual((await other.request('/api/account/favorites')).data.favorites, [property.id]);
assert.equal((await other.request('/api/account/favorites', { method: 'POST', body: { propertyId: property.id, saved: false } })).status, 200);
assert.deepEqual((await guest.request('/api/account/favorites')).data.favorites, []);
assert.equal((await guest.request('/api/account/favorites', { method: 'POST', body: { propertyId: 'not-a-property', saved: true } })).status, 400);
assert.equal((await guest.auth('profile', { name: 'Updated Account', phone: '+84901234567', email: 'injected@example.test', id: 'injected' })).data.user.email, email);
assert.equal((await other.request('/api/auth/session')).data.user.name, 'Updated Account');
const stranger = new Browser(); await stranger.auth('register', { email: `stranger-${randomUUID()}@example.test`, name: 'Stranger', password });
assert.equal((await stranger.request(`/dat-phong/${booking.data.id}`)).status, 404);
assert.equal((await stranger.request(`/api/bookings/${booking.data.id}/cancel`, { method: 'POST' })).status, 404);
assert.deepEqual((await stranger.request('/api/account/favorites')).data.favorites, []);
const image = await sharp({ create: { width: 64, height: 80, channels: 3, background: '#dd9988' } }).png().toBuffer();
const form = new FormData(); form.append('avatar', new File([image], 'profile.png', { type: 'image/png' }));
const avatar = await guest.request('/api/account/avatar', { method: 'POST', body: form }); assert.equal(avatar.status, 200); assert.equal(avatar.data.user.hasAvatar, true);
const photo = await fetch(base + '/api/account/avatar', { headers: { Cookie: guest.cookie } }); assert.equal(photo.status, 200); assert.match(photo.headers.get('content-type'), /image\/webp/); const meta = await sharp(Buffer.from(await photo.arrayBuffer())).metadata(); assert.equal(meta.width, 256); assert.equal(meta.height, 256);
assert.equal((await new Browser().request('/api/account/avatar')).status, 401);
const badPhoto = new FormData(); badPhoto.append('avatar', new File(['<svg></svg>'], 'bad.svg', { type: 'image/svg+xml' })); assert.equal((await guest.request('/api/account/avatar', { method: 'POST', body: badPhoto })).status, 400);
assert.equal((await guest.request('/api/account/avatar', { method: 'DELETE' })).data.user.hasAvatar, false);
const checkoutQuery = new URLSearchParams({ property: property.id, roomType: type.id, checkin, checkout, guests: '1', rooms: '1' });
for (const locale of ['vi', 'en']) {
  const headers = { Cookie: `${guest.cookie}; tnbnb-language=${locale}` };
  const profile = await guest.request('/tai-khoan', { headers }); assert.equal(profile.status, 200); assert.ok(profile.data.includes(accountCopy[locale].profileIntro)); assert.ok(profile.data.includes('Updated Account')); assert.ok(!profile.data.includes(password)); assert.ok(profile.data.includes('noindex'));
  const checkoutPage = await guest.request(`/dat-phong?${checkoutQuery}`, { headers }); assert.equal(checkoutPage.status, 200); assert.ok(checkoutPage.data.includes('value="Updated Account"')); assert.ok(checkoutPage.data.includes(accountCopy[locale].checkoutAccount));
  for (const [route, title] of [['/dang-nhap', 'welcome'], ['/dang-ky', 'registerTitle'], ['/quen-mat-khau', 'resetTitle']]) { const page = await new Browser().request(route, { headers: { Cookie: `tnbnb-language=${locale}` } }); assert.equal(page.status, 200); assert.ok(page.data.includes(accountCopy[locale][title])); }
}
const redirect = await new Browser().request('/tai-khoan', { redirect: 'manual' }); assert.equal(redirect.status, 307); assert.equal(redirect.response.headers.get('location'), '/dang-nhap?returnTo=%2Ftai-khoan');
const safeRedirect = await guest.request('/dang-nhap?returnTo=https://foreign.example', { redirect: 'manual' }); assert.equal(safeRedirect.response.headers.get('location'), '/tai-khoan');
assert.equal((await guest.auth('password', { currentPassword: 'wrong-current', password: 'Next-password-123' })).status, 403);
const firstSession = guest.clone(), secondSession = other.clone(); const nextPassword = 'Next-password-123';
assert.equal((await guest.auth('password', { currentPassword: password, password: nextPassword })).status, 200);
assert.equal((await firstSession.request('/api/auth/session')).data.user, null); assert.equal((await secondSession.request('/api/auth/session')).data.user, null); assert.ok((await guest.request('/api/auth/session')).data.user);
assert.equal((await other.auth('login', { email, password })).status, 401); assert.equal((await other.auth('login', { email, password: nextPassword })).status, 200);
assert.equal((await guest.auth('recovery', { currentPassword: 'wrong-current' })).status, 403);
const rotated = await guest.auth('recovery', { currentPassword: nextPassword }); assert.equal(rotated.status, 200);
const resetBrowser = new Browser(); assert.equal((await resetBrowser.auth('reset', { email, recoveryCode: originalCode, password: 'Reset-password-123' })).status, 401);
const resetResult = await resetBrowser.auth('reset', { email, recoveryCode: rotated.data.recoveryCode, password: 'Reset-password-123' }); assert.equal(resetResult.status, 200); assert.ok(resetResult.data.recoveryCode); assert.notEqual(resetResult.data.recoveryCode, rotated.data.recoveryCode);
assert.equal((await resetBrowser.auth('reset', { email, recoveryCode: rotated.data.recoveryCode, password: 'Reset-again-123' })).status, 401);
assert.equal((await guest.request('/api/auth/session')).data.user, null); assert.equal((await other.request('/api/auth/session')).data.user, null);
assert.equal((await guest.auth('login', { email, password: 'Reset-password-123' })).status, 200);
assert.equal((await guest.request('/api/bookings')).data.bookings.length, 1);
assert.equal((await guest.request(`/api/bookings/${booking.data.id}/cancel`, { method: 'POST' })).data.status, 'cancelled');
const accountOnly = guest.clone(); accountOnly.cookies.delete('tnbnb-booking-session');
const accountBooking = await accountOnly.request('/api/bookings', { method: 'POST', body: contact, headers: { 'Idempotency-Key': randomUUID() } }); assert.equal(accountBooking.status, 201);
assert.equal((await guest.request('/api/bookings')).data.bookings.length, 2);
assert.equal((await accountOnly.request(`/api/bookings/${accountBooking.data.id}/cancel`, { method: 'POST' })).data.status, 'cancelled');
const revoked = guest.clone(); assert.equal((await guest.auth('logout')).status, 200); assert.equal((await revoked.request('/api/auth/session')).data.user, null); assert.equal((await guest.request('/api/bookings')).data.bookings.length, 0); assert.equal((await guest.request('/api/account/favorites')).status, 401);
const limitedEmail = `limited-${randomUUID()}@example.test`; for (let i = 0; i < 8; i++) assert.equal((await guest.auth('login', { email: limitedEmail, password })).status, 401); assert.equal((await guest.auth('login', { email: limitedEmail, password })).status, 429);
console.log(JSON.stringify({ accountRegistration: 'passed', loginLogout: 'passed', csrf: 'passed', passwordChangeAndSessionRevocation: 'passed', recoveryRotationAndSingleUse: 'passed', guestClaimAndAccountIsolation: 'passed', crossDeviceTripsAndFavorites: 'passed', profileAndAvatar: 'passed', checkoutPrefill: 'passed', localeScreens: 8, rateLimit: 'passed', redirects: 'passed' }));
