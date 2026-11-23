import { NextResponse } from 'next/server';
import { localeCookie, supportedLocales } from '../../lib/i18n';

export async function POST(request) {
  const data = await request.formData();
  const locale = data.get('locale');
  if (!supportedLocales.includes(locale)) return new Response(null, { status: 400 });
  const requestedPath = data.get('returnTo');
  const path = typeof requestedPath === 'string' && /^\/(?!\/)/.test(requestedPath) && !/[\\\u0000-\u0020]/.test(requestedPath) ? requestedPath : '/';
  // A relative redirect keeps the browser's public host behind a reverse proxy.
  const response = new NextResponse(null, { status: 303, headers: { Location: path } });
  response.cookies.set(localeCookie, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax' });
  return response;
}
