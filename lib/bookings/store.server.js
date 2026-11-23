import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createAccountStore } from '../auth/store.server.js';
import { createWorkspaceStore } from '../workspace/store.server.js';

export const bookingCookie = 'tnbnb-booking-session';
export const sessionLifetime = 60 * 60 * 24 * 180;
export function sessionHash(token) { return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? createHash('sha256').update(token).digest('hex') : null; }
export function newSession() { return randomBytes(32).toString('hex'); }

export function openBookingStore(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, owner TEXT NOT NULL,
      request_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
      property_id TEXT NOT NULL, room_type_id TEXT NOT NULL,
      checkin TEXT NOT NULL, checkout TEXT NOT NULL, guests INTEGER NOT NULL, rooms INTEGER NOT NULL,
      full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, message TEXT NOT NULL,
      snapshot TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','cancelled')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, cancelled_at TEXT,
      UNIQUE(owner, request_key)
    );
    CREATE INDEX IF NOT EXISTS bookings_owner ON bookings(owner, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_duplicate ON bookings(owner,property_id,room_type_id,checkin,checkout,guests,rooms) WHERE status='pending';`);
  const accounts = createAccountStore(db);
  const workspace = createWorkspaceStore(db);
  const accountId = owner => owner.startsWith('account:') ? owner.slice(8) : '';
  const owned = '(owner=? OR owner IN (SELECT guest_owner FROM booking_claims WHERE account_id=?))';
  const decode = row => row ? { id: row.id, reference: row.reference, propertyId: row.property_id, roomTypeId: row.room_type_id,
    checkin: row.checkin, checkout: row.checkout, guests: row.guests, rooms: row.rooms,
    fullName: row.full_name, email: row.email, phone: row.phone, message: row.message,
    snapshot: JSON.parse(row.snapshot), status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, cancelledAt: row.cancelled_at } : null;
  function get(owner, id) { return decode(db.prepare(`SELECT * FROM bookings WHERE ${owned} AND id=?`).get(owner, accountId(owner), id)); }
  return {
    close: () => db.close(),
    health: () => db.prepare('SELECT 1 AS ok').get().ok === 1,
    accounts,
    workspace,
    get,
    list: owner => db.prepare(`SELECT * FROM bookings WHERE ${owned} ORDER BY created_at DESC`).all(owner, accountId(owner)).map(decode),
    create(owner, key, trip, snapshot) {
      const fingerprint = createHash('sha256').update(JSON.stringify(trip)).digest('hex');
      db.exec('BEGIN IMMEDIATE');
      try {
        const prior = db.prepare(`SELECT * FROM bookings WHERE ${owned} AND request_key=?`).get(owner, accountId(owner), key);
        if (prior) {
          if (prior.fingerprint !== fingerprint) { db.exec('ROLLBACK'); return { error: 'request_changed' }; }
          db.exec('COMMIT'); return { booking: decode(prior), replay: true };
        }
        const duplicate = db.prepare(`SELECT * FROM bookings WHERE ${owned} AND property_id=? AND room_type_id=? AND checkin=? AND checkout=? AND guests=? AND rooms=? AND status='pending'`).get(owner, accountId(owner), trip.propertyId, trip.roomTypeId, trip.checkin, trip.checkout, trip.guests, trip.rooms);
        if (duplicate) { db.exec('COMMIT'); return { error: 'duplicate', existingId: duplicate.id }; }
        const id = randomUUID(), reference = `TN-${randomBytes(5).toString('hex').toUpperCase()}`, now = new Date().toISOString();
        db.prepare('INSERT INTO bookings(id,reference,owner,request_key,fingerprint,property_id,room_type_id,checkin,checkout,guests,rooms,full_name,email,phone,message,snapshot,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, reference, owner, key, fingerprint, trip.propertyId, trip.roomTypeId, trip.checkin, trip.checkout, trip.guests, trip.rooms, trip.fullName, trip.email, trip.phone, trip.message, JSON.stringify(snapshot), 'pending', now, now);
        db.exec('COMMIT'); return { booking: get(owner, id), replay: false };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    cancel(owner, id) {
      const now = new Date().toISOString();
      db.prepare(`UPDATE bookings SET status='cancelled',updated_at=?,cancelled_at=? WHERE ${owned} AND id=? AND status='pending'`).run(now, now, owner, accountId(owner), id);
      return get(owner, id);
    },
  };
}

let store;
export function bookingStore() {
  if (!store) store = openBookingStore(resolve(/*turbopackIgnore: true*/ process.env.TNB_BOOKINGS_DB_PATH || '.data/tnbnb-bookings.sqlite'));
  return store;
}
