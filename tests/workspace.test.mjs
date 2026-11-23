import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { openBookingStore, newSession, sessionHash } from '../lib/bookings/store.server.js';
import { adminCopy } from '../lib/admin-copy.js';
import { reviewCopy } from '../lib/review-copy.js';
async function fixture(fn) {
  const filename = join(tmpdir(),`tnbnb-workspace-${randomUUID()}.sqlite`), db = openBookingStore(filename);
  const create = name => db.accounts.register({ email: `${name}@example.test`,name,phone: '',passwordHash: 'fixture hash',recoveryHash: 'fixture recovery' });
  try { await fn(db,create,filename); } finally { db.close(); for (const suffix of ['', '-wal', '-shm']) await unlink(filename+suffix).catch(() => {}); }
}
test('community scores exclude hidden/deleted reviews and expose no account email', () => fixture((db,create) => {
  const a = create('Review A'), b = create('Review B'), w = db.workspace;
  const first = w.saveReview(a.id,'property',{ rating: 5,body: 'A helpful first review' }); w.saveReview(b.id,'property',{ rating: 3,body: 'A helpful second review' });
  assert.equal(w.reviewList('property').summary.average,4); assert.equal(w.reviewList('property').count,2);
  assert.equal(Object.getPrototypeOf(w.reviewList('property').summary.histogram[0]),Object.prototype,'SSR review aggregates must be serializable client props');
  assert.equal(w.reviewList('property').items[0].email,undefined); assert.equal(w.reviewList('property').items[0].accountId,undefined);
  assert.throws(() => w.saveReview(a.id,'property',{ rating: 1,body: 'A duplicate review' }),/review_exists/);
  w.moderate(a.id,first.id,'hidden','Hidden for testing'); assert.equal(w.reviewList('property').count,1);
  assert.equal(w.ownReview(a.id,'property').moderationReason,'Hidden for testing');
  w.saveReview(a.id,'property',{ rating: 4,body: 'An edited hidden review' },true); assert.equal(w.ownReview(a.id,'property').status,'hidden');
  w.moderate(b.id,first.id,'published',''); assert.equal(w.reviewList('property').summary.average,3.5);
  w.deleteReview(a.id,'property'); assert.equal(w.ownReview(a.id,'property'),null); assert.equal(w.reviewList('property').count,1);
  w.saveReview(a.id,'property',{ rating: 2,body: 'A fresh review after deletion' }); assert.equal(w.reviewList('property').summary.average,2.5);
  assert.equal(w.reviewList('property',1,'highest').items[0].rating,3); assert.equal(w.reviewList('property',1,'lowest').items[0].rating,2);
}));
test('server roles, lockouts and last-admin protections revoke affected sessions', () => fixture((db,create) => {
  const a = create('Admin A'), b = create('Admin B'), c = create('Regular User'), w = db.workspace;
  const token = sessionHash(newSession()); db.accounts.createSession(a.id,token,Date.now()+60000);
  assert.equal(db.accounts.session(token).role,'user'); w.bootstrapRole(a.id,'admin'); assert.equal(db.accounts.session(token),null);
  assert.throws(() => w.bootstrapRole(a.id,'user'),/last_admin/); assert.throws(() => w.manageUser(a.id,a.id,'user',true),/self_change/);
  w.bootstrapRole(b.id,'admin'); w.manageUser(b.id,a.id,'user',false); assert.equal(db.accounts.publicById(a.id).role,'user');
  const userToken = sessionHash(newSession()); db.accounts.createSession(c.id,userToken,Date.now()+60000); w.manageUser(b.id,c.id,'user',true);
  assert.equal(db.accounts.session(userToken),null); assert.equal(db.accounts.credentials(c.id).disabled,1);
  assert.equal(w.users('Regular User').count,1); assert.equal(w.users('%').count,0); assert.ok(w.audit().count >= 4);
}));
test('catalog changes persist without mutating the reference data and requests retain snapshots', () => fixture((db,create) => {
  const a = create('Manager'), w = db.workspace;
  w.saveCity(a.id,{ id: 'test-city',name: { vi: 'Thành phố thử',en: 'Test City' } });
  w.saveProperty(a.id,{ id: 'hotel',tenPhong: 'Sourced hotel',roomTypes: [] }); w.saveProperty(a.id,{ id: 'hotel',tenPhong: 'Hidden hotel',roomTypes: [] },true);
  assert.equal(w.propertyOverrides().length,1); assert.equal(w.propertyOverrides()[0].archived,true); assert.equal(w.cityOverrides()[0].data.name.en,'Test City');
  const trip = { propertyId: 'hotel',roomTypeId: 'grade',checkin: '2027-01-01',checkout: '2027-01-02',rooms: 1,guests: 1,fullName: 'Guest',email: 'guest@example.test',phone: '+84901234567',message: '' };
  const owner = sessionHash(newSession()), booking = db.create(owner,randomUUID(),trip,{ propertyName: 'Original name' }).booking;
  w.manageBooking(a.id,booking.id,{ stage: 'contacted',note: 'Internal only',cancel: false }); assert.equal(db.get(owner,booking.id).snapshot.propertyName,'Original name');
  assert.equal(w.bookings('Guest').items[0].stage,'contacted'); assert.equal(db.get(owner,booking.id).note,undefined);
  w.manageBooking(a.id,booking.id,{ stage: 'closed',note: 'Cancelled by manager',cancel: true }); assert.equal(db.get(owner,booking.id).status,'cancelled');
}));
test('review and administration text has complete Vietnamese/English parity', () => {
  for (const copy of [reviewCopy,adminCopy]) { assert.deepEqual(Object.keys(copy.vi).sort(),Object.keys(copy.en).sort()); assert.deepEqual(Object.keys(copy.vi.errors).sort(),Object.keys(copy.en.errors).sort()); }
  assert.deepEqual(Object.keys(adminCopy.vi.actionNames).sort(),Object.keys(adminCopy.en.actionNames).sort());
});
test('backup CLI produces a consistent snapshot including WAL changes and refuses overwrite', () => fixture(async (db,create,source) => {
  const account = create('Backup account'); const target = join(tmpdir(),`tnbnb-backup-${randomUUID()}.sqlite`);
  try {
    const result = spawnSync(process.execPath,['scripts/backup-db.mjs','--output',target],{ env: { ...process.env,TNB_BOOKINGS_DB_PATH: source },encoding: 'utf8',windowsHide: true });
    assert.equal(result.status,0,result.stderr); const copy = new DatabaseSync(target,{ readOnly: true });
    try { assert.equal(copy.prepare('SELECT name FROM accounts WHERE id=?').get(account.id).name,'Backup account'); assert.equal(copy.prepare('PRAGMA quick_check').get().quick_check,'ok'); } finally { copy.close(); }
    const duplicate = spawnSync(process.execPath,['scripts/backup-db.mjs','--output',target],{ env: { ...process.env,TNB_BOOKINGS_DB_PATH: source },encoding: 'utf8',windowsHide: true }); assert.equal(duplicate.status,1);
  } finally { for (const suffix of ['', '-wal', '-shm']) await unlink(target+suffix).catch(() => {}); }
}));
