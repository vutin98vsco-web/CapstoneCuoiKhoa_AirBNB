import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { openBookingStore, newSession, sessionHash } from '../lib/bookings/store.server.js';
import { hashPassword, verifyPassword, makeRecoveryCode, recoveryHash, matchRecovery } from '../lib/auth/password.server.js';
import { normalizeEmail, validPassword, profileValues, safeReturnTo } from '../lib/auth/validation.js';
import { accountCopy } from '../lib/account-copy.js';

test('passwords use salted scrypt hashes and recovery codes are one-way', async () => {
  const hash = await hashPassword('Example password 2026');
  assert.notEqual(hash, await hashPassword('Example password 2026'));
  assert.ok(await verifyPassword('Example password 2026', hash));
  assert.equal(await verifyPassword('wrong password', hash), false);
  assert.equal(await verifyPassword('wrong password'), false);
  assert.equal(await verifyPassword('x'.repeat(129), hash), false);
  const code = makeRecoveryCode(); assert.ok(matchRecovery(code.toLowerCase().replaceAll('-', ' '), recoveryHash(code)));
  assert.equal(matchRecovery(makeRecoveryCode(), recoveryHash(code)), false);
  assert.equal(recoveryHash('bad code'), null);
});
test('account inputs and return URLs reject invalid values and external redirects', () => {
  assert.equal(normalizeEmail('  Test@Example.test '), 'test@example.test');
  assert.ok(validPassword('long password')); assert.equal(validPassword(' '.repeat(12)), false);
  assert.deepEqual(profileValues({ name: '  Guest   User ', phone: '+84 901234567' }), { name: 'Guest User', phone: '+84 901234567', fields: {} });
  assert.equal(profileValues({ name: 'X', phone: '123' }).fields.phone, 'phone_invalid');
  for (const bad of ['https://evil.test', '//evil.test', '/%2fevil.test', '/%5cevil.test', '/api/auth/logout', '/dang-nhap', '/x%0aLocation:evil', '/%']) assert.equal(safeReturnTo(bad), '/tai-khoan');
  assert.equal(safeReturnTo('/dat-phong?property=abc&guests=2'), '/dat-phong?property=abc&guests=2');
});
test('accounts persist, sessions revoke, favorites isolate, guest claims never move by email', async () => {
  const filename = resolve('.reference', `account-unit-${randomUUID()}.sqlite`); let store = openBookingStore(filename);
  try {
    const recovery = recoveryHash(makeRecoveryCode());
    const a = store.accounts.register({ email: 'account-a@example.test', name: 'Account A', phone: '', passwordHash: 'test hash', recoveryHash: recovery });
    const b = store.accounts.register({ email: 'account-b@example.test', name: 'Account B', phone: '', passwordHash: 'test hash', recoveryHash: recovery });
    assert.equal(store.accounts.register({ email: a.email, name: 'Duplicate', phone: '', passwordHash: '', recoveryHash: '' }), null);
    assert.equal(a.password_hash, undefined); assert.equal(a.recovery_hash, undefined);
    const guest = sessionHash(newSession());
    const trip = { propertyId: 'hotel', roomTypeId: 'grade', checkin: '2027-01-01', checkout: '2027-01-02', guests: 1, rooms: 1, fullName: 'Guest', email: b.email, phone: '+84901234567', message: '' };
    const booking = store.create(guest, randomUUID(), trip, {}).booking;
    const token1 = sessionHash(newSession()), token2 = sessionHash(newSession());
    store.accounts.createSession(a.id, token1, Date.now() + 60000, guest, ['hotel-a']);
    store.accounts.createSession(b.id, token2, Date.now() + 60000, guest, ['hotel-b']);
    assert.ok(store.accounts.isClaimed(guest));
    assert.equal(store.list(`account:${a.id}`).length, 1); assert.equal(store.list(`account:${b.id}`).length, 0);
    assert.equal(store.get(`account:${b.id}`, booking.id), null); assert.equal(store.cancel(`account:${b.id}`, booking.id), null);
    assert.equal(store.create(`account:${a.id}`, randomUUID(), trip, {}).error, 'duplicate');
    assert.equal(store.accounts.session(token1).id, a.id);
    assert.deepEqual(store.accounts.favorites(a.id), ['hotel-a']); assert.deepEqual(store.accounts.favorites(b.id), ['hotel-b']);
    assert.deepEqual(store.accounts.saveFavorite(a.id, 'hotel-a', false), []);
    store.accounts.updateProfile(a.id, { name: 'Changed Name', phone: '+84901234567' });
    assert.equal(store.accounts.session(token1).name, 'Changed Name');
    store.close(); store = openBookingStore(filename);
    assert.equal(store.accounts.publicById(a.id).name, 'Changed Name');
    store.accounts.revokeSession(token1); assert.equal(store.accounts.session(token1), null); assert.equal(store.accounts.session(token2).id, b.id);
    store.accounts.createSession(a.id, token1, Date.now() - 1); assert.equal(store.accounts.session(token1), null);
    const token3 = sessionHash(newSession()); store.accounts.createSession(a.id, token3, Date.now() + 60000);
    const replacement = recoveryHash(makeRecoveryCode());
    assert.ok(store.accounts.updatePassword(a.id, 'new hash', replacement, recovery));
    assert.equal(store.accounts.session(token3), null); assert.equal(store.accounts.updatePassword(a.id, 'bad hash', null, recovery), false);
    assert.equal(store.accounts.credentials(a.id).password_hash, 'new hash');
    for (let i = 0; i < 8; i++) store.accounts.failure('login', a.email);
    assert.equal(store.accounts.allowed('login', a.email), false); assert.ok(store.accounts.allowed('login', b.email));
    store.accounts.clearFailures('login', a.email); assert.ok(store.accounts.allowed('login', a.email));
  } finally { store.close(); for (const suffix of ['', '-wal', '-shm']) await unlink(filename + suffix).catch(() => {}); }
});
test('account screens and error messages have complete matching locale keys', () => {
  assert.deepEqual(Object.keys(accountCopy.vi).sort(), Object.keys(accountCopy.en).sort());
  assert.deepEqual(Object.keys(accountCopy.vi.errors).sort(), Object.keys(accountCopy.en.errors).sort());
  for (const locale of ['vi', 'en']) for (const value of Object.values(accountCopy[locale])) if (typeof value === 'string') assert.ok(!value.includes('???'));
});
