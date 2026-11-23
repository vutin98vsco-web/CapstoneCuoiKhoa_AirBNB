import { reply, sameOrigin, readJson, errorReply } from '../../../../lib/http.server';
import { bookingStore } from '../../../../lib/bookings/store.server';
import {
  emailConfigured,
  emailStore,
  emailTokenHash,
  sendAccountEmail,
} from '../../../../lib/email/service.server';
import { normalizeEmail, validEmail, validPassword } from '../../../../lib/auth/validation';
import { hashPassword, makeRecoveryCode, recoveryHash } from '../../../../lib/auth/password.server';
import { after } from 'next/server';
import { reportServerError } from '../../../../lib/observability';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  try {
    const input = await readJson(request, 2048);
    if (input.token) {
      const hash = emailTokenHash(input.token);
      if (!hash || !validPassword(input.password)) return reply({ error: 'invalid_request' }, 400);
      const code = makeRecoveryCode();
      const done = await (
        await emailStore()
      ).reset(hash, await hashPassword(input.password), recoveryHash(code));
      return done
        ? reply({ ok: true, recoveryCode: code })
        : reply({ error: 'token_invalid' }, 400);
    }
    if (!emailConfigured()) return reply({ error: 'email_unavailable' }, 503);
    const email = normalizeEmail(input.email);
    if (!validEmail(email)) return reply({ error: 'email_invalid' }, 400);
    const accounts = bookingStore().accounts;
    if (!(await accounts.allowed('email_reset', email))) return reply({ ok: true });
    await accounts.failure('email_reset', email);
    const user = await accounts.byEmail(email);
    if (user && !user.disabled)
      after(async () => {
        try {
          await sendAccountEmail(user, 'reset', input.locale);
        } catch (error) {
          reportServerError('account.email_reset', error);
        }
      });
    return reply({ ok: true });
  } catch (error) {
    return errorReply(error);
  }
}
