import { randomUUID } from 'node:crypto';

export function createAccountStore(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL, recovery_hash TEXT NOT NULL,
    avatar BLOB, avatar_version TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS account_sessions (
    token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS account_session_user ON account_sessions(account_id);
  CREATE TABLE IF NOT EXISTS booking_claims (
    guest_owner TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS booking_claim_account ON booking_claims(account_id);
  CREATE TABLE IF NOT EXISTS account_favorites (
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, property_id TEXT NOT NULL,
    created_at TEXT NOT NULL, PRIMARY KEY(account_id,property_id)
  );
  CREATE TABLE IF NOT EXISTS account_attempts (
    scope TEXT NOT NULL, subject TEXT NOT NULL, count INTEGER NOT NULL, started INTEGER NOT NULL,
    PRIMARY KEY(scope,subject)
  );`);
  const columns = db.prepare('PRAGMA table_info(accounts)').all().map(column => column.name);
  if (!columns.includes('role')) db.exec("ALTER TABLE accounts ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin'))");
  if (!columns.includes('disabled')) db.exec('ALTER TABLE accounts ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0');
  const publicUser = row => row ? { id: row.id, email: row.email, name: row.name, phone: row.phone, role: row.role, hasAvatar: Boolean(row.avatar_version), avatarVersion: row.avatar_version, createdAt: row.created_at } : null;
  const byId = id => db.prepare('SELECT * FROM accounts WHERE id=?').get(id);
  return {
    byEmail: email => db.prepare('SELECT * FROM accounts WHERE email=?').get(email),
    credentials: byId,
    publicById: id => publicUser(byId(id)),
    register({ email, name, phone, passwordHash, recoveryHash }) {
      const id = randomUUID(), now = new Date().toISOString();
      try { db.prepare('INSERT INTO accounts(id,email,name,phone,password_hash,recovery_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,email,name,phone,passwordHash,recoveryHash,now,now); }
      catch (error) { if (db.prepare('SELECT id FROM accounts WHERE email=?').get(email)) return null; throw error; }
      return publicUser(byId(id));
    },
    createSession(accountId, hash, expiresAt, guestOwner = null, favoriteIds = []) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('DELETE FROM account_sessions WHERE expires_at<=?').run(Date.now());
        db.prepare('INSERT INTO account_sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)').run(hash,accountId,expiresAt,new Date().toISOString());
        if (guestOwner && db.prepare('SELECT 1 FROM bookings WHERE owner=? LIMIT 1').get(guestOwner)) db.prepare('INSERT OR IGNORE INTO booking_claims(guest_owner,account_id) VALUES(?,?)').run(guestOwner,accountId);
        for (const id of favoriteIds) db.prepare('INSERT OR IGNORE INTO account_favorites(account_id,property_id,created_at) VALUES(?,?,?)').run(accountId,id,new Date().toISOString());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    session(hash) { return publicUser(db.prepare('SELECT a.* FROM accounts a JOIN account_sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>? AND a.disabled=0').get(hash,Date.now())); },
    revokeSession: hash => db.prepare('DELETE FROM account_sessions WHERE token_hash=?').run(hash),
    isClaimed: owner => Boolean(db.prepare('SELECT 1 FROM booking_claims WHERE guest_owner=?').get(owner)),
    updateProfile(id, { name, phone }) { db.prepare('UPDATE accounts SET name=?,phone=?,updated_at=? WHERE id=?').run(name,phone,new Date().toISOString(),id); return publicUser(byId(id)); },
    updatePassword(id, passwordHash, newRecoveryHash = null, expectedRecoveryHash = null) {
      db.exec('BEGIN IMMEDIATE');
      try {
        if (expectedRecoveryHash && byId(id)?.recovery_hash !== expectedRecoveryHash) { db.exec('ROLLBACK'); return false; }
        db.prepare('UPDATE accounts SET password_hash=?,recovery_hash=COALESCE(?,recovery_hash),updated_at=? WHERE id=?').run(passwordHash,newRecoveryHash,new Date().toISOString(),id);
        db.prepare('DELETE FROM account_sessions WHERE account_id=?').run(id);
        db.exec('COMMIT'); return true;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    rotateRecovery(id, hash) { db.prepare('UPDATE accounts SET recovery_hash=?,updated_at=? WHERE id=?').run(hash,new Date().toISOString(),id); },
    setAvatar(id, bytes) { db.prepare('UPDATE accounts SET avatar=?,avatar_version=?,updated_at=? WHERE id=?').run(bytes,randomUUID(),new Date().toISOString(),id); return publicUser(byId(id)); },
    removeAvatar(id) { db.prepare('UPDATE accounts SET avatar=NULL,avatar_version=NULL,updated_at=? WHERE id=?').run(new Date().toISOString(),id); return publicUser(byId(id)); },
    avatar: id => db.prepare('SELECT avatar FROM accounts WHERE id=?').get(id)?.avatar,
    favorites: id => db.prepare('SELECT property_id FROM account_favorites WHERE account_id=? ORDER BY created_at DESC').all(id).map(row => row.property_id),
    saveFavorite(id, propertyId, saved) {
      if (saved) db.prepare('INSERT OR IGNORE INTO account_favorites(account_id,property_id,created_at) VALUES(?,?,?)').run(id,propertyId,new Date().toISOString());
      else db.prepare('DELETE FROM account_favorites WHERE account_id=? AND property_id=?').run(id,propertyId);
      return this.favorites(id);
    },
    allowed(scope, subject) { const row = db.prepare('SELECT * FROM account_attempts WHERE scope=? AND subject=?').get(scope,subject); return !row || Date.now()-row.started > 15*60*1000 || row.count < 8; },
    failure(scope, subject) {
      const now = Date.now();
      db.prepare('INSERT INTO account_attempts(scope,subject,count,started) VALUES(?,?,1,?) ON CONFLICT(scope,subject) DO UPDATE SET count=CASE WHEN ?>account_attempts.started+900000 THEN 1 ELSE account_attempts.count+1 END,started=CASE WHEN ?>account_attempts.started+900000 THEN ? ELSE account_attempts.started END').run(scope,subject,now,now,now,now);
    },
    clearFailures: (scope, subject) => db.prepare('DELETE FROM account_attempts WHERE scope=? AND subject=?').run(scope,subject),
  };
}
