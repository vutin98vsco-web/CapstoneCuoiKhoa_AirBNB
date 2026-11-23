import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
const ddl = `CREATE TABLE IF NOT EXISTS account_email_tokens (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, purpose TEXT NOT NULL, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS account_email_verified (account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, verified_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS email_outbox (id TEXT PRIMARY KEY, job_key TEXT UNIQUE NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lease TEXT, locked_until BIGINT NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`;
export function createEmailStore({ filename, connectionString, schema = 'public' }) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw Error('Invalid database schema');
  let db,
    pool,
    initialization,
    chain = Promise.resolve();
  if (connectionString) {
    const url = new URL(connectionString);
    if (!['localhost', '127.0.0.1'].includes(url.hostname))
      url.searchParams.set('sslmode', 'verify-full');
    pool = new pg.Pool({
      connectionString: url.toString(),
      max: 2,
      connectionTimeoutMillis: 12000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    pool.on('error', () => {});
  } else {
    db = new DatabaseSync(filename);
    db.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  }
  function sqlite(sql, params) {
    const ordered = [];
    const statement = db.prepare(
      sql.replace(/\$(\d+)/g, (_, n) => {
        ordered.push(params[Number(n) - 1]);
        return '?';
      }),
    );
    return statement.all(...ordered);
  }
  async function transaction(work) {
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL search_path TO "${schema}", public`);
        const result = await work((sql, p = []) => client.query(sql, p).then((r) => r.rows));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }
    const run = chain.then(async () => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = await work((sql, p = []) => Promise.resolve(sqlite(sql, p)));
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    });
    chain = run.catch(() => {});
    return run;
  }
  async function ready() {
    if (!initialization)
      initialization = (
        pool
          ? transaction(async (q) => {
              await q('SELECT pg_advisory_xact_lock(hashtext($1))', [
                `tnbnb_email_schema:${schema}`,
              ]);
              await q(ddl);
            })
          : Promise.resolve().then(() => db.exec(ddl))
      ).catch((error) => {
        initialization = undefined;
        throw error;
      });
    await initialization;
  }
  const run = async (work) => {
    await ready();
    return transaction(work);
  };
  return {
    close: async () => {
      await chain;
      if (pool) await pool.end();
      else db.close();
    },
    verified: (account) =>
      run(async (q) =>
        Boolean(
          (await q('SELECT 1 FROM account_email_verified WHERE account_id=$1', [account]))[0],
        ),
      ),
    issue: (account, purpose, hash, expires) =>
      run(async (q) => {
        await q('DELETE FROM account_email_tokens WHERE account_id=$1 AND purpose=$2', [
          account,
          purpose,
        ]);
        await q('INSERT INTO account_email_tokens VALUES($1,$2,$3,$4)', [
          hash,
          account,
          purpose,
          expires,
        ]);
      }),
    verify: (hash) =>
      run(async (q) => {
        const row = (
          await q(
            "DELETE FROM account_email_tokens WHERE hash=$1 AND purpose='verify' AND expires_at>$2 RETURNING account_id",
            [hash, Date.now()],
          )
        )[0];
        if (!row) return false;
        await q(
          'INSERT INTO account_email_verified VALUES($1,$2) ON CONFLICT(account_id) DO UPDATE SET verified_at=excluded.verified_at',
          [row.account_id, new Date().toISOString()],
        );
        return true;
      }),
    reset: (hash, passwordHash, recoveryHash) =>
      run(async (q) => {
        const row = (
          await q(
            "DELETE FROM account_email_tokens WHERE hash=$1 AND purpose='reset' AND expires_at>$2 RETURNING account_id",
            [hash, Date.now()],
          )
        )[0];
        if (!row) return false;
        await q('UPDATE accounts SET password_hash=$1,recovery_hash=$2,updated_at=$3 WHERE id=$4', [
          passwordHash,
          recoveryHash,
          new Date().toISOString(),
          row.account_id,
        ]);
        await q('DELETE FROM account_sessions WHERE account_id=$1', [row.account_id]);
        await q('DELETE FROM account_email_tokens WHERE account_id=$1', [row.account_id]);
        return true;
      }),
    enqueue: (key, payload) =>
      run(async (q) => {
        const id = randomUUID();
        await q(
          "INSERT INTO email_outbox(id,job_key,payload,state,created_at) VALUES($1,$2,$3,'queued',$4) ON CONFLICT(job_key) DO NOTHING",
          [id, key, JSON.stringify(payload), new Date().toISOString()],
        );
        return (await q('SELECT id FROM email_outbox WHERE job_key=$1', [key]))[0].id;
      }),
    pending: () =>
      run((q) =>
        q(
          "SELECT id FROM email_outbox WHERE attempts<5 AND state NOT IN ('sent','expired') AND locked_until<$1 ORDER BY created_at LIMIT 3",
          [Date.now()],
        ),
      ),
    claim: (id) =>
      run(async (q) => {
        const lease = randomUUID();
        const row = (
          await q(
            "UPDATE email_outbox SET state='sending',attempts=attempts+1,lease=$1,locked_until=$2 WHERE id=$3 AND state NOT IN ('sent','expired') AND attempts<5 AND locked_until<$4 RETURNING payload",
            [lease, Date.now() + 300000, id, Date.now()],
          )
        )[0];
        return row ? { id, lease, payload: JSON.parse(row.payload) } : null;
      }),
    complete: (id, lease, sent) =>
      run((q) =>
        q('UPDATE email_outbox SET state=$1,locked_until=$2 WHERE id=$3 AND lease=$4', [
          sent === true ? 'sent' : sent === 'expired' ? 'expired' : 'failed',
          sent === false ? Date.now() + 300000 : 0,
          id,
          lease,
        ]),
      ),
  };
}
