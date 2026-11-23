import { timingSafeEqual } from 'node:crypto';
import { deliverEmails, emailConfigured } from '../../../../lib/email/service.server';
import { reply } from '../../../../lib/http.server';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ''}`),
    actual = Buffer.from(request.headers.get('authorization') || '');
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return reply({ error: 'unauthorized' }, 401);
  if (!emailConfigured()) return reply({ status: 'not_configured' });
  await deliverEmails();
  return reply({ status: 'processed' });
}
