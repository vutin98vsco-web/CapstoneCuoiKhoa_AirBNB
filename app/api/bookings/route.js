import { NextResponse } from 'next/server';
import { bookingCookie, bookingStore, sessionHash, sessionLifetime } from '../../../lib/bookings/store.server';
import { currentBookingOffer as findBookingOffer, makeBookingSnapshot } from '../../../lib/bookings/offers.server';
import { validateBooking } from '../../../lib/bookings/validation';
import { bookingOwner } from '../../../lib/auth/session.server';
import { sameOrigin } from '../../../lib/http.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request) {
  const owner = bookingOwner(request.cookies);
  try { return reply({ bookings: owner ? bookingStore().list(owner) : [] }); }
  catch { return reply({ error: 'service_unavailable' }, 503); }
}
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid_request' }, 415);
  const key = request.headers.get('idempotency-key');
  if (!key || !/^[a-zA-Z0-9-]{16,80}$/.test(key)) return reply({ error: 'invalid_request' }, 400);
  let body;
  try { const text = await request.text(); if (text.length > 16384) return reply({ error: 'invalid_request' }, 413); body = JSON.parse(text); }
  catch { return reply({ error: 'invalid_request' }, 400); }
  const offer = findBookingOffer(body?.propertyId, body?.roomTypeId);
  if (!offer) return reply({ error: 'room_unavailable' }, 404);
  const { errors, value } = validateBooking(body, offer.capacity);
  if (Object.keys(errors).length) return reply({ error: 'validation', fields: errors }, 400);
  if (body.quoteVersion !== offer.quoteVersion) return reply({ error: 'quote_changed' }, 409);
  const token = request.cookies.get(bookingCookie)?.value;
  const owner = bookingOwner(request.cookies);
  if (!owner) return reply({ error: 'session_required' }, 409);
  try {
    const result = bookingStore().create(owner, key, value, makeBookingSnapshot(offer, value));
    if (result.error) return reply(result, 409);
    const response = reply({ id: result.booking.id, reference: result.booking.reference, status: result.booking.status }, result.replay ? 200 : 201);
    if (sessionHash(token)) response.cookies.set(bookingCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: sessionLifetime, path: '/' });
    return response;
  } catch { return reply({ error: 'service_unavailable' }, 503); }
}
