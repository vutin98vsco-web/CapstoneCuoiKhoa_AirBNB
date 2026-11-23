import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { encryptBackup, decryptBackup } from '../lib/backup-crypto.js';
import { siteUrl } from '../lib/site.js';
test('encrypted backups require the private key and reject tampering', () => {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 }), input = Buffer.from('PGDMP synthetic backup data');
  const encrypted = encryptBackup(input, pair.publicKey);
  assert.ok(!encrypted.includes(input)); assert.deepEqual(decryptBackup(encrypted, pair.privateKey), input);
  const altered = JSON.parse(encrypted); const data = Buffer.from(altered.data,'base64'); data[0] ^= 1; altered.data = data.toString('base64');
  assert.throws(() => decryptBackup(Buffer.from(JSON.stringify(altered)),pair.privateKey));
  const wrong = generateKeyPairSync('rsa', { modulusLength: 2048 }); assert.throws(() => decryptBackup(encrypted,wrong.privateKey));
});
test('canonical URLs come from trusted site configuration', () => {
  const old = process.env.SITE_URL;
  try { process.env.SITE_URL = 'https://tnbnb.vercel.app/path'; assert.equal(siteUrl(),'https://tnbnb.vercel.app'); process.env.SITE_URL='https://user:secret@example.test'; assert.throws(siteUrl); process.env.SITE_URL='http://example.test'; assert.throws(siteUrl); }
  finally { if (old === undefined) delete process.env.SITE_URL; else process.env.SITE_URL=old; }
});
