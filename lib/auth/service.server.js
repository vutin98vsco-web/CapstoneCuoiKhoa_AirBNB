import { bookingCookie, bookingStore, sessionHash, newSession } from '../bookings/store.server.js';
import { currentUser, accountCookie, setAccountSession, rotateGuestCookie } from './session.server.js';
import { normalizeEmail, validEmail, validPassword, profileValues } from './validation.js';
import { hashPassword, verifyPassword, makeRecoveryCode, recoveryHash, matchRecovery } from './password.server.js';
import { referenceRooms } from '../reference-catalog.js';
export class AuthError extends Error {
  constructor(code, status = 400, fields) { super(code); this.code = code; this.status = status; this.fields = fields; }
}
const fail = (code, status, fields) => { throw new AuthError(code, status, fields); };
export async function requireUser(cookies) { const user = await currentUser(cookies); if (!user) fail('unauthorized', 401); return user; }
const propertyIds = new Set(referenceRooms.map(room => String(room.id)));
export const knownProperty = id => typeof id === 'string' && (propertyIds.has(id) || /^api-[1-9]\d{0,9}$/.test(id));
export async function accountAction(action, input, cookies) {
  const store = bookingStore().accounts, email = normalizeEmail(input.email), profile = profileValues(input), fields = {};
  if (['login', 'register', 'reset'].includes(action) && !validEmail(email)) fields.email = 'email_invalid';
  if (['register', 'password', 'reset'].includes(action) && !validPassword(input.password)) fields.password = 'password_invalid';
  if (['register', 'profile'].includes(action)) Object.assign(fields, profile.fields);
  if (Object.keys(fields).length) fail('validation', 400, fields);
  async function limited(scope, subject) { if (!await store.allowed(scope, subject)) fail('rate_limited', 429); }
  async function passwordCheck(user, password, scope) {
    await limited(scope, user.id); const hash = (await store.credentials(user.id))?.password_hash;
    if (!await verifyPassword(password, hash)) { await store.failure(scope, user.id); fail('current_password', 403); }
    if (!await currentUser(cookies) || (await store.credentials(user.id))?.password_hash !== hash) fail('unauthorized', 401);
    await store.clearFailures(scope, user.id);
  }
  async function signedIn(user, recoveryCode) {
    const token = newSession(), remember = Boolean(input.remember), guestOwner = sessionHash(cookies.get(bookingCookie)?.value);
    const favorites = Array.isArray(input.favoriteIds) ? [...new Set(input.favoriteIds.map(String).filter(knownProperty))].slice(0, 80) : [];
    await store.createSession(user.id, sessionHash(token), Date.now() + (remember ? 30 : 1) * 86400000, guestOwner && !await store.isClaimed(guestOwner) ? guestOwner : null, favorites);
    const previous = sessionHash(cookies.get(accountCookie)?.value); if (previous) await store.revokeSession(previous);
    return { body: { user, ...(recoveryCode ? { recoveryCode } : {}) }, cookies: response => { setAccountSession(response, token, remember); rotateGuestCookie(response); } };
  }
  switch (action) {
    case 'register': {
      const recoveryCode = makeRecoveryCode();
      const user = await store.register({ email, name: profile.name, phone: profile.phone, passwordHash: await hashPassword(input.password), recoveryHash: recoveryHash(recoveryCode) });
      if (!user) fail('email_exists', 409);
      return signedIn(user, recoveryCode);
    }
    case 'login': {
      await limited('login', email); const record = await store.byEmail(email), valid = await verifyPassword(input.password, record?.password_hash);
      const fresh = record ? await store.credentials(record.id) : null;
      if (!valid || !fresh || fresh.disabled || fresh.password_hash !== record.password_hash) { await store.failure('login', email); fail('credentials_invalid', 401); }
      await store.clearFailures('login', email); return signedIn(await store.publicById(record.id));
    }
    case 'logout': {
      const hash = sessionHash(cookies.get(accountCookie)?.value); if (hash) await store.revokeSession(hash);
      return { body: { user: null }, cookies: response => { response.cookies.set(accountCookie, '', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 0 }); rotateGuestCookie(response); } };
    }
    case 'profile': return { body: { user: await store.updateProfile((await requireUser(cookies)).id, profile) } };
    case 'password': {
      const user = await requireUser(cookies); await passwordCheck(user, input.currentPassword, 'password');
      if (input.currentPassword === input.password) fail('password_unchanged');
      const oldHash = (await store.credentials(user.id)).password_hash, hash = await hashPassword(input.password);
      if (!await currentUser(cookies) || (await store.credentials(user.id)).password_hash !== oldHash) fail('unauthorized', 401);
      await store.updatePassword(user.id, hash); return signedIn(user);
    }
    case 'recovery': {
      const user = await requireUser(cookies); await passwordCheck(user, input.currentPassword, 'recovery');
      const recoveryCode = makeRecoveryCode(); await store.rotateRecovery(user.id, recoveryHash(recoveryCode)); return { body: { recoveryCode } };
    }
    case 'reset': {
      await limited('reset', email); const record = await store.byEmail(email);
      if (!record || !matchRecovery(input.recoveryCode, record.recovery_hash)) { await store.failure('reset', email); fail('recovery_wrong', 401); }
      const passwordHash = await hashPassword(input.password), recoveryCode = makeRecoveryCode();
      if (!await store.updatePassword(record.id, passwordHash, recoveryHash(recoveryCode), record.recovery_hash)) fail('recovery_wrong', 401);
      await store.clearFailures('reset', email); return { body: { recoveryCode } };
    }
    default: fail('not_found', 404);
  }
}
