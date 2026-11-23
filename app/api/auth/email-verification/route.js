import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/http.server';
import { emailStore, emailTokenHash } from '../../../../lib/email/service.server';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const form = await request.formData(),
    hash = emailTokenHash(form.get('token'));
  const valid = hash && (await (await emailStore()).verify(hash));
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/xac-minh-email?status=${valid ? 'ok' : 'invalid'}` },
  });
}
