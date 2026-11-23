import { bookingStore, bookingCookie, sessionHash, newSession, sessionLifetime } from '../bookings/store.server.js';
export const accountCookie = 'tnbnb-account-session';
export function currentUser(cookies) {
  const hash = sessionHash(cookies.get(accountCookie)?.value);
  return hash ? bookingStore().accounts.session(hash) : null;
}
export function bookingOwner(cookies) {
  const user = currentUser(cookies);
  if (user) return `account:${user.id}`;
  const guest = sessionHash(cookies.get(bookingCookie)?.value);
  return guest && !bookingStore().accounts.isClaimed(guest) ? guest : null;
}
export function setAccountSession(response, token, remember) {
  response.cookies.set(accountCookie, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', ...(remember ? { maxAge: 30*24*60*60 } : {}) });
}
export function rotateGuestCookie(response) {
  response.cookies.set(bookingCookie, newSession(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionLifetime });
}
