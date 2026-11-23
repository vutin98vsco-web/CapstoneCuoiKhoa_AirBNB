import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { unlink } from 'node:fs/promises';
import { openBookingStore, newSession, sessionHash } from '../lib/bookings/store.server.js';
import { createEmailStore } from '../lib/email/store.js';
test('email tokens expire, consume once and password reset revokes sessions', async () => {
  const filename = resolve('.reference', `email-test-${randomUUID()}.sqlite`),
    accounts = openBookingStore(filename),
    mail = createEmailStore({ filename });
  try {
    const user = accounts.accounts.register({
        email: 'email-test@example.test',
        name: 'Email Test',
        phone: '',
        passwordHash: 'old',
        recoveryHash: 'old',
      }),
      hash = (value) => createHash('sha256').update(value).digest('hex');
    await mail.issue(user.id, 'verify', hash('expired'), Date.now() - 1000);
    assert.equal(await mail.verify(hash('expired')), false);
    await mail.issue(user.id, 'verify', hash('valid'), Date.now() + 60000);
    const results = await Promise.all([mail.verify(hash('valid')), mail.verify(hash('valid'))]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(await mail.verified(user.id), true);
    const session = sessionHash(newSession());
    accounts.accounts.createSession(user.id, session, Date.now() + 60000);
    await mail.issue(user.id, 'reset', hash('reset'), Date.now() + 60000);
    assert.equal(await mail.reset(hash('reset'), 'new-password', 'new-recovery'), true);
    assert.equal(await mail.reset(hash('reset'), 'bad', 'bad'), false);
    assert.equal(accounts.accounts.session(session), null);
    assert.equal(accounts.accounts.credentials(user.id).password_hash, 'new-password');
    const id = await mail.enqueue('unique', {
      to: 'test@example.test',
      subject: 'Synthetic',
      text: 'Synthetic',
    });
    assert.equal(await mail.enqueue('unique', {}), id);
    const claims = await Promise.all([mail.claim(id), mail.claim(id)]);
    const claim = claims.find(Boolean);
    assert.equal(claims.filter(Boolean).length, 1);
    await mail.complete(id, 'wrong-lease', true);
    assert.equal(await mail.claim(id), null);
    await mail.complete(id, claim.lease, true);
    assert.equal(await mail.claim(id), null);
  } finally {
    await mail.close();
    accounts.close();
    for (const suffix of ['', '-wal', '-shm']) await unlink(filename + suffix).catch(() => {});
  }
});
