import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { currentUser } from '../../../../lib/auth/session.server';
import { bookingStore } from '../../../../lib/bookings/store.server';
import { sameOrigin } from '../../../../lib/http.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request) {
  const user = currentUser(request.cookies); if (!user) return reply({ error: 'unauthorized' }, 401);
  const bytes = bookingStore().accounts.avatar(user.id); if (!bytes) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  const user = currentUser(request.cookies); if (!user) return reply({ error: 'unauthorized' }, 401);
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return reply({ error: 'avatar_invalid' }, 415);
  if (Number(request.headers.get('content-length')) > 2200000) return reply({ error: 'avatar_large' }, 413);
  try {
    // Bound streamed bodies too; a missing Content-Length must not bypass the limit.
    const reader = request.body.getReader(); const chunks = []; let size = 0;
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 2200000) { await reader.cancel(); return reply({ error: 'avatar_large' }, 413); } chunks.push(part.value); }
    const parsed = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') } }).formData();
    const file = parsed.get('avatar');
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reply({ error: 'avatar_invalid' }, 400);
    if (file.size > 2 * 1024 * 1024) return reply({ error: 'avatar_large' }, 413);
    const bytes = Buffer.from(await file.arrayBuffer()); const meta = await sharp(bytes, { limitInputPixels: 16000000 }).metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format) || (meta.pages || 1) > 1) return reply({ error: 'avatar_invalid' }, 400);
    const image = await sharp(bytes, { limitInputPixels: 16000000 }).rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
    if (!currentUser(request.cookies)) return reply({ error: 'unauthorized' }, 401);
    return reply({ user: bookingStore().accounts.setAvatar(user.id, image) });
  } catch { return reply({ error: 'avatar_invalid' }, 400); }
}
export async function DELETE(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  const user = currentUser(request.cookies); if (!user) return reply({ error: 'unauthorized' }, 401);
  return reply({ user: bookingStore().accounts.removeAvatar(user.id) });
}
