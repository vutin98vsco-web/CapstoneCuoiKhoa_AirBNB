import { NextResponse } from 'next/server';
import { currentUser } from '../../../../lib/auth/session.server';
import { knownProperty } from '../../../../lib/auth/service.server';
import { bookingStore } from '../../../../lib/bookings/store.server';
import { sameOrigin } from '../../../../lib/http.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request) {
  const user = currentUser(request.cookies); if (!user) return reply({ error: 'unauthorized' }, 401);
  return reply({ favorites: bookingStore().accounts.favorites(user.id) });
}
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  const user = currentUser(request.cookies); if (!user) return reply({ error: 'unauthorized' }, 401);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid_request' }, 415);
  try {
    const raw = await request.text(); if (raw.length > 1024) return reply({ error: 'invalid_request' }, 413);
    const body = JSON.parse(raw);
    if (!knownProperty(body?.propertyId) || typeof body.saved !== 'boolean') return reply({ error: 'invalid_request' }, 400);
    return reply({ favorites: bookingStore().accounts.saveFavorite(user.id, body.propertyId, body.saved) });
  } catch { return reply({ error: 'invalid_request' }, 400); }
}
