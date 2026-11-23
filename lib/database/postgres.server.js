import pg from 'pg';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const postgresSchema = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL, recovery_hash TEXT NOT NULL, avatar BYTEA, avatar_version TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), disabled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS account_session_user ON account_sessions(account_id);
CREATE TABLE IF NOT EXISTS booking_claims (guest_owner TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS booking_claim_account ON booking_claims(account_id);
CREATE TABLE IF NOT EXISTS account_favorites (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, property_id TEXT NOT NULL,
  created_at TEXT NOT NULL, PRIMARY KEY(account_id,property_id)
);
CREATE TABLE IF NOT EXISTS account_attempts (scope TEXT NOT NULL, subject TEXT NOT NULL, count INTEGER NOT NULL, started BIGINT NOT NULL, PRIMARY KEY(scope,subject));
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, owner TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
  property_id TEXT NOT NULL, room_type_id TEXT NOT NULL, checkin TEXT NOT NULL, checkout TEXT NOT NULL,
  guests INTEGER NOT NULL, rooms INTEGER NOT NULL, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, message TEXT NOT NULL,
  snapshot TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','cancelled')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, cancelled_at TEXT, UNIQUE(owner,request_key)
);
CREATE INDEX IF NOT EXISTS bookings_owner ON bookings(owner,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_duplicate ON bookings(owner,property_id,room_type_id,checkin,checkout,guests,rooms) WHERE status='pending';
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, property_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES accounts(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden','deleted')),
  moderation_reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(property_id,account_id)
);
CREATE INDEX IF NOT EXISTS reviews_property ON reviews(property_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS catalog_properties (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_cities (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS booking_operations (booking_id TEXT PRIMARY KEY REFERENCES bookings(id), stage TEXT NOT NULL DEFAULT 'new', note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES accounts(id), action TEXT NOT NULL, entity_id TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS admin_audit_date ON admin_audit(created_at DESC);
`;
const now = () => new Date().toISOString();
const assert = (condition, code) => { if (!condition) throw Object.assign(new Error(code), { code }); };
const publicUser = r => r ? { id: r.id,email: r.email,name: r.name,phone: r.phone,role: r.role,hasAvatar: Boolean(r.avatar_version),avatarVersion: r.avatar_version,createdAt: r.created_at } : null;
const booking = r => r ? { id: r.id,reference: r.reference,propertyId: r.property_id,roomTypeId: r.room_type_id,checkin: r.checkin,checkout: r.checkout,guests: r.guests,rooms: r.rooms,fullName: r.full_name,email: r.email,phone: r.phone,message: r.message,snapshot: JSON.parse(r.snapshot),status: r.status,createdAt: r.created_at,updatedAt: r.updated_at,cancelledAt: r.cancelled_at } : null;
const review = r => r ? { id: r.id,propertyId: r.property_id,name: r.name,rating: r.rating,body: r.body,status: r.status,moderationReason: r.moderation_reason,createdAt: r.created_at,updatedAt: r.updated_at } : null;
const search = text => `%${String(text || '').replace(/[\\%_]/g,'\\$&')}%`;
const accountId = owner => owner.startsWith('account:') ? owner.slice(8) : '';
const owned = '(owner=$1 OR owner IN (SELECT guest_owner FROM booking_claims WHERE account_id=$2))';
const reviewSelect = 'SELECT r.*,a.name FROM reviews r JOIN accounts a ON a.id=r.account_id';

// All statements in a transaction use one checked-out client. Advisory locks
// serialize related writes across independent Vercel instances, not just locally.
export function openPostgresStore(connectionString, { schema = 'public', max = 4 } = {}) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw new Error('Invalid database schema');
  const connection = new URL(connectionString);
  if (!['localhost','127.0.0.1','[::1]'].includes(connection.hostname)) connection.searchParams.set('sslmode','verify-full');
  const pool = new pg.Pool({ connectionString: connection.toString(),max,idleTimeoutMillis: 10000,connectionTimeoutMillis: 12000,allowExitOnIdle: true });
  pool.on('error', () => { /* A later query reconnects; never log connection credentials. */ });
  let initialization;
  async function ready() {
    if (!initialization) initialization = (async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN'); await client.query('SELECT pg_advisory_xact_lock(8675310)');
        if (schema !== 'public') await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        await client.query(`SET LOCAL search_path TO "${schema}", public`);
        await client.query(postgresSchema); await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
      finally { client.release(); }
    })().catch(error => { initialization = undefined; throw error; });
    return initialization;
  }
  async function query(sql, params = [], client = null) {
    if (client) return (await client.query(sql,params)).rows;
    await ready();
    if (schema === 'public') return (await pool.query(sql,params)).rows;
    const isolated = await pool.connect();
    try {
      await isolated.query('BEGIN'); await isolated.query(`SET LOCAL search_path TO "${schema}", public`);
      const result = await isolated.query(sql,params); await isolated.query('COMMIT'); return result.rows;
    } catch (error) { await isolated.query('ROLLBACK').catch(() => {}); throw error; }
    finally { isolated.release(); }
  }
  async function one(sql, params = [], client = null) { return (await query(sql,params,client))[0]; }
  async function transaction(lock, fn) {
    await ready(); const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL search_path TO "${schema}", public`);
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[lock]);
      const result = await fn(client); await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  const byId = (id, client) => one('SELECT * FROM accounts WHERE id=$1',[id],client);
  const audit = (client, actor, action, entity, details = {}) => query('INSERT INTO admin_audit VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),actor,action,entity,JSON.stringify(details),now()],client);
  const get = async (owner, id, client) => booking(await one(`SELECT * FROM bookings WHERE ${owned} AND id=$3`,[owner,accountId(owner),id],client));
  const ownReview = async (id, propertyId, client) => review(await one(`${reviewSelect} WHERE r.account_id=$1 AND r.property_id=$2 AND r.status!='deleted'`,[id,propertyId],client));
  const adminWrite = (actor, lock, fn) => transaction(lock,async client => {
    const user = await one("SELECT id FROM accounts WHERE id=$1 AND role='admin' AND disabled=0 FOR SHARE",[actor],client);
    assert(user,'forbidden'); return fn(client);
  });
  const accounts = {
    byEmail: email => one('SELECT * FROM accounts WHERE email=$1',[email]),
    credentials: byId,
    publicById: async id => publicUser(await byId(id)),
    async register({ email,name,phone,passwordHash,recoveryHash }) {
      return publicUser(await one('INSERT INTO accounts(id,email,name,phone,password_hash,recovery_hash,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(email) DO NOTHING RETURNING *',[randomUUID(),email,name,phone,passwordHash,recoveryHash,now(),now()]));
    },
    createSession: (id,hash,expires,guest = null,favorites = []) => transaction(`account:${id}`,async client => {
      const user = await one('SELECT id FROM accounts WHERE id=$1 AND disabled=0 FOR UPDATE',[id],client); assert(user,'unauthorized');
      await query('DELETE FROM account_sessions WHERE expires_at<=$1',[Date.now()],client);
      await query('INSERT INTO account_sessions VALUES($1,$2,$3,$4)',[hash,id,expires,now()],client);
      if (guest) await query('INSERT INTO booking_claims(guest_owner,account_id) SELECT $1,$2 WHERE EXISTS(SELECT 1 FROM bookings WHERE owner=$1) ON CONFLICT(guest_owner) DO NOTHING',[guest,id],client);
      for (const property of favorites) await query('INSERT INTO account_favorites VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,property,now()],client);
    }),
    session: async hash => publicUser(await one('SELECT a.* FROM accounts a JOIN account_sessions s ON s.account_id=a.id WHERE s.token_hash=$1 AND s.expires_at>$2 AND a.disabled=0',[hash,Date.now()])),
    revokeSession: hash => query('DELETE FROM account_sessions WHERE token_hash=$1',[hash]),
    isClaimed: async owner => Boolean(await one('SELECT 1 FROM booking_claims WHERE guest_owner=$1',[owner])),
    updateProfile: async (id,{ name,phone }) => publicUser(await one('UPDATE accounts SET name=$1,phone=$2,updated_at=$3 WHERE id=$4 RETURNING *',[name,phone,now(),id])),
    updatePassword: (id,hash,recovery = null,expected = null) => transaction(`account:${id}`,async client => {
      const user = await one('SELECT recovery_hash FROM accounts WHERE id=$1 FOR UPDATE',[id],client);
      if (!user || expected && user.recovery_hash !== expected) return false;
      await query('UPDATE accounts SET password_hash=$1,recovery_hash=COALESCE($2,recovery_hash),updated_at=$3 WHERE id=$4',[hash,recovery,now(),id],client);
      await query('DELETE FROM account_sessions WHERE account_id=$1',[id],client); return true;
    }),
    rotateRecovery: (id,hash) => query('UPDATE accounts SET recovery_hash=$1,updated_at=$2 WHERE id=$3',[hash,now(),id]),
    setAvatar: async (id,bytes) => publicUser(await one('UPDATE accounts SET avatar=$1,avatar_version=$2,updated_at=$3 WHERE id=$4 RETURNING *',[Buffer.from(bytes),randomUUID(),now(),id])),
    removeAvatar: async id => publicUser(await one('UPDATE accounts SET avatar=NULL,avatar_version=NULL,updated_at=$1 WHERE id=$2 RETURNING *',[now(),id])),
    avatar: async id => (await one('SELECT avatar FROM accounts WHERE id=$1',[id]))?.avatar,
    favorites: async id => (await query('SELECT property_id FROM account_favorites WHERE account_id=$1 ORDER BY created_at DESC',[id])).map(r=>r.property_id),
    async saveFavorite(id,property,saved) {
      if (saved) await query('INSERT INTO account_favorites VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,property,now()]);
      else await query('DELETE FROM account_favorites WHERE account_id=$1 AND property_id=$2',[id,property]);
      return this.favorites(id);
    },
    async allowed(scope,subject) { const r=await one('SELECT count,started FROM account_attempts WHERE scope=$1 AND subject=$2',[scope,subject]); return !r || Date.now()-Number(r.started)>900000 || r.count<8; },
    failure: (scope,subject) => query('INSERT INTO account_attempts VALUES($1,$2,1,$3) ON CONFLICT(scope,subject) DO UPDATE SET count=CASE WHEN EXCLUDED.started>account_attempts.started+900000 THEN 1 ELSE account_attempts.count+1 END,started=CASE WHEN EXCLUDED.started>account_attempts.started+900000 THEN EXCLUDED.started ELSE account_attempts.started END',[scope,subject,Date.now()]),
    clearFailures: (scope,subject) => query('DELETE FROM account_attempts WHERE scope=$1 AND subject=$2',[scope,subject]),
  };
  const workspace = {
    async reviewList(propertyId,page=1,order='newest') {
      const where="r.property_id=$1 AND r.status='published' AND a.disabled=0";
      const summary=await one(`SELECT COUNT(*)::int AS count,ROUND(AVG(r.rating),1)::float8 AS average FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where}`,[propertyId]);
      const histogram=await query(`SELECT r.rating,COUNT(*)::int AS count FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where} GROUP BY r.rating`,[propertyId]);
      const sorting=order==='highest'?'r.rating DESC,r.created_at DESC':order==='lowest'?'r.rating ASC,r.created_at DESC':'r.created_at DESC';
      const items=(await query(`${reviewSelect} WHERE ${where} ORDER BY ${sorting} LIMIT 10 OFFSET $2`,[propertyId,(page-1)*10])).map(r=>{const item=review(r);delete item.status;delete item.moderationReason;return item;});
      return { items,count:summary.count,page,pages:Math.max(1,Math.ceil(summary.count/10)),summary:{...summary,histogram} };
    },
    ownReview,
    saveReview: (id,property,{rating,body},editing=false) => transaction(`review:${id}:${property}`,async client => {
      assert(await one('SELECT id FROM accounts WHERE id=$1 AND disabled=0 FOR SHARE',[id],client),'unauthorized');
      const prior=await one('SELECT * FROM reviews WHERE account_id=$1 AND property_id=$2 FOR UPDATE',[id,property],client);
      if(editing)assert(prior&&prior.status!=='deleted','not_found');else assert(!prior||prior.status==='deleted','review_exists');
      if(prior)await query("UPDATE reviews SET rating=$1,body=$2,status=CASE WHEN status='hidden' THEN 'hidden' ELSE 'published' END,moderation_reason=CASE WHEN status='deleted' THEN '' ELSE moderation_reason END,created_at=CASE WHEN status='deleted' THEN $3 ELSE created_at END,updated_at=$4 WHERE id=$5",[rating,body,now(),now(),prior.id],client);
      else await query('INSERT INTO reviews(id,property_id,account_id,rating,body,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),property,id,rating,body,now(),now()],client);
      return ownReview(id,property,client);
    }),
    deleteReview: (id,property) => query("UPDATE reviews SET status='deleted',body='',moderation_reason='',updated_at=$1 WHERE account_id=$2 AND property_id=$3 AND status!='deleted'",[now(),id,property]),
    propertyOverrides: async () => (await query('SELECT * FROM catalog_properties')).map(r=>({id:r.id,data:JSON.parse(r.data),archived:Boolean(r.archived),updatedAt:r.updated_at})),
    cityOverrides: async () => (await query('SELECT * FROM catalog_cities')).map(r=>({id:r.id,data:JSON.parse(r.data),archived:Boolean(r.archived),updatedAt:r.updated_at})),
    saveProperty: (actor,property,archived=false) => adminWrite(actor,`property:${property.id}`,async client => {
      await query('INSERT INTO catalog_properties VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,archived=EXCLUDED.archived,updated_at=EXCLUDED.updated_at',[property.id,JSON.stringify(property),Number(archived),now()],client);
      await audit(client,actor,archived?'property.archive':'property.save',property.id,{name:property.tenPhong});
    }),
    saveCity: (actor,city,archived=false) => adminWrite(actor,`city:${city.id}`,async client => {
      await query('INSERT INTO catalog_cities VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,archived=EXCLUDED.archived,updated_at=EXCLUDED.updated_at',[city.id,JSON.stringify(city),Number(archived),now()],client);
      await audit(client,actor,archived?'city.archive':'city.save',city.id,{name:city.name});
    }),
    async stats() { return one(`SELECT (SELECT COUNT(*)::int FROM accounts) AS users,(SELECT COUNT(*)::int FROM accounts WHERE disabled=0) AS "activeUsers",(SELECT COUNT(*)::int FROM bookings) AS bookings,(SELECT COUNT(*)::int FROM bookings WHERE status='pending') AS "pendingBookings",(SELECT COUNT(*)::int FROM reviews WHERE status!='deleted') AS reviews,(SELECT COUNT(*)::int FROM reviews WHERE status='hidden') AS "hiddenReviews"`); },
    async users(q='',page=1) {
      const params=[search(q)],where="name ILIKE $1 ESCAPE '\\' OR email ILIKE $1 ESCAPE '\\'";
      return {items:await query(`SELECT id,email,name,phone,role,disabled,created_at AS "createdAt" FROM accounts WHERE ${where} ORDER BY created_at DESC LIMIT 20 OFFSET $2`,[...params,(page-1)*20]),count:(await one(`SELECT COUNT(*)::int AS count FROM accounts WHERE ${where}`,params)).count};
    },
    manageUser: (actor,id,role,disabled) => adminWrite(actor,'tnbnb:roles',async client => {
      assert(actor!==id,'self_change');const prior=await one('SELECT role,disabled FROM accounts WHERE id=$1 FOR UPDATE',[id],client);assert(prior,'not_found');
      const admins=(await one("SELECT COUNT(*)::int AS count FROM accounts WHERE role='admin' AND disabled=0",[],client)).count;
      assert(!(prior.role==='admin'&&!prior.disabled&&(role!=='admin'||disabled)&&admins<=1),'last_admin');
      await query('UPDATE accounts SET role=$1,disabled=$2,updated_at=$3 WHERE id=$4',[role,Number(disabled),now(),id],client);
      await query('DELETE FROM account_sessions WHERE account_id=$1',[id],client);await audit(client,actor,'user.access',id,{role,disabled});
    }),
    bootstrapRole: (id,role) => transaction('tnbnb:roles',async client => {
      const prior=await one('SELECT role,disabled FROM accounts WHERE id=$1 FOR UPDATE',[id],client);assert(prior,'not_found');assert(!prior.disabled,'account_disabled');
      const admins=(await one("SELECT COUNT(*)::int AS count FROM accounts WHERE role='admin' AND disabled=0",[],client)).count;
      assert(!(prior.role==='admin'&&role!=='admin'&&admins<=1),'last_admin');
      await query('UPDATE accounts SET role=$1,updated_at=$2 WHERE id=$3',[role,now(),id],client);await query('DELETE FROM account_sessions WHERE account_id=$1',[id],client);await audit(client,id,'user.bootstrap',id,{role});
    }),
    async bookings(q='',page=1) {
      const where="b.reference ILIKE $1 ESCAPE '\\' OR b.full_name ILIKE $1 ESCAPE '\\' OR b.email ILIKE $1 ESCAPE '\\'";
      const items=await query(`SELECT b.id,b.reference,b.status,b.checkin,b.checkout,b.rooms,b.guests,b.full_name AS "fullName",b.email,b.phone,b.message,b.created_at AS "createdAt",b.snapshot,o.stage,o.note FROM bookings b LEFT JOIN booking_operations o ON o.booking_id=b.id WHERE ${where} ORDER BY b.created_at DESC LIMIT 20 OFFSET $2`,[search(q),(page-1)*20]);
      return {items:items.map(r=>({...r,snapshot:JSON.parse(r.snapshot),stage:r.stage||'new',note:r.note||''})),count:(await one(`SELECT COUNT(*)::int AS count FROM bookings b WHERE ${where}`,[search(q)])).count};
    },
    manageBooking: (actor,id,{stage,note,cancel}) => adminWrite(actor,`booking:${id}`,async client => {
      const prior=await one('SELECT status FROM bookings WHERE id=$1 FOR UPDATE',[id],client);assert(prior,'not_found');
      if(cancel&&prior.status==='pending')await query("UPDATE bookings SET status='cancelled',cancelled_at=$1,updated_at=$2 WHERE id=$3",[now(),now(),id],client);
      await query('INSERT INTO booking_operations VALUES($1,$2,$3,$4) ON CONFLICT(booking_id) DO UPDATE SET stage=EXCLUDED.stage,note=EXCLUDED.note,updated_at=EXCLUDED.updated_at',[id,stage,note,now()],client);await audit(client,actor,cancel?'booking.cancel':'booking.update',id,{stage});
    }),
    async moderation(q='',page=1) {
      const where="r.status!='deleted' AND (a.name ILIKE $1 ESCAPE '\\' OR r.body ILIKE $1 ESCAPE '\\' OR r.property_id ILIKE $1 ESCAPE '\\')";
      return {items:(await query(`${reviewSelect} WHERE ${where} ORDER BY r.created_at DESC LIMIT 20 OFFSET $2`,[search(q),(page-1)*20])).map(review),count:(await one(`SELECT COUNT(*)::int AS count FROM reviews r JOIN accounts a ON a.id=r.account_id WHERE ${where}`,[search(q)])).count};
    },
    moderate: (actor,id,status,reason) => adminWrite(actor,`moderate:${id}`,async client => {
      assert(await one("SELECT id FROM reviews WHERE id=$1 AND status!='deleted' FOR UPDATE",[id],client),'not_found');
      await query('UPDATE reviews SET status=$1,moderation_reason=$2,updated_at=$3 WHERE id=$4',[status,status==='hidden'?reason:'',now(),id],client);await audit(client,actor,`review.${status}`,id,{reason});
    }),
    async audit(page=1) {
      const rows=await query('SELECT l.*,a.name AS "actorName" FROM admin_audit l JOIN accounts a ON a.id=l.actor_id ORDER BY l.created_at DESC LIMIT 20 OFFSET $1',[(page-1)*20]);
      return {items:rows.map(r=>({id:r.id,actorName:r.actorName,action:r.action,entityId:r.entity_id,details:JSON.parse(r.details),createdAt:r.created_at})),count:(await one('SELECT COUNT(*)::int AS count FROM admin_audit')).count};
    },
  };
  return {
    accounts,workspace,close:()=>pool.end(),health:async()=>(await one('SELECT 1 AS ok')).ok===1,get,
    list:async owner=>(await query(`SELECT * FROM bookings WHERE ${owned} ORDER BY created_at DESC`,[owner,accountId(owner)])).map(booking),
    create:(owner,key,trip,snapshot)=>transaction(`owner:${owner}`,async client=>{
      const fingerprint=createHash('sha256').update(JSON.stringify(trip)).digest('hex');
      const prior=await one(`SELECT * FROM bookings WHERE ${owned} AND request_key=$3`,[owner,accountId(owner),key],client);
      if(prior)return prior.fingerprint!==fingerprint?{error:'request_changed'}:{booking:booking(prior),replay:true};
      const duplicate=await one(`SELECT * FROM bookings WHERE ${owned} AND property_id=$3 AND room_type_id=$4 AND checkin=$5 AND checkout=$6 AND guests=$7 AND rooms=$8 AND status='pending'`,[owner,accountId(owner),trip.propertyId,trip.roomTypeId,trip.checkin,trip.checkout,trip.guests,trip.rooms],client);
      if(duplicate)return {error:'duplicate',existingId:duplicate.id};
      const id=randomUUID(),reference=`TN-${randomBytes(5).toString('hex').toUpperCase()}`;
      await query('INSERT INTO bookings(id,reference,owner,request_key,fingerprint,property_id,room_type_id,checkin,checkout,guests,rooms,full_name,email,phone,message,snapshot,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)',[id,reference,owner,key,fingerprint,trip.propertyId,trip.roomTypeId,trip.checkin,trip.checkout,trip.guests,trip.rooms,trip.fullName,trip.email,trip.phone,trip.message,JSON.stringify(snapshot),'pending',now(),now()],client);
      return {booking:await get(owner,id,client),replay:false};
    }),
    async cancel(owner,id) {await query(`UPDATE bookings SET status='cancelled',updated_at=$3,cancelled_at=$3 WHERE ${owned} AND id=$4 AND status='pending'`,[owner,accountId(owner),now(),id]);return get(owner,id);},
  };
}
