import { reply, sameOrigin, readJson, errorReply, pageNumber } from '../../../../lib/http.server';
import { requireAdmin, adminAction } from '../../../../lib/admin/service.server';
import { currentProperties, currentCities } from '../../../../lib/admin/catalog.server';
import { bookingStore } from '../../../../lib/bookings/store.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    (await requireAdmin(request.cookies)); const { section } = await params, query = new URL(request.url).searchParams, page = pageNumber(query.get('page')), q = (query.get('q') || '').slice(0,200), store = bookingStore().workspace;
    if (section === 'overview') { const properties = (await currentProperties()), types = properties.flatMap(property => property.roomTypes); return reply({ ...await store.stats(),properties: properties.length,roomTypes: types.length,cities: (await currentCities()).length,quality: { priced: types.filter(room => room.price).length,capacityKnown: types.filter(room => room.capacity).length,photoReady: types.filter(room => room.images.length >= 3).length } }); }
    if (['users','bookings','reviews','audit'].includes(section)) { const result = section === 'audit' ? await store.audit(page) : section === 'reviews' ? await store.moderation(q,page) : await store[section](q,page); return reply({ ...result,page,pages: Math.max(1,Math.ceil(result.count/20)) }); }
    if (section === 'cities') return reply({ items: (await currentCities(true)) });
    if (section === 'properties') { const all = (await currentProperties(true)), filtered = all.filter(property => `${property.tenPhong} ${property.viTri}`.toLowerCase().includes(q.toLowerCase())); return reply({ items: filtered.slice((page-1)*20,page*20),count: filtered.length,page,pages: Math.max(1,Math.ceil(filtered.length/20)),cities: (await currentCities()) }); }
    return reply({ error: 'not_found' },404);
  } catch (error) { return errorReply(error); }
}
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' },403);
  try { const user = (await requireAdmin(request.cookies)), body = await readJson(request), result = await adminAction((await params).section,body,user,request.cookies); return reply({ ok: true,...result }); }
  catch (error) { return errorReply(error); }
}
