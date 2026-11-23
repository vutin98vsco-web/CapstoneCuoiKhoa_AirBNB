import { reply, sameOrigin, readJson, errorReply, pageNumber } from '../../../lib/http.server';
import { currentUser } from '../../../lib/auth/session.server';
import { bookingStore } from '../../../lib/bookings/store.server';
import { currentProperties } from '../../../lib/admin/catalog.server';
import { getCatalog } from '../../../lib/catalog';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function exists(id) { return typeof id === 'string' && ((await currentProperties()).some(property => property.id === id) || id.startsWith('api-') && (await getCatalog()).rooms.some(property => property.id === id)); }
export async function GET(request) {
  try {
    const query = new URL(request.url).searchParams, propertyId = query.get('propertyId'); if (!await exists(propertyId)) return reply({ error: 'not_found' },404);
    const user = (await currentUser(request.cookies)), store = bookingStore().workspace;
    return reply({ ...await store.reviewList(propertyId,pageNumber(query.get('page')),query.get('order')),viewerId: user?.id || null,mine: user ? await store.ownReview(user.id,propertyId) : null });
  } catch (error) { return errorReply(error); }
}
async function write(request, editing = false, deleting = false) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' },403);
  try {
    const user = (await currentUser(request.cookies)); if (!user) return reply({ error: 'unauthorized' },401);
    const input = await readJson(request,8192), db = bookingStore(); if (!await exists(input.propertyId)) return reply({ error: 'not_found' },404);
    if (deleting) { await db.workspace.deleteReview(user.id,input.propertyId); return reply({ ok: true }); }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || typeof input.body !== 'string' || input.body.trim().length < 10 || input.body.trim().length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input.body)) return reply({ error: 'review_invalid' },400);
    if (!await db.accounts.allowed('review_write',user.id)) return reply({ error: 'rate_limited' },429);
    const mine = await db.workspace.saveReview(user.id,input.propertyId,{ rating: input.rating,body: input.body.trim() },editing); await db.accounts.failure('review_write',user.id);
    return reply({ mine },editing ? 200 : 201);
  } catch (error) { return errorReply(error); }
}
export const POST = request => write(request);
export const PUT = request => write(request,true);
export const DELETE = request => write(request,false,true);
