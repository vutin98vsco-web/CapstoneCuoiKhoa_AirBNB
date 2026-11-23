import { NextResponse } from 'next/server';
import { bookingCookie, bookingStore, newSession, sessionHash, sessionLifetime } from '../../../../lib/bookings/store.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const response = NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  const hash = sessionHash(request.cookies.get(bookingCookie)?.value);
  if (!hash || bookingStore().accounts.isClaimed(hash)) response.cookies.set(bookingCookie, newSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: sessionLifetime, path: '/' });
  return response;
}
