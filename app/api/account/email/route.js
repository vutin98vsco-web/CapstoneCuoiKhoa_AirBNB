import { reply, sameOrigin, errorReply } from '../../../../lib/http.server';
import { requireUser } from '../../../../lib/auth/service.server';
import { bookingStore } from '../../../../lib/bookings/store.server';
import {
  emailConfigured,
  emailStore,
  sendAccountEmail,
} from '../../../../lib/email/service.server';
export const runtime = 'nodejs';
export async function GET(request) {
  try {
    const user = await requireUser(request.cookies);
    return reply({
      configured: emailConfigured(),
      verified: await (await emailStore()).verified(user.id),
    });
  } catch (error) {
    return errorReply(error);
  }
}
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  try {
    const user = await requireUser(request.cookies);
    if (!emailConfigured()) return reply({ error: 'email_unavailable' }, 503);
    const account = bookingStore().accounts;
    if (!(await account.allowed('verify_email', user.id)))
      return reply({ error: 'rate_limited' }, 429);
    await account.failure('verify_email', user.id);
    await sendAccountEmail(user, 'verify', request.cookies.get('tnbnb-language')?.value);
    return reply({ ok: true });
  } catch (error) {
    return errorReply(error);
  }
}
