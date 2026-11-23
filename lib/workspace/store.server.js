import { randomUUID } from 'node:crypto';

export function createWorkspaceStore(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY, property_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES accounts(id),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden','deleted')),
    moderation_reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE(property_id,account_id)
  );
  CREATE INDEX IF NOT EXISTS reviews_property ON reviews(property_id,status,created_at DESC);
  CREATE TABLE IF NOT EXISTS catalog_properties (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS catalog_cities (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS booking_operations (booking_id TEXT PRIMARY KEY REFERENCES bookings(id), stage TEXT NOT NULL DEFAULT 'new', note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS admin_audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES accounts(id), action TEXT NOT NULL, entity_id TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS admin_audit_date ON admin_audit(created_at DESC);`);
  const now = () => new Date().toISOString();
  const review = row => row ? { id: row.id, propertyId: row.property_id, name: row.name, rating: row.rating, body: row.body, status: row.status, moderationReason: row.moderation_reason, createdAt: row.created_at, updatedAt: row.updated_at } : null;
  function audit(actor, action, entity, details = {}) { db.prepare('INSERT INTO admin_audit VALUES(?,?,?,?,?,?)').run(randomUUID(), actor, action, entity, JSON.stringify(details), now()); }
  function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } }
  const assert = (condition, code) => { if (!condition) { const error = new Error(code); error.code = code; throw error; } };
  const reviewSelect = 'SELECT r.*,a.name FROM reviews r JOIN accounts a ON a.id=r.account_id';
  const search = value => `%${String(value || '').replace(/[\\%_]/g, '\\$&')}%`;
  return {
    reviewList(propertyId, page = 1, order = 'newest') {
      const where = "r.property_id=? AND r.status='published' AND a.disabled=0";
      const count = db.prepare(`SELECT COUNT(*) AS count FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where}`).get(propertyId).count;
      const summary = db.prepare(`SELECT COUNT(*) AS count,ROUND(AVG(r.rating),1) AS average FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where}`).get(propertyId);
      const histogram = db.prepare(`SELECT r.rating,COUNT(*) AS count FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where} GROUP BY r.rating`).all(propertyId).map(row => ({ ...row }));
      const sorting = order === 'highest' ? 'r.rating DESC,r.created_at DESC' : order === 'lowest' ? 'r.rating ASC,r.created_at DESC' : 'r.created_at DESC';
      return { items: db.prepare(`${reviewSelect} WHERE ${where} ORDER BY ${sorting} LIMIT 10 OFFSET ?`).all(propertyId,(page-1)*10).map(row => { const value = review(row); delete value.status; delete value.moderationReason; return value; }), count, page, pages: Math.max(1, Math.ceil(count/10)), summary: { ...summary, histogram } };
    },
    ownReview: (accountId, propertyId) => review(db.prepare(`${reviewSelect} WHERE r.account_id=? AND r.property_id=? AND r.status!='deleted'`).get(accountId,propertyId)),
    saveReview(accountId, propertyId, { rating, body }, editing = false) {
      return transaction(() => {
        const prior = db.prepare('SELECT * FROM reviews WHERE account_id=? AND property_id=?').get(accountId,propertyId);
        if (editing) assert(prior && prior.status !== 'deleted', 'not_found'); else assert(!prior || prior.status === 'deleted', 'review_exists');
        if (prior) db.prepare("UPDATE reviews SET rating=?,body=?,status=CASE WHEN status='hidden' THEN 'hidden' ELSE 'published' END,moderation_reason=CASE WHEN status='deleted' THEN '' ELSE moderation_reason END,created_at=CASE WHEN status='deleted' THEN ? ELSE created_at END,updated_at=? WHERE id=?").run(rating,body,now(),now(),prior.id);
        else db.prepare('INSERT INTO reviews(id,property_id,account_id,rating,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),propertyId,accountId,rating,body,now(),now());
        return this.ownReview(accountId,propertyId);
      });
    },
    deleteReview(accountId, propertyId) { db.prepare("UPDATE reviews SET status='deleted',body='',moderation_reason='',updated_at=? WHERE account_id=? AND property_id=? AND status!='deleted'").run(now(),accountId,propertyId); },
    propertyOverrides: () => db.prepare('SELECT * FROM catalog_properties').all().map(row => ({ id: row.id, data: JSON.parse(row.data), archived: Boolean(row.archived), updatedAt: row.updated_at })),
    cityOverrides: () => db.prepare('SELECT * FROM catalog_cities').all().map(row => ({ id: row.id, data: JSON.parse(row.data), archived: Boolean(row.archived), updatedAt: row.updated_at })),
    saveProperty(actor, property, archived = false) { return transaction(() => { db.prepare('INSERT INTO catalog_properties(id,data,archived,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,archived=excluded.archived,updated_at=excluded.updated_at').run(property.id,JSON.stringify(property),Number(archived),now()); audit(actor,archived ? 'property.archive' : 'property.save',property.id,{ name: property.tenPhong }); }); },
    saveCity(actor, city, archived = false) { return transaction(() => { db.prepare('INSERT INTO catalog_cities(id,data,archived,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,archived=excluded.archived,updated_at=excluded.updated_at').run(city.id,JSON.stringify(city),Number(archived),now()); audit(actor,archived ? 'city.archive' : 'city.save',city.id,{ name: city.name }); }); },
    stats() { return { users: db.prepare('SELECT COUNT(*) AS count FROM accounts').get().count, activeUsers: db.prepare('SELECT COUNT(*) AS count FROM accounts WHERE disabled=0').get().count, bookings: db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count, pendingBookings: db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status='pending'").get().count, reviews: db.prepare("SELECT COUNT(*) AS count FROM reviews WHERE status!='deleted'").get().count, hiddenReviews: db.prepare("SELECT COUNT(*) AS count FROM reviews WHERE status='hidden'").get().count }; },
    users(query = '', page = 1) {
      const where = "name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\'"; const params = [search(query),search(query)];
      return { items: db.prepare(`SELECT id,email,name,phone,role,disabled,created_at AS createdAt FROM accounts WHERE ${where} ORDER BY created_at DESC LIMIT 20 OFFSET ?`).all(...params,(page-1)*20), count: db.prepare(`SELECT COUNT(*) AS count FROM accounts WHERE ${where}`).get(...params).count };
    },
    manageUser(actor, id, role, disabled) { return transaction(() => {
      const prior = db.prepare('SELECT id,role,disabled FROM accounts WHERE id=?').get(id); assert(prior,'not_found');
      assert(actor !== id,'self_change');
      const activeAdmins = db.prepare("SELECT COUNT(*) AS count FROM accounts WHERE role='admin' AND disabled=0").get().count;
      assert(!(prior.role === 'admin' && !prior.disabled && (role !== 'admin' || disabled) && activeAdmins <= 1),'last_admin');
      db.prepare('UPDATE accounts SET role=?,disabled=?,updated_at=? WHERE id=?').run(role,Number(disabled),now(),id);
      db.prepare('DELETE FROM account_sessions WHERE account_id=?').run(id);
      audit(actor,'user.access',id,{ role,disabled });
    }); },
    bootstrapRole(id, role) { return transaction(() => {
      const prior = db.prepare('SELECT id,role,disabled FROM accounts WHERE id=?').get(id); assert(prior,'not_found');
      assert(!(prior.role === 'admin' && !prior.disabled && role !== 'admin' && db.prepare("SELECT COUNT(*) AS count FROM accounts WHERE role='admin' AND disabled=0").get().count <= 1),'last_admin');
      assert(!prior.disabled,'account_disabled'); db.prepare('UPDATE accounts SET role=?,updated_at=? WHERE id=?').run(role,now(),id); db.prepare('DELETE FROM account_sessions WHERE account_id=?').run(id); audit(id,'user.bootstrap',id,{ role });
    }); },
    bookings(query = '', page = 1) {
      const where = "b.reference LIKE ? ESCAPE '\\' OR b.full_name LIKE ? ESCAPE '\\' OR b.email LIKE ? ESCAPE '\\'"; const params = [search(query),search(query),search(query)];
      return { items: db.prepare(`SELECT b.id,b.reference,b.status,b.checkin,b.checkout,b.rooms,b.guests,b.full_name AS fullName,b.email,b.phone,b.message,b.created_at AS createdAt,b.snapshot,o.stage,o.note FROM bookings b LEFT JOIN booking_operations o ON o.booking_id=b.id WHERE ${where} ORDER BY b.created_at DESC LIMIT 20 OFFSET ?`).all(...params,(page-1)*20).map(row => ({ ...row,snapshot: JSON.parse(row.snapshot),stage: row.stage || 'new',note: row.note || '' })), count: db.prepare(`SELECT COUNT(*) AS count FROM bookings b WHERE ${where}`).get(...params).count };
    },
    manageBooking(actor, id, { stage, note, cancel }) { return transaction(() => {
      const prior = db.prepare('SELECT id,status FROM bookings WHERE id=?').get(id); assert(prior,'not_found');
      if (cancel && prior.status === 'pending') db.prepare("UPDATE bookings SET status='cancelled',cancelled_at=?,updated_at=? WHERE id=?").run(now(),now(),id);
      db.prepare('INSERT INTO booking_operations VALUES(?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET stage=excluded.stage,note=excluded.note,updated_at=excluded.updated_at').run(id,stage,note,now());
      audit(actor,cancel ? 'booking.cancel' : 'booking.update',id,{ stage });
    }); },
    moderation(query = '', page = 1) {
      const where = "r.status!='deleted' AND (a.name LIKE ? ESCAPE '\\' OR r.body LIKE ? ESCAPE '\\' OR r.property_id LIKE ? ESCAPE '\\')"; const params = [search(query),search(query),search(query)];
      return { items: db.prepare(`${reviewSelect} WHERE ${where} ORDER BY r.created_at DESC LIMIT 20 OFFSET ?`).all(...params,(page-1)*20).map(review), count: db.prepare(`SELECT COUNT(*) AS count FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where}`).get(...params).count };
    },
    moderate(actor, id, status, reason) { return transaction(() => {
      const prior = db.prepare("SELECT id,status FROM reviews WHERE id=? AND status!='deleted'").get(id); assert(prior,'not_found');
      db.prepare('UPDATE reviews SET status=?,moderation_reason=?,updated_at=? WHERE id=?').run(status,status === 'hidden' ? reason : '',now(),id); audit(actor,`review.${status}`,id,{ reason });
    }); },
    audit(page = 1) { const rows = db.prepare('SELECT l.*,a.name AS actorName FROM admin_audit l JOIN accounts a ON a.id=l.actor_id ORDER BY l.created_at DESC LIMIT 20 OFFSET ?').all((page-1)*20); return { items: rows.map(row => ({ id: row.id,actorName: row.actorName,action: row.action,entityId: row.entity_id,details: JSON.parse(row.details),createdAt: row.created_at })),count: db.prepare('SELECT COUNT(*) AS count FROM admin_audit').get().count }; },
  };
}
