import { NextResponse } from 'next/server';
import { bookingStore } from '../../../../../lib/bookings/store.server';
import { bookingOwner } from '../../../../../lib/auth/session.server';
import { sameOrigin } from '../../../../../lib/http.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request, { params }) {
  const respond = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
  if (!sameOrigin(request)) return respond({ error: 'invalid_origin' }, 403);
  const owner = bookingOwner(request.cookies);
  if (!owner) return respond({ error: 'not_found' }, 404);
  const { id } = await params;
  try { const booking = bookingStore().cancel(owner, id); return booking ? respond({ id: booking.id, status: booking.status }) : respond({ error: 'not_found' }, 404); }
  catch { return respond({ error: 'service_unavailable' }, 503); }
}
