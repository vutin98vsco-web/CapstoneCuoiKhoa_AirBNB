import { NextResponse } from 'next/server';
import { currentUser } from '../../../../lib/auth/session.server';
import { accountAction, AuthError } from '../../../../lib/auth/service.server';
import { sameOrigin } from '../../../../lib/http.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request, { params }) {
  if ((await params).action !== 'session') return reply({ error: 'not_found' }, 404);
  try { return reply({ user: currentUser(request.cookies) }); } catch { return reply({ error: 'service_unavailable' }, 503); }
}
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid_request' }, 415);
  let body;
  try { const raw = await request.text(); if (raw.length > 16384) return reply({ error: 'invalid_request' }, 413); body = JSON.parse(raw); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); }
  catch { return reply({ error: 'invalid_request' }, 400); }
  try { const result = await accountAction((await params).action, body, request.cookies); const response = reply(result.body); result.cookies?.(response); return response; }
  catch (error) { return error instanceof AuthError ? reply({ error: error.code, ...(error.fields ? { fields: error.fields } : {}) }, error.status) : reply({ error: 'service_unavailable' }, 503); }
}
