import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { unlink } from 'node:fs/promises';
import { validateBooking } from '../lib/bookings/validation.js';
import { findBookingOffer, makeBookingSnapshot } from '../lib/bookings/offers.server.js';
import { newSession, sessionHash, openBookingStore } from '../lib/bookings/store.server.js';
import { referenceRooms } from '../lib/reference-catalog.js';
import { bookingCopy } from '../lib/booking-copy.js';

const request = { propertyId: 'hcm-102060', roomTypeId: 'premier-deluxe', checkin: '2027-01-10', checkout: '2027-01-13', rooms: 2, guests: 4, fullName: 'Test Guest', email: 'guest@example.test', phone: '+84901234567', message: 'An arrival request', accepted: true };
test('booking dates, occupancy and contact details are validated together', () => {
  assert.deepEqual(validateBooking(request, 2, '2026-11-18').errors, {});
  assert.equal(validateBooking({ ...request, checkin: '2026-02-30' }, 2, '2026-11-18').errors.checkin, 'date_required');
  assert.equal(validateBooking({ ...request, checkin: '2026-11-17' }, 2, '2026-11-18').errors.checkin, 'date_past');
  assert.equal(validateBooking({ ...request, checkout: request.checkin }, 2, '2026-11-18').errors.checkout, 'date_order');
  assert.equal(validateBooking({ ...request, guests: 5 }, 2, '2026-11-18').errors.guests, 'capacity_exceeded');
  assert.equal(validateBooking({ ...request, guests: 5 }, null, '2026-11-18').errors.guests, undefined);
  const invalid = validateBooking({ ...request, email: 'bad', phone: '123', fullName: ' ', accepted: false, message: 'x'.repeat(1001) }, 2, '2026-11-18').errors;
  assert.deepEqual(Object.keys(invalid).sort(), ['accepted', 'email', 'fullName', 'message', 'phone']);
});
test('price snapshots use the selected category and the room/night multiplier', () => {
  const property = referenceRooms.find(room => room.roomTypes.some(type => type.price));
  const priced = property.roomTypes.find(type => type.price);
  const offer = findBookingOffer(property.id, priced.id);
  const snapshot = makeBookingSnapshot(offer, { nights: 3, rooms: 2 });
  assert.ok(snapshot.totals.VND > 0 && snapshot.totals.USD > 0);
  assert.ok(Math.abs(snapshot.totals.VND - snapshot.nightly.VND * 6) < 0.01);
  const unknownProperty = referenceRooms.find(room => room.roomTypes.some(type => !type.price));
  const unknownType = unknownProperty.roomTypes.find(type => !type.price);
  const unpriced = makeBookingSnapshot(findBookingOffer(unknownProperty.id, unknownType.id), { nights: 3, rooms: 2 });
  assert.equal(unpriced.totals, null);
  assert.equal(unpriced.nightly, null);
  assert.equal(findBookingOffer(property.id, 'not-a-room'), null);
});
test('guest session identifiers are unguessable and invalid cookies are rejected', () => {
  const a = newSession(), b = newSession();
  assert.match(a, /^[a-f0-9]{64}$/); assert.notEqual(a, b); assert.notEqual(sessionHash(a), a);
  assert.equal(sessionHash('forged'), null); assert.equal(sessionHash(undefined), null);
});
test('requests persist, retries do not duplicate, and owners cannot access each other', async () => {
  const filename = resolve('.reference', `booking-unit-${randomUUID()}.sqlite`);
  const owner = sessionHash(newSession()), stranger = sessionHash(newSession());
  let store = openBookingStore(filename);
  try {
    const trip = validateBooking(request, 2, '2026-11-18').value;
    const offer = findBookingOffer(request.propertyId, request.roomTypeId);
    const snapshot = makeBookingSnapshot(offer, trip);
    const key = randomUUID();
    const first = store.create(owner, key, trip, snapshot);
    assert.equal(first.booking.status, 'pending'); assert.equal(first.replay, false);
    assert.match(first.booking.reference, /^TN-[A-F0-9]{10}$/);
    assert.equal(store.create(owner, key, trip, snapshot).booking.id, first.booking.id);
    assert.equal(store.create(owner, key, { ...trip, guests: 3 }, snapshot).error, 'request_changed');
    assert.equal(store.create(owner, randomUUID(), trip, snapshot).error, 'duplicate');
    assert.equal(store.list(owner).length, 1); assert.equal(store.list(stranger).length, 0);
    assert.equal(store.get(stranger, first.booking.id), null); assert.equal(store.cancel(stranger, first.booking.id), null);
    assert.equal(store.get(owner, first.booking.id).status, 'pending');
    store.close(); store = openBookingStore(filename);
    assert.equal(store.get(owner, first.booking.id).email, request.email);
    assert.equal(store.cancel(owner, first.booking.id).status, 'cancelled');
    assert.equal(store.cancel(owner, first.booking.id).status, 'cancelled');
    assert.equal(store.create(owner, randomUUID(), trip, snapshot).booking.status, 'pending');
    assert.equal(store.list(owner).length, 2);
  } finally { store.close(); for (const suffix of ['', '-wal', '-shm']) await unlink(filename + suffix).catch(() => {}); }
});
test('booking messages have matching Vietnamese and English keys', () => {
  assert.deepEqual(Object.keys(bookingCopy.vi).sort(), Object.keys(bookingCopy.en).sort());
  assert.deepEqual(Object.keys(bookingCopy.vi.errors).sort(), Object.keys(bookingCopy.en.errors).sort());
});
