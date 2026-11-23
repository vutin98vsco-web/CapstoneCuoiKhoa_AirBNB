import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const dummy = `scrypt$32768$8$1$${'00'.repeat(16)}$${'00'.repeat(64)}`;
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return `scrypt$32768$8$1$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded = dummy) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const parts = String(encoded || dummy).split('$');
  if (parts.slice(0,4).join('$') !== 'scrypt$32768$8$1' || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const key = await derive(password, parts[4], 64, options);
  return timingSafeEqual(key, Buffer.from(parts[5], 'hex'));
}
export function makeRecoveryCode() { return randomBytes(20).toString('hex').toUpperCase().match(/.{4}/g).join('-'); }
export function recoveryHash(value) {
  if (typeof value !== 'string') return null;
  const code = value.replace(/[\s-]/g, '').toLowerCase();
  return /^[a-f0-9]{40}$/.test(code) ? createHash('sha256').update(code).digest('hex') : null;
}
export function matchRecovery(value, expected) {
  const actual = recoveryHash(value);
  return Boolean(actual && expected && /^[a-f0-9]{64}$/.test(expected) && timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex')));
}
