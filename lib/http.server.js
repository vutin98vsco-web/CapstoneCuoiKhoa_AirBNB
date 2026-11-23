import { NextResponse } from 'next/server';
export const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
export function sameOrigin(request) {
  try {
    const value = request.headers.get('origin'), origin = new URL(value), url = new URL(request.url);
    // Standalone and reverse proxies may use an internal hostname in request.url.
    // The browser's destination remains the incoming Host; never trust a forwarded host.
    const host = request.headers.get('host') || url.host;
    const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.slice(0,-1);
    return ['http:','https:'].includes(origin.protocol) && value === origin.origin && origin.host.toLowerCase() === host.toLowerCase() && origin.protocol === `${protocol}:`;
  } catch { return false; }
}
export async function readJson(request, maximum = 65536) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Object.assign(new Error('invalid_request'), { code: 'invalid_request', status: 415 });
  const reader = request.body?.getReader(); if (!reader) throw Object.assign(new Error('invalid_request'), { code: 'invalid_request', status: 400 });
  const chunks = []; let length = 0;
  while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > maximum) { await reader.cancel(); throw Object.assign(new Error('invalid_request'), { code: 'invalid_request', status: 413 }); } chunks.push(part.value); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body; }
  catch { throw Object.assign(new Error('invalid_request'), { code: 'invalid_request', status: 400 }); }
}
export function errorReply(error) { if (error.name === 'CyberSoftError') return reply({ error: 'service_unavailable' },503); return reply({ error: error.code || 'service_unavailable', ...(error.fields ? { fields: error.fields } : {}) }, error.status || (error.code === 'not_found' ? 404 : error.code ? 400 : 503)); }
export function pageNumber(value) { const page = Number(value || 1); return Number.isInteger(page) && page >= 1 && page <= 10000 ? page : 1; }
